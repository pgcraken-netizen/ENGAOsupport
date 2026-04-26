# えんがお スタッフ支援LIFFアプリ 開発仕様書

## プロジェクト概要

特別養護老人ホーム「えんがお」のスタッフが、LINEアプリ内から利用者の食事量・体調を記録するLIFFアプリ。

| 項目 | 内容 |
|------|------|
| サービス名 | えんがお スタッフ支援 |
| 本番URL | https://engao-support.vercel.app |
| リポジトリ | pgcraken-netizen/ENGAOsupport |
| デプロイブランチ | `production` |
| LIFF ID | `2009872553-lEutIel4` |

---

## 技術スタック

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 16.2.3 | フロントエンドフレームワーク |
| React | 19.2.4 | UI |
| TypeScript | ^5 | 型安全 |
| @line/liff | ^2.25.0 | LINE認証・プロフィール取得 |
| @supabase/supabase-js | ^2.46.0 | データベース接続 |
| Vercel | - | ホスティング（静的エクスポート） |
| Supabase | - | PostgreSQL（BaaS） |

---

## アーキテクチャの重要な決定事項

### 1. 静的エクスポート（SSRなし）

```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
};
```

**理由：** LIFFアプリはブラウザのみで動作するため、サーバーサイドレンダリングは不要。静的エクスポートにすることでVercelのサーバーレス関数を使わずにデプロイできる。

### 2. スタッフ認証にDBを使わない

**旧設計（廃止）：** `staff` テーブルにLINE User IDを登録して突合する  
**現設計：** `liff.getProfile()` で取得したLINEプロフィールをそのまま使用

```ts
const profile = await liff.getProfile();
setStaffName(profile.displayName);   // staff_name として records に保存
setStaffLineId(profile.userId);      // line_user_id として records に保存
```

**理由：** Supabaseの `sb_publishable_*` 形式のAPIキーはPostgRESTで `anon` ロールとして認識されず、スタッフ照合クエリが常に0件返ってエラーになった。staffテーブル廃止によりこの問題を根本解消した。

### 3. Supabase接続設定

```ts
// lib/supabase.ts
export const supabase = createClient(
  "https://uoazvxiwtstsqxsameya.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // JWT形式のanon key
);
```

**重要：** Supabase APIキーは必ず `eyJ` で始まるJWT形式のものを使うこと。Supabase新UIで発行される `sb_publishable_*` 形式のキーはPostgRESTで動作しない（2024年時点の既知問題）。

---

## ファイル構成

```
ENGAOsupport/
├── app/
│   ├── layout.tsx          # HTMLルート・メタデータ
│   ├── page.tsx            # メインページ（LiffApp をレンダリング）
│   ├── globals.css         # CSS変数・スピナー等
│   ├── LiffApp.tsx         # メインアプリ（LIFF認証・利用者選択・記録フォーム）
│   ├── ViewPanel.tsx       # 記録閲覧パネル
│   ├── AdminDashboard.tsx  # 管理ダッシュボード（/admin）
│   └── admin/
│       └── page.tsx        # 管理画面ルート
├── lib/
│   └── supabase.ts         # Supabaseクライアント
├── types/
│   └── index.ts            # 型定義（Meal, Condition, Resident）
├── supabase/
│   └── schema.sql          # DBスキーマ（要手動実行）
├── next.config.ts          # output:"export" + distDir:"dist"
└── vercel.json             # framework:null（重要）
```

---

## データベーススキーマ（Supabase）

**プロジェクトID：** `uoazvxiwtstsqxsameya`  
**スキーマファイル：** `supabase/schema.sql`

### residentsテーブル（利用者）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| name | TEXT | 氏名 |
| kana | TEXT | ふりがな（任意） |
| room | TEXT | 部屋番号（任意） |
| unit | TEXT | グループ名（つむぎ/ひととなり/むすび） |
| is_active | BOOLEAN | 表示フラグ |
| created_at | TIMESTAMPTZ | 作成日時 |

### recordsテーブル（記録）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| line_user_id | TEXT | LINEユーザーID |
| staff_name | TEXT | スタッフ名（LINEのdisplayName） |
| resident_id | UUID | FK → residents.id |
| meal | TEXT | full/normal/half/none |
| condition | TEXT | normal/slightly_poor/poor |
| note | TEXT | メモ |
| recorded_at | TIMESTAMPTZ | 記録日時 |

### RLS・権限設定

```sql
-- RLS有効化
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE records   ENABLE ROW LEVEL SECURITY;

-- ポリシー（全件読み書き可）
CREATE POLICY "residents_select" ON residents FOR SELECT USING (true);
CREATE POLICY "records_select"   ON records   FOR SELECT USING (true);
CREATE POLICY "records_insert"   ON records   FOR INSERT WITH CHECK (true);

-- 権限付与（anonロール必須）
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT         ON residents TO anon, authenticated;
GRANT SELECT, INSERT ON records   TO anon, authenticated;
```

**注意：** ポリシー作成だけでは不十分。`GRANT` も必ず実行すること。

---

## Vercelデプロイ設定

