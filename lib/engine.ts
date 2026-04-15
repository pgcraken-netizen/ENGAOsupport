import { DICTIONARY } from "./dictionary";
import { TEMPLATES } from "./templates";
import { sanitize } from "./sanitizer";
import type { Category, EngineInput, EngineOutput, SlotName, Template } from "@/types";

// キーワード直接判定（仕様 §7 より）
const ALERT_KEYWORDS = [
  "転んだ", "ケガ", "トラブル", "泣いた", "けんか",
  "ぶつけた", "頭痛い", "お腹痛い", "興奮", "吐いた", "体調", "傷",
];

const CAUTION_KEYWORDS = [
  "眠い", "眠そう", "疲れ", "疲れた", "少し",
  "しんどそう", "食べなかった", "集中できなかった", "甘えてた",
];

export function formatRecord(input: EngineInput): EngineOutput {
  const rawTokens = splitInput(input.rawInput);
  const normalizedTokens = rawTokens.map(normalize);

  // ── カテゴリ初期判定：生テキストのキーワード直接チェック
  const joinedRaw = rawTokens.join("");
  let category: Category = "順調";
  if (ALERT_KEYWORDS.some(k => joinedRaw.includes(k))) {
    category = "注意";
  } else if (CAUTION_KEYWORDS.some(k => joinedRaw.includes(k))) {
    category = "軽確認";
  }

  // ── 辞書マッチング → スロット埋め
  const slotMap: Partial<Record<SlotName, string>> = {};

  for (const token of normalizedTokens) {
    if (token.length < 2) continue;
    for (const entry of DICTIONARY) {
      if (slotMap[entry.slot]) continue; // スロット埋め済みはスキップ
      const normalizedRaws = entry.raw.map(normalize);
      const hit = normalizedRaws.some(
        r => r.length >= 2 && (r.includes(token) || token.includes(r)),
      );
      if (hit) {
        slotMap[entry.slot] = entry.normalized;
        // 辞書エントリのカテゴリでアップグレード
        if (entry.category === "注意") {
          category = "注意";
        } else if (entry.category === "軽確認" && category !== "注意") {
          category = "軽確認";
        }
      }
    }
  }

  // ── テンプレ選択
  const candidates = TEMPLATES.filter(t => t.category === category);
  const template = selectBestTemplate(candidates, slotMap);

  // ── スロット埋め（ユーザー入力由来 → テンプレデフォルト）
  let output = template.outputTemplate;
  for (const [slot, value] of Object.entries(slotMap)) {
    output = output.replace(`{${slot}}`, value);
  }
  for (const [slot, value] of Object.entries(template.slots)) {
    output = output.replace(`{${slot}}`, value as string);
  }

  // ── 児童名プレフィックス＋NG変換
  const prefix = input.childName ? `${input.childName}ですが、` : "";
  const finalOutput = sanitize(prefix + output);

  return {
    childName: input.childName,
    rawInput: input.rawInput,
    outputText: finalOutput,
    category,
    usedTemplateId: template.id,
  };
}

function splitInput(raw: string): string[] {
  return raw
    .split(/[\n、,，]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function normalize(text: string): string {
  return text
    // 全角英数 → 半角
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s =>
      String.fromCharCode(s.charCodeAt(0) - 0xFEE0),
    )
    // カタカナ → ひらがな（揺れ吸収）
    .replace(/[\u30A1-\u30F6]/g, s =>
      String.fromCharCode(s.charCodeAt(0) - 0x60),
    )
    // 空白除去
    .replace(/\s+/g, "")
    .trim();
}

function selectBestTemplate(
  candidates: Template[],
  slotMap: Partial<Record<SlotName, string>>,
): Template {
  const filledSlots = new Set(Object.keys(slotMap) as SlotName[]);
  const scored = candidates.map(t => {
    const templateSlots = new Set(Object.keys(t.slots) as SlotName[]);
    let score = 0;
    for (const s of filledSlots) {
      if (templateSlots.has(s)) score++;
    }
    return { template: t, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.template ?? candidates[0];
}
