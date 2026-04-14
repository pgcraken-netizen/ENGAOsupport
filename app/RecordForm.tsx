"use client";

import { useState, useEffect, useRef } from "react";

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

const ACTIVITIES = ["室内活動", "外遊び", "制作活動", "個別活動", "集団活動"];

const STATUSES = [
  "元気",
  "落ち着いている",
  "落ち着かない",
  "笑顔が多い",
  "疲れ気味",
  "集中している",
];

const QUICK_WORDS = ["転倒", "泣く", "笑顔", "トラブル", "集中", "疲れ", "友達と遊ぶ", "おやつ完食"];

interface HistoryItem {
  id: string;
  user: string;
  activity: string;
  text: string;
  date: string;
}

export default function RecordForm() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [eventText, setEventText] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("engao-history");
    if (stored) {
      setHistory(JSON.parse(stored));
    }
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

  const filteredChildren = CHILDREN.filter((c) =>
    c.replace(/\s/g, "").includes(searchQuery.replace(/\s/g, ""))
  );

  function selectUser(name: string) {
    setSelectedUser(name);
    setSearchQuery(name);
    setShowDropdown(false);
  }

  function toggleStatus(s: string) {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function appendQuickWord(word: string) {
    setEventText((prev) => (prev ? prev + " " + word : word));
  }

  async function generate() {
    if (!selectedActivity) {
      setError("活動を選択してください");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setGeneratedText("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity: selectedActivity,
          statuses: selectedStatuses,
          event: eventText,
        }),
      });
      let data: { text?: string; error?: string } = {};
      const text = await res.text();
      if (text) {
        try { data = JSON.parse(text); } catch { throw new Error("サーバーエラーが発生しました"); }
      }
      if (!res.ok) throw new Error(data.error ?? `エラー (${res.status})`);
      if (!data.text) throw new Error("生成結果が空でした。もう一度お試しください");
      setGeneratedText(data.text!);

      // Save to history
      const item: HistoryItem = {
        id: Date.now().toString(),
        user: selectedUser ?? "未選択",
        activity: selectedActivity,
        text: data.text,
        date: new Date().toLocaleDateString("ja-JP", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      const newHistory = [item, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem("engao-history", JSON.stringify(newHistory));

      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }

  function deleteHistory(id: string) {
    const newHistory = history.filter((h) => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("engao-history", JSON.stringify(newHistory));
  }

  const canGenerate = !!selectedActivity;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header
        style={{
          background: "var(--green)",
          padding: "16px 20px",
          position: "sticky",
          top: 0,
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "0.02em" }}>
              えんがお放課後
            </h1>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, margin: 0 }}>記録支援アプリ</p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              color: "#fff",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>📋</span>
            <span>履歴</span>
            {history.length > 0 && (
              <span style={{
                background: "#fff",
                color: "var(--green)",
                borderRadius: "50%",
                width: 18,
                height: 18,
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}>
                {history.length > 9 ? "9+" : history.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 40px" }}>
        {/* History Panel */}
        {showHistory && (
          <div style={{
            background: "var(--surface)",
            borderRadius: 12,
            marginBottom: 16,
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>📋 記録履歴</span>
              <button onClick={() => setShowHistory(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-muted)" }}>×</button>
            </div>
            {history.length === 0 ? (
              <p style={{ padding: "24px 16px", color: "var(--text-muted)", textAlign: "center", fontSize: 14 }}>
                まだ記録がありません
              </p>
            ) : (
              <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {history.map((item) => (
                  <div key={item.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{
                          background: "var(--green-light)",
                          color: "var(--green)",
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontWeight: 600,
                        }}>{item.user}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.date}</span>
                      </div>
                      <button
                        onClick={() => deleteHistory(item.id)}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: "0 4px" }}
                      >
                        🗑
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, margin: "0 0 8px" }}>
                      {item.text}
                    </p>
                    <button
                      onClick={() => copyText(item.text)}
                      style={{
                        background: "var(--tag-bg)",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 12,
                        cursor: "pointer",
                        color: "var(--text-secondary)",
                      }}
                    >
                      コピー
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 1: User */}
        <section style={cardStyle}>
          <Label icon="👤" text="利用者" required={false} />
          <div ref={searchRef} style={{ position: "relative" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
                if (selectedUser && e.target.value !== selectedUser) {
                  setSelectedUser(null);
                }
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="名前で検索..."
              style={inputStyle}
              autoComplete="off"
            />
            {selectedUser && (
              <span style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--green)",
                fontSize: 18,
              }}>✓</span>
            )}
            {showDropdown && searchQuery.length > 0 && filteredChildren.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                zIndex: 100,
                maxHeight: 200,
                overflowY: "auto",
                marginTop: 4,
              }}>
                {filteredChildren.map((name) => (
                  <button
                    key={name}
                    onClick={() => selectUser(name)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "12px 16px",
                      background: selectedUser === name ? "var(--green-light)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 16,
                      color: "var(--text-primary)",
                      borderBottom: "1px solid var(--border)",
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
                background: "var(--green-light)",
                color: "var(--green)",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
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

        {/* Section 2: Activity */}
        <section style={cardStyle}>
          <Label icon="🎯" text="活動" required={true} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ACTIVITIES.map((a) => (
              <button
                key={a}
                onClick={() => setSelectedActivity(selectedActivity === a ? null : a)}
                style={selectedActivity === a ? selectedButtonStyle : buttonStyle}
              >
                {a}
              </button>
            ))}
          </div>
        </section>

        {/* Section 3: Status */}
        <section style={cardStyle}>
          <Label icon="😊" text="様子（複数選択可）" required={false} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                style={selectedStatuses.includes(s) ? selectedButtonStyle : buttonStyle}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Section 4: Event + Quick words */}
        <section style={cardStyle}>
          <Label icon="📝" text="出来事" required={false} />
          <input
            type="text"
            value={eventText}
            onChange={(e) => setEventText(e.target.value)}
            placeholder="例：転倒 少し泣く すぐ回復"
            style={inputStyle}
            maxLength={100}
          />
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>クイック入力</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK_WORDS.map((w) => (
                <button
                  key={w}
                  onClick={() => appendQuickWord(w)}
                  style={{
                    background: "var(--tag-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    padding: "6px 14px",
                    fontSize: 14,
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    transition: "background 0.1s",
                  }}
                >
                  + {w}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Generate Button */}
        {error && (
          <div style={{
            background: "var(--red-light)",
            border: "1px solid #fca5a5",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 14,
            color: "var(--red)",
            marginBottom: 12,
          }}>
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={generate}
          disabled={!canGenerate || isGenerating}
          style={{
            width: "100%",
            padding: "18px",
            background: canGenerate ? "var(--green)" : "var(--border)",
            color: canGenerate ? "#fff" : "var(--text-muted)",
            border: "none",
            borderRadius: 14,
            fontSize: 18,
            fontWeight: 700,
            cursor: canGenerate ? "pointer" : "not-allowed",
            letterSpacing: "0.05em",
            transition: "background 0.2s, transform 0.1s",
            boxShadow: canGenerate ? "0 4px 16px rgba(74,140,92,0.3)" : "none",
            marginBottom: 20,
          }}
        >
          {isGenerating ? "生成中..." : "✨ 記録を生成する"}
        </button>

        {/* Output */}
        {(generatedText || isGenerating) && (
          <div ref={outputRef} style={{
            background: "var(--surface)",
            border: "2px solid var(--tag-selected-border)",
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 20,
          }}>
            <div style={{
              background: "var(--green-light)",
              padding: "10px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "var(--green-dark)" }}>
                📄 生成された記録
              </span>
              {selectedUser && (
                <span style={{ fontSize: 13, color: "var(--green)" }}>{selectedUser}</span>
              )}
            </div>
            <div style={{ padding: "16px" }}>
              {isGenerating ? (
                <div style={{ color: "var(--text-muted)", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                  AIが文章を生成しています...
                </div>
              ) : (
                <>
                  <p style={{
                    fontSize: 16,
                    lineHeight: 1.8,
                    color: "var(--text-primary)",
                    margin: 0,
                    marginBottom: 16,
                    whiteSpace: "pre-wrap",
                  }}>
                    {generatedText}
                  </p>
                  <button
                    onClick={() => copyText(generatedText)}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: copySuccess ? "#16a34a" : "var(--green)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                  >
                    {copySuccess ? "✅ コピーしました！" : "📋 コピーする"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        button:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
}

function Label({ icon, text, required }: { icon: string; text: string; required: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>{text}</span>
      {required && (
        <span style={{
          background: "#fef2f2",
          color: "#dc2626",
          fontSize: 11,
          padding: "1px 6px",
          borderRadius: 4,
          fontWeight: 600,
        }}>必須</span>
      )}
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

const buttonStyle: React.CSSProperties = {
  background: "var(--tag-bg)",
  border: "1px solid var(--border)",
  borderRadius: 24,
  padding: "10px 18px",
  fontSize: 15,
  cursor: "pointer",
  color: "var(--text-secondary)",
  transition: "all 0.15s",
  fontFamily: "inherit",
};

const selectedButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "var(--tag-selected)",
  border: "2px solid var(--tag-selected-border)",
  color: "var(--green-dark)",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 16,
  background: "var(--surface-2)",
  color: "var(--text-primary)",
  outline: "none",
  fontFamily: "inherit",
};