### vercel.json（必須設定）

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null
}
```

**`framework: null` が必須な理由：** これを省略するとVercelがNext.jsフレームワークを自動検出し、`.next/routes-manifest.json` を探してエラーになる。`output: "export"` の場合は `.next/` ではなく `dist/` に出力されるため、フレームワーク検出を無効化する必要がある。

### デプロイフロー

1. `production` ブランチにpush
2. Vercelが自動検出してビルド（`npm run build`）
3. `dist/` 以下が静的ファイルとして公開される

---

## 環境変数

本番ではVercel環境変数に設定するが、静的エクスポートのためビルド時に値がJSバンドルに埋め込まれる。設定がない場合は `lib/supabase.ts` と `app/LiffApp.tsx` のフォールバック値が使われる。

| 変数名 | フォールバック値 | 説明 |
|--------|----------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://uoazvxiwtstsqxsameya.supabase.co` | SupabaseプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | JWT形式のanonキー |
| `NEXT_PUBLIC_LIFF_ID` | `2009872553-lEutIel4` | LINE LIFF ID |

---

## 利用者データ（初期登録済み17名）

| ユニット | 利用者 |
|---------|--------|
| つむぎ | 小高純雄、中村真一、伊藤靖彦、須永翔大、大野次男、井上靖則 |
| ひととなり | 古谷真悠、福田有希、尾引里美、菰方加代子、後藤彩香、佐藤瑠南、花塚有紗 |
| むすび | 福田勝徳、國井文隆、石下竜哉、大宮司透 |

---

## ハマりやすいポイント（過去のエラー集）

### ❌ Vercel「routes-manifest.json not found」

**原因：** `framework: null` を設定しないと、VercelがNext.jsビルダーを使って `.next/routes-manifest.json` を探す。`output: "export"` では `.next/` は生成されない。  
**対処：** `vercel.json` に `"framework": null` を必ず設定する。

---

### ❌ Vercel「No Output Directory named 'dist' found」

**原因：** Vercelダッシュボードの「Output Directory」設定と `next.config.ts` の `distDir` が一致していない。  
**対処：** `next.config.ts` に `distDir: "dist"` を設定し、`vercel.json` の `outputDirectory` を `"dist"` にする。

---

### ❌ LIFF「アプリを起動できませんでした」

**原因：** `NEXT_PUBLIC_LIFF_ID` がVercelに設定されておらず `undefined` がJSに埋め込まれる。  
**対処：** `app/LiffApp.tsx` でフォールバック値を持つ。
```ts
await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID ?? "2009872553-lEutIel4" });
```

---

### ❌ Supabaseクエリが常に0件返る

**原因：** `sb_publishable_*` 形式のAPIキーはPostgRESTで `anon` ロールとして認識されない。  
**対処：** Supabase Settings > API から `eyJ` で始まるJWT形式のanon keyを取得して使う。

---

### ❌ PGRST116「cannot coerce result to single JSON object」

**原因：** `.single()` は結果が0件のときエラーを投げる。  
**対処：** `.limit(1)` + `data?.[0] ?? null` を使う。

---

### ❌ 「このLINEアカウントは登録されていません」

**原因（旧設計）：** staffテーブルにLINE User IDを登録する仕組みで、クエリが0件返ると「未登録」エラーになった。  
**対処（現設計）：** staffテーブルを廃止。LINEプロフィールをそのままrecordsテーブルに保存する設計に変更。

---

### ❌ TypeScript「Module '@/types' has no exported member 'Category'」

**原因：** 旧アプリのファイル（`RecordForm.tsx`, `lib/dictionary.ts` 等）を削除した後も型参照が残っていた。  
**対処：** 旧ファイルを完全削除する。

---

### ❌ 「利用者が登録されていません」（DBにデータはあるのに）

**原因：** `supabase/schema.sql` を実行したSupabaseプロジェクトと、アプリが接続しているプロジェクトが異なっていた。  
**対処：** `lib/supabase.ts` のURLをSQLを実行したプロジェクトに合わせる。

---

## スキーマ再構築の手順（DBをリセットする場合）

1. Supabase SQL Editor（`https://supabase.com/dashboard/project/uoazvxiwtstsqxsameya/sql/new`）を開く
2. `supabase/schema.sql` の内容を貼り付けて「Run」
3. 「Success. No rows returned」が出れば完了

---

## LIFFアプリの画面フロー

```
起動
  └→ LIFF初期化 + LINEログイン
      └→ LINEプロフィール取得（staffName, staffLineId）
          └→ residents取得（Supabase）
              └→ 記録する タブ
                  ├→ [Select] ユニット絞り込み + 利用者選択
                  ├→ [Form] 食事量・体調・メモ入力
                  ├→ [Saving] 保存中スピナー
                  └→ [Success] 完了画面
              └→ 閲覧 タブ（ViewPanel）
                  └→ 期間・利用者フィルタ + 記録一覧
```

---

## 管理ダッシュボード（/admin）

- URL: `https://engao-support.vercel.app/admin`
- 認証なし（URLを知っていれば誰でもアクセス可）
- 機能: 期間別集計、利用者別集計、CSVエクスポート、印刷/PDF

---

*最終更新: 2026-04-26*
