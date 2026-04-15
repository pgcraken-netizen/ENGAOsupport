"use client";

import { useEffect, useRef, useState } from "react";
import { formatRecord } from "@/lib/engine";
import type { Category } from "@/types";

const CHILDREN = [
  "赤坂 太郎", "青山 花子", "井上 一郎", "上田 美咲", "大野 健太",
  "岡田 愛", "加藤 翔", "木村 さくら", "小林 大輝", "齋藤 りな",
  "佐藤 拓海", "鈴木 ひかり", "田中 颯太", "高橋 奈々", "中村 陽太",
  "西村 あおい", "林 蓮", "原田 ゆい", "福田 そうた", "松本 みお",
];

const QUICK_WORDS = [
  "笑顔", "元気", "宿題頑張った", "外遊び",
  "友達と遊んだ", "おもちゃ渡した", "転んだ", "泣いた",
  "疲れてた", "眠そう", "集中してた", "おやつ食べた",
];

const CATEGORY_CONFIG: Record<Category, { label: string; color: string; bg: string; border: string }> = {
  順調:   { label: "順調",   color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  軽確認: { label: "軽確認", color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
  注意:   { label: "要確認", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
};

const STORAGE_KEY = "engao-history-v2";
const MAX_HISTORY = 30;

interface HistoryItem {
  id: string;
  childName: string;
  rawInput: string;
  outputText: string;
  category: Category;
  date: string;   // "4/15 21:13" 形式
  dateISO: string;
}

function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function RecordForm() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // 履歴をlocalStorageから読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredChildren = CHILDREN.filter(c =>
    c.replace(/\s/g, "").includes(searchQuery.replace(/\s/g, "")),
  );

  function selectUser(name: string) {
    setSelectedUser(name);
    setSearchQuery(name);
    setShowDropdown(false);
  }

  function appendQuickWord(word: string) {
    setInputText(prev => (prev ? prev + "\n" + word : word));
  }

  function handleGenerate() {
    if (!inputText.trim()) return;
    const result = formatRecord({ childName: selectedUser ?? "", rawInput: inputText });
    setOutputText(result.outputText);
    setCategory(result.category);

    // 履歴に保存
    const now = new Date();
    const item: HistoryItem = {
      id: Date.now().toString(),
      childName: selectedUser ?? "",
      rawInput: inputText,
      outputText: result.outputText,
      category: result.category,
      date: formatDate(now),
      dateISO: now.toISOString(),
    };
    const next = [item, ...history].slice(0, MAX_HISTORY);
    setHistory(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }

    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  function handleClear() {
    setOutputText("");
    setCategory(null);
    setInputText("");
    setSelectedUser(null);
    setSearchQuery("");
  }

  function deleteHistory(id: string) {
    const next = history.filter(h => h.id !== id);
    setHistory(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  function clearAllHistory() {
    setHistory([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  async function copyText(text: string, historyId?: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    if (historyId) {
      setCopiedHistoryId(historyId);
      setTimeout(() => setCopiedHistoryId(null), 2000);
    } else {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }

  // 履歴から入力を復元
  function restoreFromHistory(item: HistoryItem) {
    setSelectedUser(item.childName || null);
    setSearchQuery(item.childName || "");
    setInputText(item.rawInput);
    setOutputText(item.outputText);
    setCategory(item.category);
    setShowHistory(false);
    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  const catCfg = category ? CATEGORY_CONFIG[category] : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* ヘッダー */}
      <header style={{
        background: "var(--green)", padding: "14px 20px",
        position: "sticky", top: 0, zIndex: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 }}>
              えんがお 連絡帳サポート
            </h1>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, margin: 0 }}>
              単語を入れるだけで連絡帳が完成
            </p>
          </div>
          {/* 履歴ボタン */}
          <button
            onClick={() => setShowHistory(v => !v)}
            style={{
              background: "rgba(255,255,255,0.2)", border: "none",
              borderRadius: 8, padding: "6px 12px",
              color: "#fff", fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <span>📋</span>
            <span>履歴</span>
            {history.length > 0 && (
              <span style={{
                background: "#fff", color: "var(--green)",
                borderRadius: "50%", width: 18, height: 18,
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {history.length > 9 ? "9+" : history.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 48px" }}>

        {/* ── 履歴パネル ── */}
        {showHistory && (
          <div style={{
            background: "var(--surface)", borderRadius: 12,
            marginBottom: 16, border: "1px solid var(--border)", overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>📋 記録履歴</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {history.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    style={{ background: "none", border: "none", fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}
                  >
                    全削除
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-muted)", lineHeight: 1 }}
                >×</button>
              </div>
            </div>
            {history.length === 0 ? (
              <p style={{ padding: "24px 16px", color: "var(--text-muted)", textAlign: "center", fontSize: 14 }}>
                まだ記録がありません
              </p>
            ) : (
              <div style={{ maxHeight: 420, overflowY: "auto" }}>
                {history.map(item => {
                  const cfg = CATEGORY_CONFIG[item.category];
                  return (
                    <div key={item.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                      {/* メタ行 */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          {item.childName && (
                            <span style={{
                              background: "var(--green-light)", color: "var(--green)",
                              fontSize: 12, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                            }}>{item.childName}</span>
                          )}
                          <span style={{
                            background: cfg.color, color: "#fff",
                            fontSize: 11, padding: "2px 7px", borderRadius: 20, fontWeight: 700,
                          }}>{cfg.label}</span>
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.date}</span>
                        </div>
                        <button
                          onClick={() => deleteHistory(item.id)}
                          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: "0 2px" }}
                        >🗑</button>
                      </div>
                      {/* 入力キーワード */}
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 4px", fontStyle: "italic" }}>
                        入力：{item.rawInput.replace(/\n/g, "・")}
                      </p>
                      {/* 出力文 */}
                      <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.7, margin: "0 0 8px" }}>
                        {item.outputText}
                      </p>
                      {/* ボタン行 */}
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => copyText(item.outputText, item.id)}
                          style={{
                            background: copiedHistoryId === item.id ? "#16a34a" : "var(--tag-bg)",
                            color: copiedHistoryId === item.id ? "#fff" : "var(--text-secondary)",
                            border: "none", borderRadius: 6,
                            padding: "5px 12px", fontSize: 12, cursor: "pointer",
                          }}
                        >
                          {copiedHistoryId === item.id ? "✅ コピー済" : "コピー"}
                        </button>
                        <button
                          onClick={() => restoreFromHistory(item)}
                          style={{
                            background: "var(--tag-bg)",
                            color: "var(--text-secondary)",
                            border: "none", borderRadius: 6,
                            padding: "5px 12px", fontSize: 12, cursor: "pointer",
                          }}
                        >
                          再編集
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ① 児童名 */}
        <section style={cardStyle}>
          <SectionLabel num="①" text="児童名" />
          <div ref={searchRef} style={{ position: "relative" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
                if (selectedUser && e.target.value !== selectedUser) setSelectedUser(null);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="名前で検索（省略可）..."
              style={inputStyle}
              autoComplete="off"
            />
            {selectedUser && (
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--green)", fontSize: 18 }}>✓</span>
            )}
            {showDropdown && searchQuery.length > 0 && filteredChildren.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                zIndex: 100, maxHeight: 200, overflowY: "auto", marginTop: 4,
              }}>
                {filteredChildren.map(name => (
                  <button key={name} onClick={() => selectUser(name)} style={{
                    display: "block", width: "100%", padding: "12px 16px",
                    background: selectedUser === name ? "var(--green-light)" : "transparent",
                    border: "none", borderBottom: "1px solid var(--border)",
                    cursor: "pointer", textAlign: "left", fontSize: 16, color: "var(--text-primary)",
                  }}>{name}</button>
                ))}
              </div>
            )}
          </div>
          {selectedUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span style={{
                background: "var(--green-light)", color: "var(--green)",
                padding: "4px 12px", borderRadius: 20, fontSize: 14, fontWeight: 600,
                border: "1px solid var(--tag-selected-border)",
              }}>{selectedUser}</span>
              <button onClick={() => { setSelectedUser(null); setSearchQuery(""); }}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>変更</button>
            </div>
          )}
        </section>

        {/* ② 入力エリア */}
        <section style={cardStyle}>
          <SectionLabel num="②" text="入力エリア" />
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={"宿題頑張った\nおもちゃ渡した\n笑ってた"}
            rows={5}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.8, fontFamily: "inherit" }}
          />
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "6px 0 10px" }}>
            ※ 単語や短文を改行または読点（、）で区切って入力
          </p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 600 }}>クイック入力</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {QUICK_WORDS.map(w => (
              <button key={w} onClick={() => appendQuickWord(w)} style={{
                background: "var(--tag-bg)", border: "1px solid var(--border)",
                borderRadius: 20, padding: "5px 12px", fontSize: 13,
                cursor: "pointer", color: "var(--text-secondary)",
              }}>+ {w}</button>
            ))}
          </div>
        </section>

        {/* 整理ボタン */}
        <button
          onClick={handleGenerate}
          disabled={!inputText.trim()}
          style={{
            width: "100%", padding: "18px",
            background: inputText.trim() ? "var(--green)" : "var(--border)",
            color: inputText.trim() ? "#fff" : "var(--text-muted)",
            border: "none", borderRadius: 14, fontSize: 18, fontWeight: 700,
            cursor: inputText.trim() ? "pointer" : "not-allowed",
            letterSpacing: "0.05em",
            boxShadow: inputText.trim() ? "0 4px 16px rgba(74,140,92,0.3)" : "none",
            marginBottom: 20, transition: "background 0.2s",
          }}
        >
          整理して文章化
        </button>

        {/* ④ 出力エリア */}
        {outputText && (
          <div ref={outputRef} style={{
            background: "var(--surface)",
            border: `2px solid ${catCfg?.border ?? "var(--border)"}`,
            borderRadius: 14, overflow: "hidden", marginBottom: 20,
          }}>
            <div style={{
              background: catCfg?.bg ?? "var(--green-light)",
              padding: "10px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: catCfg?.color ?? "var(--green-dark)" }}>連絡帳</span>
              {catCfg && (
                <span style={{
                  background: catCfg.color, color: "#fff",
                  fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                }}>{catCfg.label}</span>
              )}
            </div>
            <div style={{ padding: "16px" }}>
              <p style={{ fontSize: 16, lineHeight: 1.9, color: "var(--text-primary)", margin: "0 0 16px", whiteSpace: "pre-wrap" }}>
                {outputText}
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => copyText(outputText)} style={{
                  flex: 1, padding: "13px",
                  background: copySuccess ? "#16a34a" : "var(--green)",
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "background 0.2s",
                }}>
                  {copySuccess ? "コピーしました！" : "コピー"}
                </button>
                <button onClick={handleClear} style={{
                  flex: 1, padding: "13px",
                  background: "var(--tag-bg)", color: "var(--text-secondary)",
                  border: "1px solid var(--border)", borderRadius: 10,
                  fontSize: 16, fontWeight: 600, cursor: "pointer",
                }}>クリア</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`button:active { transform: scale(0.97); }`}</style>
    </div>
  );
}

function SectionLabel({ num, text }: { num: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <span style={{
        background: "var(--green)", color: "#fff", width: 22, height: 22,
        borderRadius: "50%", fontSize: 12, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{num}</span>
      <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>{text}</span>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)", borderRadius: 14, padding: "16px",
  marginBottom: 12, border: "1px solid var(--border)",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  border: "1px solid var(--border)", borderRadius: 10,
  fontSize: 16, background: "var(--surface-2)",
  color: "var(--text-primary)", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
};
