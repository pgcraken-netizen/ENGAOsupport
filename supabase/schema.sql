DROP TABLE IF EXISTS records   CASCADE;
DROP TABLE IF EXISTS residents CASCADE;

CREATE TABLE residents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  kana       TEXT,
  room       TEXT,
  unit       TEXT,
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

ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE records   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "residents_select" ON residents FOR SELECT USING (true);
CREATE POLICY "records_select"   ON records   FOR SELECT USING (true);
CREATE POLICY "records_insert"   ON records   FOR INSERT WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT         ON residents TO anon, authenticated;
GRANT SELECT, INSERT ON records   TO anon, authenticated;

INSERT INTO residents (name, unit) VALUES
  ('小高純雄', 'つむぎ'),
  ('中村真一', 'つむぎ'),
  ('伊藤靖彦', 'つむぎ'),
  ('須永翔大', 'つむぎ'),
  ('大野次男', 'つむぎ'),
  ('井上靖則', 'つむぎ'),
  ('古谷真悠', 'ひととなり'),
  ('福田有希', 'ひととなり'),
  ('尾引里美', 'ひととなり'),
  ('菰方加代子', 'ひととなり'),
  ('後藤彩香', 'ひととなり'),
  ('佐藤瑠南', 'ひととなり'),
  ('花塚有紗', 'ひととなり'),
  ('福田勝徳', 'むすび'),
  ('國井文隆', 'むすび'),
  ('石下竜哉', 'むすび'),
  ('大宮司透', 'むすび');
