-- ============================================================
-- えんがお スタッフ支援LIFFアプリ  Supabase スキーマ定義
-- ============================================================
-- Supabase ダッシュボード > SQL Editor に貼り付けて実行してください
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. テーブル作成
-- ──────────────────────────────────────────────────────────

-- スタッフマスタ
CREATE TABLE IF NOT EXISTS staff (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id  TEXT NOT NULL UNIQUE,   -- LINE の userId（LIFF で取得）
  name          TEXT NOT NULL,           -- 表示名
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 利用者マスタ
CREATE TABLE IF NOT EXISTS residents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  kana       TEXT,                       -- ふりがな（検索・並び替え用）
  room       TEXT,                       -- 部屋番号
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 記録本体
CREATE TABLE IF NOT EXISTS records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id     UUID NOT NULL REFERENCES staff(id),
  resident_id  UUID NOT NULL REFERENCES residents(id),
  meal         TEXT NOT NULL CHECK (meal IN ('full','normal','half','none')),
  condition    TEXT NOT NULL CHECK (condition IN ('normal','slightly_poor','poor')),
  note         TEXT NOT NULL DEFAULT '',
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now()   -- クライアントから送らない
);

-- ──────────────────────────────────────────────────────────
-- 2. RLS（Row Level Security）
-- ──────────────────────────────────────────────────────────

ALTER TABLE staff     ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE records   ENABLE ROW LEVEL SECURITY;

-- anon キーで読み書きできるポリシー
-- ※ 本番では Supabase Auth と連携し、JWT でスタッフを識別するポリシーに強化してください

-- staff: 全スタッフ読み取り可（自分を確認するため）
CREATE POLICY "staff_select_all" ON staff
  FOR SELECT USING (true);

-- residents: 全利用者読み取り可
CREATE POLICY "residents_select_all" ON residents
  FOR SELECT USING (true);

-- records: 誰でも INSERT 可（スタッフ特定は staff_id で行う）
CREATE POLICY "records_insert" ON records
  FOR INSERT WITH CHECK (true);

-- records: 読み取り可（管理者機能フェーズ1以降で絞り込み）
CREATE POLICY "records_select_all" ON records
  FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────
-- 3. サンプルデータ（開発・テスト用）
-- ──────────────────────────────────────────────────────────
-- 実際の LINE userId と名前に書き換えて使用してください

-- INSERT INTO staff (line_user_id, name) VALUES
--   ('Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', '山田 太郎'),
--   ('Uyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy', '鈴木 花子');

-- INSERT INTO residents (name, kana, room) VALUES
--   ('田中 一郎', 'たなか いちろう', '101'),
--   ('佐藤 幸子', 'さとう ゆきこ',   '102'),
--   ('伊藤 健二', 'いとう けんじ',   '201'),
--   ('渡辺 みよ', 'わたなべ みよ',   '202');
