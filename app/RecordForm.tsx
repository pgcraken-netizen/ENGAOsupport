"use client";

import { useEffect, useRef, useState } from "react";
import { formatRecord } from "@/lib/engine";
import type { Category } from "@/types";

const CHILDREN = [
  "赤坂 太郎",
  "青山 花子",
  "井上 一郎",
  "上田 美咲",
  "大野 健太",
  "岡田 愛",
  "加藤 翔",
  "木村 さくら",
  "小林 大輝",
  "齋藤 りな",
  "佐藤 拓海",
  "鈴木 ひかり",
  "田中 颯太",
  "高橋 奈々",
  "中村 陽太",
  "西村 あおい",
  "林 蓮",
  "原田 ゆい",
  "福田 そうた",
  "松本 みお",
];

// クイック入力ワード（辞書キーワードから抜粋）
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

export default function RecordForm() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

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
    const result = formatRecord({
      childName: selectedUser ?? "",
      rawInput: inputText,
    });
    setOutputText(result.outputText);
    setCategory(result.category);
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

  async function copyText() {
    try {
      await navigator.clipboard.writeText(outputText);
    } catch {
      const el = document.createElement("textarea");
      el.value = outputText;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }

  const catCfg = category ? CATEGORY_CONFIG[category] : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* ヘッダー */}
      <header
        style={{
          background: "var(--green)",
          padding: "14px 20px",
          position: "sticky",
          top: 0,
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h1 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 }}>
            えんがお 連絡帳サポート
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, margin: 0 }}>
            単語を入れるだけで連絡帳が完成
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 48px" }}>

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
                if (selectedUser && e.target.value !== selectedUser) {
                  setSelectedUser(null);
                }
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="名前で検索（省略可）..."
              style={inputStyle}
              autoComplete="off"
            />
            {selectedUser && (
              <span style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)",
                color: "var(--green)", fontSize: 18,
              }}>✓</span>
            )}
            {showDropdown && searchQuery.length > 0 && filteredChildren.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                zIndex: 100, maxHeight: 200, overflowY: "auto", marginTop: 4,
              }}>
                {filteredChildren.map(name => (
                  <button
                    key={name}
                    onClick={() => selectUser(name)}
                    style={{
                      display: "block", width: "100%",
                      padding: "12px 16px",
                      background: selectedUser === name ? "var(--green-light)" : "transparent",
                      border: "none", borderBottom: "1px solid var(--border)",
                      cursor: "pointer", textAlign: "left",
                      fontSize: 16, color: "var(--text-primary)",
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span style={{
                background: "var(--green-light)", color: "var(--green)",
                padding: "4px 12px", borderRadius: 20,
                fontSize: 14, fontWeight: 600,
                border: "1px solid var(--tag-selected-border)",
              }}>
                {selectedUser}
              </span>
              <button
                onClick={() => { setSelectedUser(null); setSearchQuery(""); }}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}
              >
                変更
              </button>
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
            style={{
              ...inputStyle,
              resize: "vertical",
              lineHeight: 1.8,
              fontFamily: "inherit",
            }}
          />
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "6px 0 10px" }}>
            ※ 単語や短文を改行または読点（、）で区切って入力
          </p>
          {/* クイック入力 */}
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 600 }}>
            クイック入力
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {QUICK_WORDS.map(w => (
              <button
                key={w}
                onClick={() => appendQuickWord(w)}
                style={{
                  background: "var(--tag-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 20, padding: "5px 12px",
                  fontSize: 13, cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                + {w}
              </button>
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
            border: "none", borderRadius: 14,
            fontSize: 18, fontWeight: 700,
            cursor: inputText.trim() ? "pointer" : "not-allowed",
            letterSpacing: "0.05em",
            boxShadow: inputText.trim() ? "0 4px 16px rgba(74,140,92,0.3)" : "none",
            marginBottom: 20,
            transition: "background 0.2s",
          }}
        >
          整理して文章化
        </button>

        {/* ④ 出力エリア */}
        {outputText && (
          <div ref={outputRef} style={{
            background: "var(--surface)",
            border: `2px solid ${catCfg?.border ?? "var(--border)"}`,
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 20,
          }}>
            {/* 出力ヘッダー */}
            <div style={{
              background: catCfg?.bg ?? "var(--green-light)",
              padding: "10px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: catCfg?.color ?? "var(--green-dark)" }}>
                連絡帳
              </span>
              {catCfg && (
                <span style={{
                  background: catCfg.color, color: "#fff",
                  fontSize: 12, fontWeight: 700,
                  padding: "2px 10px", borderRadius: 20,
                }}>
                  {catCfg.label}
                </span>
              )}
            </div>

            {/* 出力テキスト */}
            <div style={{ padding: "16px" }}>
              <p style={{
                fontSize: 16, lineHeight: 1.9,
                color: "var(--text-primary)",
                margin: "0 0 16px",
                whiteSpace: "pre-wrap",
              }}>
                {outputText}
              </p>

              {/* コピー・クリアボタン */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={copyText}
                  style={{
                    flex: 1, padding: "13px",
                    background: copySuccess ? "#16a34a" : "var(--green)",
                    color: "#fff", border: "none",
                    borderRadius: 10, fontSize: 16,
                    fontWeight: 600, cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  {copySuccess ? "コピーしました！" : "コピー"}
                </button>
                <button
                  onClick={handleClear}
                  style={{
                    flex: 1, padding: "13px",
                    background: "var(--tag-bg)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: 10, fontSize: 16,
                    fontWeight: 600, cursor: "pointer",
                  }}
                >
                  クリア
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        button:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
}

function SectionLabel({ num, text }: { num: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <span style={{
        background: "var(--green)", color: "#fff",
        width: 22, height: 22, borderRadius: "50%",
        fontSize: 12, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>{num}</span>
      <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>{text}</span>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderRadius: 14,
  padding: "16px",
  marginBottom: 12,
  border: "1px solid var(--border)",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 16,
  background: "var(--surface-2)",
  color: "var(--text-primary)",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};
