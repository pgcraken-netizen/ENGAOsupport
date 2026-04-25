"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ViewPanel from "./ViewPanel";
import type { Condition, Meal, Resident } from "@/types";

const MEAL_OPTIONS: { value: Meal; label: string; sub: string; color: string; bg: string }[] = [
  { value: "full",   label: "全量完食", sub: "残食なし", color: "#2563eb", bg: "#eff6ff" },
  { value: "normal", label: "普通量",   sub: "概ね完食", color: "#4a8c5c", bg: "#e8f3ec" },
  { value: "half",   label: "半量以下", sub: "半分未満", color: "#d97706", bg: "#fef3c7" },
  { value: "none",   label: "摂取なし", sub: "食事なし", color: "#6b7280", bg: "#f3f4f6" },
];

const CONDITION_OPTIONS: { value: Condition; label: string; color: string; bg: string }[] = [
  { value: "normal",        label: "良好",    color: "#4a8c5c", bg: "#e8f3ec" },
  { value: "slightly_poor", label: "やや不良", color: "#d97706", bg: "#fef3c7" },
  { value: "poor",          label: "不良",    color: "#dc2626", bg: "#fee2e2" },
];

type Tab = "record" | "view";
type RecordStep = "select" | "form" | "saving" | "success";

export default function LiffApp() {
  const [phase, setPhase]       = useState<"init" | "error" | "ready">("init");
  const [errorMsg, setErrorMsg] = useState("");
  const [staffName, setStaffName]   = useState("");
  const [staffLineId, setStaffLineId] = useState("");
  const [residents, setResidents] = useState<Resident[]>([]);

  const [activeTab,  setActiveTab]  = useState<Tab>("record");
  const [recordStep, setRecordStep] = useState<RecordStep>("select");
  const [selected,   setSelected]   = useState<Resident | null>(null);
  const [meal,       setMeal]       = useState<Meal | null>(null);
  const [condition,  setCondition]  = useState<Condition | null>(null);
  const [note,       setNote]       = useState("");
  const [search,     setSearch]     = useState("");

  useEffect(() => { initApp(); }, []);

  async function initApp() {
    try {
      const { default: liff } = await import("@line/liff");
      await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID ?? "2009872553-lEutIel4" });

      if (!liff.isLoggedIn()) { liff.login(); return; }

      const profile = await liff.getProfile();
      setStaffName(profile.displayName);
      setStaffLineId(profile.userId);

      const { data } = await supabase
        .from("residents")
        .select("id, name, kana, room, is_active")
        .eq("is_active", true)
        .order("kana");

      setResidents(data ?? []);
      setPhase("ready");
    } catch {
      setErrorMsg("アプリを起動できませんでした。\nLINEを再起動してもう一度お試しください。");
      setPhase("error");
    }
  }

  function selectResident(r: Resident) {
    setSelected(r); setMeal(null); setCondition(null); setNote(""); setRecordStep("form");
  }
  function goBack() { setRecordStep("select"); setSelected(null); }

  async function handleSave() {
    if (!selected || !meal || !condition) return;
    setRecordStep("saving");
    const { error } = await supabase.from("records").insert({
      line_user_id: staffLineId,
      staff_name:   staffName,
      resident_id:  selected.id,
      meal, condition,
      note: note.trim(),
    });
    if (error) { setErrorMsg("保存できませんでした。もう一度お試しください。"); setPhase("error"); return; }
    setRecordStep("success");
  }

  function startNext() {
    setRecordStep("select"); setSelected(null); setMeal(null); setCondition(null); setNote(""); setSearch("");
  }

  // ── Render ──

  if (phase === "init") return (
    <FullCenter><div style={{ textAlign: "center" }}>
      <div className="spinner" />
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 12 }}>読み込み中...</p>
    </div></FullCenter>
  );

  if (phase === "error") return (
    <FullCenter><div style={{ textAlign: "center", padding: "0 32px" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
      <p style={{ color: "var(--text-primary)", fontSize: 16, lineHeight: 1.9, whiteSpace: "pre-line" }}>{errorMsg}</p>
    </div></FullCenter>
  );

  const filtered = residents.filter(r =>
    !search || r.name.includes(search) || (r.kana ?? "").includes(search) || (r.room ?? "").includes(search)
  );

  const showTabBar = activeTab === "view" || recordStep === "select";
  const showBack   = activeTab === "record" && (recordStep === "form" || recordStep === "saving");

  const headerTitle =
    activeTab === "view" ? "記録を閲覧" :
    recordStep === "form" || recordStep === "saving" ? (selected?.name ?? "記録入力") :
    recordStep === "success" ? "保存完了" : "えんがお スタッフ支援";

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

      {/* ヘッダー */}
      <header style={{ background: "var(--green)", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          {showBack && (
            <button onClick={goBack} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "7px 13px", color: "#fff", fontSize: 15, cursor: "pointer", flexShrink: 0 }}>
              ‹ 戻る
            </button>
          )}
          <div>
            <h1 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 }}>{headerTitle}</h1>
            {activeTab === "record" && recordStep === "select" && (
              <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, margin: 0 }}>{staffName} さん、お疲れ様です</p>
            )}
          </div>
        </div>

        {showTabBar && (
          <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            {(["record", "view"] as Tab[]).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                flex: 1, padding: "10px 0", background: "none", border: "none",
                borderBottom: `3px solid ${activeTab === t ? "#fff" : "transparent"}`,
                color: activeTab === t ? "#fff" : "rgba(255,255,255,0.6)",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>
                {t === "record" ? "📝 記録する" : "📋 閲覧"}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* メイン */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 600, width: "100%", margin: "0 auto", overflow: "hidden" }}>

        {activeTab === "view" && <ViewPanel residents={residents} />}

        {activeTab === "record" && (
          <>
            {/* 利用者選択 */}
            {recordStep === "select" && (
              <>
                <div style={{ padding: "12px 16px 8px", flexShrink: 0 }}>
                  <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="名前・ふりがな・部屋番号で絞り込み" style={inputStyle} />
                </div>
                <div style={{ overflowY: "auto", flex: 1 }}>
                  {residents.length === 0 ? (
                    <p style={emptyStyle}>利用者が登録されていません</p>
                  ) : filtered.length === 0 ? (
                    <p style={emptyStyle}>該当する利用者がいません</p>
                  ) : filtered.map(r => (
                    <button key={r.id} onClick={() => selectResident(r)} style={rowStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar name={r.name} />
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)" }}>{r.name}</div>
                          {(r.kana || r.room) && (
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                              {[r.kana, r.room && `${r.room}号室`].filter(Boolean).join("　")}
                            </div>
                          )}
                        </div>
                      </div>
                      <span style={{ color: "var(--text-muted)", fontSize: 22 }}>›</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* 記録フォーム */}
            {(recordStep === "form" || recordStep === "saving") && (
              <>
                <div style={{ overflowY: "auto", flex: 1, padding: 16 }}>
                  <Label text="食事量" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
                    {MEAL_OPTIONS.map(opt => {
                      const sel = meal === opt.value;
                      return (
                        <button key={opt.value} onClick={() => setMeal(opt.value)} disabled={recordStep === "saving"} style={{
                          padding: "16px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                          background: sel ? opt.bg : "var(--surface-2)",
                          border: `2px solid ${sel ? opt.color : "var(--border)"}`,
                          opacity: recordStep === "saving" ? 0.6 : 1,
                        }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: sel ? opt.color : "var(--text-secondary)" }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: sel ? opt.color : "var(--text-muted)", marginTop: 3 }}>{opt.sub}</div>
                        </button>
                      );
                    })}
                  </div>

                  <Label text="体調" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
                    {CONDITION_OPTIONS.map(opt => {
                      const sel = condition === opt.value;
                      return (
                        <button key={opt.value} onClick={() => setCondition(opt.value)} disabled={recordStep === "saving"} style={{
                          padding: "16px 4px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                          background: sel ? opt.bg : "var(--surface-2)",
                          border: `2px solid ${sel ? opt.color : "var(--border)"}`,
                          opacity: recordStep === "saving" ? 0.6 : 1,
                        }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: sel ? opt.color : "var(--text-secondary)" }}>{opt.label}</div>
                        </button>
                      );
                    })}
                  </div>

                  <Label text="メモ（任意）" />
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    placeholder="気になる点があれば記録してください"
                    disabled={recordStep === "saving"} rows={4}
                    style={{ ...textareaStyle, opacity: recordStep === "saving" ? 0.6 : 1 }} />
                </div>

                <div style={footerStyle}>
                  {recordStep === "saving" ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "10px 0" }}>
                      <div className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }} />
                      <span style={{ color: "var(--text-secondary)", fontSize: 15 }}>保存中...</span>
                    </div>
                  ) : (
                    <>
                      {(!meal || !condition) && (
                        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px" }}>食事量と体調を選択してください</p>
                      )}
                      <button onClick={handleSave} disabled={!meal || !condition} style={{
                        width: "100%", padding: 17, border: "none", borderRadius: 13,
                        fontSize: 17, fontWeight: 700, cursor: meal && condition ? "pointer" : "not-allowed",
                        background: meal && condition ? "var(--green)" : "var(--border)",
                        color: meal && condition ? "#fff" : "var(--text-muted)",
                        boxShadow: meal && condition ? "0 4px 16px rgba(74,140,92,0.3)" : "none",
                      }}>記録を保存する</button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* 完了 */}
            {recordStep === "success" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>記録を保存しました</h2>
                <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 40px" }}>{selected?.name} さんの記録が完了しました</p>
                <button onClick={startNext} style={{ width: "100%", maxWidth: 320, padding: 17, background: "var(--green)", color: "#fff", border: "none", borderRadius: 13, fontSize: 17, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(74,140,92,0.3)", marginBottom: 12 }}>
                  次の利用者を記録する
                </button>
                <button onClick={() => { startNext(); setActiveTab("view"); }} style={{ width: "100%", maxWidth: 320, padding: 14, background: "var(--tag-bg)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 13, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                  今日の記録を確認する
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function FullCenter({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>{children}</div>;
}

function Avatar({ name }: { name: string }) {
  return (
    <div style={{ width: 42, height: 42, background: "var(--green-light)", color: "var(--green)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>
      {name.charAt(0)}
    </div>
  );
}

function Label({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
      <div style={{ width: 3, height: 16, background: "var(--green)", borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-secondary)" }}>{text}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 15, background: "var(--surface)", color: "var(--text-primary)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 16px", background: "var(--surface)", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer" };
const emptyStyle: React.CSSProperties = { textAlign: "center", color: "var(--text-muted)", padding: "48px 16px", fontSize: 14 };
const textareaStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 16, background: "var(--surface-2)", color: "var(--text-primary)", resize: "vertical", fontFamily: "inherit", lineHeight: 1.7, boxSizing: "border-box", minHeight: 110 };
const footerStyle: React.CSSProperties = { padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 };
