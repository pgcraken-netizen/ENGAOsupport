// ──── 介護施設 LIFF アプリ用 ────

export type Meal = "full" | "normal" | "half" | "none";
export type Condition = "normal" | "slightly_poor" | "poor";

export type Staff = {
  id: string;
  line_user_id: string;
  name: string;
  is_active: boolean;
};

export type Resident = {
  id: string;
  name: string;
  kana: string | null;
  room: string | null;
  is_active: boolean;
};

// ──── 連絡帳サポートアプリ用（既存） ────

export type Category = "順調" | "軽確認" | "注意";

export type SlotName = "全体" | "活動" | "対人" | "出来事" | "まとめ";

export type DictEntry = {
  raw: string[];
  normalized: string;
  slot: SlotName;
  category: Category;
};

export type Template = {
  id: string;
  category: Category;
  triggerKeywords: string[];
  slots: Partial<Record<SlotName, string>>;
  outputTemplate: string;
  sampleOutput: string;
};

export type EngineInput = {
  childName: string;
  rawInput: string;
};

export type EngineOutput = {
  childName: string;
  rawInput: string;
  outputText: string;
  category: Category;
  usedTemplateId: string;
};
