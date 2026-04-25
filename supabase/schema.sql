-- ============================================================
-- えんがお スタッフ支援LIFFアプリ  Supabase スキーマ定義 v2
-- ============================================================
-- Supabase ダッシュボード > SQL Editor に貼り付けて実行してください
-- ============================================================

-- 既存テーブルを全削除（再実行可能）
DROP TABLE IF EXISTS records   CASCADE;
DROP TABLE IF EXISTS staff     CASCADE;
DROP TABLE IF EXISTS residents CASCADE;

-- ── テーブル作成 ──────────────────────────────────────────

CREATE TABLE residents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  kana       TEXT,
  room       TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL,
  staff_name   TEXT NOT NULL,
  resident_id  UUID NOT NULL REFERENCES residents(id),
  meal         TEXT NOT NULL CHECK (meal IN ('full','normal','half','none')),
  condition    TEXT NOT NULL CHECK (condition IN ('normal','slightly_poor','poor')),
  note         TEXT NOT NULL DEFAULT '',
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────────

ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE records   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "residents_select" ON residents FOR SELECT USING (true);
CREATE POLICY "records_select"   ON records   FOR SELECT USING (true);
CREATE POLICY "records_insert"   ON records   FOR INSERT WITH CHECK (true);

-- ── 権限付与 ──────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT           ON residents TO anon, authenticated;
GRANT SELECT, INSERT   ON records   TO anon, authenticated;

-- ── サンプル利用者データ（必要に応じてコメント解除） ────

-- INSERT INTO residents (name, kana, room) VALUES
--   ('田中 一郎', 'たなか いちろう', '101'),
--   ('佐藤 幸子', 'さとう ゆきこ',   '102'),
--   ('伊藤 健二', 'いとう けんじ',   '201'),
--   ('渡辺 みよ', 'わたなべ みよ',   '202');
