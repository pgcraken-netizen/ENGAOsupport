const NG_REPLACEMENTS: { ng: string; safe: string }[] = [
  // 医療・診断系
  { ng: "発達障害",     safe: "ご本人のペース" },
  { ng: "ADHD",        safe: "気持ちが高ぶる" },
  { ng: "自閉症",      safe: "ご本人のペース" },
  { ng: "パニック発作", safe: "気持ちが高ぶる場面" },
  { ng: "パニック",    safe: "気持ちが高ぶる" },
  { ng: "てんかん",    safe: "体調の変化" },
  { ng: "発作",        safe: "体調の変化" },
  { ng: "症状",        safe: "様子" },
  { ng: "治療",        safe: "対応" },
  // 暴力・問題行動系
  { ng: "暴れた",      safe: "落ち着いて過ごせるよう支援が必要な場面がありました" },
  { ng: "叩いた",      safe: "お友達との関わりで支援が必要な場面がありました" },
  { ng: "蹴った",      safe: "お友達との関わりで支援が必要な場面がありました" },
  { ng: "噛んだ",      safe: "お友達との関わりで支援が必要な場面がありました" },
  { ng: "暴力",        safe: "関わりの中でのトラブル" },
  { ng: "物を投げた",  safe: "気持ちの表現が難しかった場面がありました" },
  // 断定・強い否定系
  { ng: "できない",    safe: "取り組む過程でサポートが必要でした" },
  { ng: "ダメだった",  safe: "難しさが見られました" },
  { ng: "問題がある",  safe: "気になる様子が見られました" },
  { ng: "危険",        safe: "念のためお知らせする" },
  // 感情的表現
  { ng: "大変だった",  safe: "スタッフが対応しました" },
  { ng: "困った",      safe: "スタッフがサポートしました" },
  { ng: "手がかかった", safe: "丁寧に対応しました" },
];

export function sanitize(text: string): string {
  let result = text;
  for (const { ng, safe } of NG_REPLACEMENTS) {
    result = result.replaceAll(ng, safe);
  }
  return result;
}
