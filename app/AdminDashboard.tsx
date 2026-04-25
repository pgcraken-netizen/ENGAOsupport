"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Condition, Meal } from "@/types";

type DateRange = "today" | "week" | "month" | "year";

type RecordRow = {
  id: string;
  meal: Meal;
  condition: Condition;
  note: string;
  staff_name: string;
  recorded_at: string;
  residents: { name: string } | null;
};

type ResidentStat = {
  name: string;
  total: number;
  meal: Partial<Record<Meal, number>>;
  condition: Partial<Record<Condition, number>>;
};

const MEAL_LABEL: Record<Meal, string> = { full: "全量完食", normal: "普通量", half: "半量以下", none: "摂取なし" };
const CONDITION_LABEL: Record<Condition, string> = { normal: "良好", slightly_poor: "やや不良", poor: "不良" };
const MEAL_COLOR: Record<Meal, string> = { full: "#2563eb", normal: "#4a8c5c", half: "#d97706", none: "#6b7280" };
const CONDITION_COLOR: Record<Condition, string> = { normal: "#4a8c5c", slightly_poor: "#d97706", poor: "#dc2626" };
const MEALS: Meal[] = ["full", "normal", "half", "none"];
const CONDITIONS: Condition[] = ["normal", "slightly_poor", "poor"];
const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "today", label: "今日" }, { value: "week", label: "今週" },
  { value: "month", label: "今月" }, { value: "year", label: "今年" },
];

function getDateBounds(range: DateRange) {
  const end = new Date(), start = new Date();
  switch (range) {
    case "today": start.setHours(0, 0, 0, 0); break;
    case "week":  start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0); break;
    case "month": start.setDate(1); start.setHours(0, 0, 0, 0); break;
    case "year":  start.setMonth(0, 1); start.setHours(0, 0, 0, 0); break;
  }
  return { start, end };
}

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function fmtRange(range: DateRange) {
  const { start, end } = getDateBounds(range);
  const f = (d: Date) => `${d.getMonth()+1}/${d.getDate()}`;
  if (range === "today") return f(start);
  if (range === "year")  return `${start.getFullYear()}年`;
  return `${f(start)} 〜 ${f(end)}`;
}

function exportCSV(records: RecordRow[], range: DateRange) {
  const label = DATE_OPTIONS.find(o => o.value === range)?.label ?? range;
  const headers = ["日時", "利用者", "食事量", "体調", "メモ", "記録者"];
  const rows = records.map(r => [fmt(r.recorded_at), r.residents?.name ?? "", MEAL_LABEL[r.meal], CONDITION_LABEL[r.condition], r.note, r.staff_name]);
  const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const date = new Date().toLocaleDateString("ja-JP").replace(/\//g, "-");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `えんがお記録_${label}_${date}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRecords(); }, [dateRange]);

  async function fetchRecords() {
    setLoading(true);
    const { start, end } = getDateBounds(dateRange);
    const { data } = await supabase
      .from("records")
      .select("id, meal, condition, note, staff_name, recorded_at, residents(name)")
      .gte("recorded_at", start.toISOString())
      .lte("recorded_at", end.toISOString())
      .order("recorded_at", { ascending: false });
    setRecords((data as unknown as RecordRow[]) ?? []);
    setLoading(false);
  }

  const mealCounts = MEALS.reduce((a, m) => ({ ...a, [m]: records.filter(r => r.meal === m).length }), {} as Record<Meal, number>);
  const condCounts = CONDITIONS.reduce((a, c) => ({ ...a, [c]: records.filter(r => r.condition === c).length }), {} as Record<Condition, number>);
  const residentStats: ResidentStat[] = Object.values(
    records.reduce((acc, r) => {
      const name = r.residents?.name ?? "不明";
      if (!acc[name]) acc[name] = { name, total: 0, meal: {}, condition: {} };
      acc[name].total++;
      acc[name].meal[r.meal] = (acc[name].meal[r.meal] ?? 0) + 1;
      acc[name].condition[r.condition] = (acc[name].condition[r.condition] ?? 0) + 1;
      return acc;
    }, {} as Record<string, ResidentStat>)
  ).sort((a, b) => b.total - a.total);

  const rangeLabel = DATE_OPTIONS.find(o => o.value === dateRange)?.label ?? "";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "-apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif" }}>
      <header className="no-print" style={{ background: "#4a8c5c", padding: "14px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>えんがお 管理ダッシュボード</h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, margin: 0 }}>記録データの集計・エクスポート</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => exportCSV(records, dateRange)} disabled={loading || records.length === 0} style={btnStyle}>CSV ダウンロード</button>
          <button onClick={() => window.print()} disabled={loading || records.length === 0} style={btnStyle}>印刷 / PDF</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 60px" }}>
        <div className="print-only" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>えんがお 記録レポート</h2>
          <p style={{ fontSize: 13, color: "#555", margin: 0 }}>期間：{rangeLabel}（{fmtRange(dateRange)}）　出力日：{new Date().toLocaleDateString("ja-JP")}</p>
        </div>

        <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#666", fontWeight: 600 }}>期間：</span>
          {DATE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setDateRange(opt.value)} style={{ padding: "8px 20px", background: dateRange === opt.value ? "#4a8c5c" : "#fff", color: dateRange === opt.value ? "#fff" : "#444", border: `1px solid ${dateRange === opt.value ? "#4a8c5c" : "#ddd"}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{opt.label}</button>
          ))}
          <span style={{ fontSize: 13, color: "#888", marginLeft: 4 }}>{fmtRange(dateRange)}</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}><div className="spinner" /><p style={{ color: "#888", marginTop: 12 }}>読み込み中...</p></div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p>この期間の記録はありません</p>
          </div>
        ) : (
          <>
            <section style={{ marginBottom: 28 }}>
              <STitle text="サマリー" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                <StatCard label="総記録数" value={`${records.length} 件`} color="#4a8c5c" />
                <div style={card}>
                  <p style={cardLabel}>食事量の内訳</p>
                  {MEALS.map(m => (
                    <div key={m} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: MEAL_COLOR[m], fontWeight: 600 }}>{MEAL_LABEL[m]}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{mealCounts[m]}件 <span style={{ fontSize: 11, color: "#888" }}>({records.length > 0 ? Math.round(mealCounts[m]/records.length*100) : 0}%)</span></span>
                    </div>
                  ))}
                </div>
                <div style={card}>
                  <p style={cardLabel}>体調の内訳</p>
                  {CONDITIONS.map(c => (
                    <div key={c} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: CONDITION_COLOR[c], fontWeight: 600 }}>{CONDITION_LABEL[c]}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{condCounts[c]}件 <span style={{ fontSize: 11, color: "#888" }}>({records.length > 0 ? Math.round(condCounts[c]/records.length*100) : 0}%)</span></span>
                    </div>
                  ))}
                </div>
                <StatCard label="要注意（体調不良）" value={`${condCounts.poor + condCounts.slightly_poor} 件`} color={condCounts.poor > 0 ? "#dc2626" : "#d97706"} sub={condCounts.poor > 0 ? `うち「不良」${condCounts.poor}件` : "「不良」なし"} />
              </div>
            </section>

            <section style={{ marginBottom: 28 }}>
              <STitle text="利用者別集計" />
              <div style={{ overflowX: "auto" }}>
                <table style={tbl}>
                  <thead><tr style={{ background: "#f0f0f0" }}>
                    <Th>利用者</Th><Th>記録数</Th>
                    {MEALS.map(m => <Th key={m} color={MEAL_COLOR[m]}>{MEAL_LABEL[m]}</Th>)}
                    {CONDITIONS.map(c => <Th key={c} color={CONDITION_COLOR[c]}>{CONDITION_LABEL[c]}</Th>)}
                  </tr></thead>
                  <tbody>{residentStats.map((s, i) => (
                    <tr key={s.name} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <Td bold>{s.name}</Td><Td center bold>{s.total}</Td>
                      {MEALS.map(m => <Td key={m} center>{s.meal[m] ?? 0}</Td>)}
                      {CONDITIONS.map(c => <Td key={c} center color={(s.condition[c] ?? 0) > 0 && c !== "normal" ? CONDITION_COLOR[c] : undefined}>{s.condition[c] ?? 0}</Td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>

            <section>
              <STitle text={`詳細記録一覧（${records.length}件）`} />
              <div style={{ overflowX: "auto" }}>
                <table style={tbl}>
                  <thead><tr style={{ background: "#f0f0f0" }}>
                    <Th>日時</Th><Th>利用者</Th><Th>食事量</Th><Th>体調</Th><Th>メモ</Th><Th>記録者</Th>
                  </tr></thead>
                  <tbody>{records.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <Td nowrap>{fmt(r.recorded_at)}</Td>
                      <Td bold>{r.residents?.name ?? "—"}</Td>
                      <Td color={MEAL_COLOR[r.meal]} bold>{MEAL_LABEL[r.meal]}</Td>
                      <Td color={CONDITION_COLOR[r.condition]} bold>{CONDITION_LABEL[r.condition]}</Td>
                      <Td>{r.note || "—"}</Td>
                      <Td>{r.staff_name}</Td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function STitle({ text }: { text: string }) {
  return <h2 style={{ fontSize: 15, fontWeight: 700, color: "#333", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}><span style={{ display: "inline-block", width: 4, height: 16, background: "#4a8c5c", borderRadius: 2 }} />{text}</h2>;
}
function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return <div style={card}><p style={cardLabel}>{label}</p><p style={{ fontSize: 28, fontWeight: 800, color, margin: "4px 0 0" }}>{value}</p>{sub && <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>{sub}</p>}</div>;
}
function Th({ children, color }: { children: React.ReactNode; color?: string }) {
  return <th style={{ padding: "9px 12px", fontSize: 12, fontWeight: 700, textAlign: "left", whiteSpace: "nowrap", color: color ?? "#555", borderBottom: "2px solid #ddd" }}>{children}</th>;
}
function Td({ children, bold, center, color, nowrap }: { children: React.ReactNode; bold?: boolean; center?: boolean; color?: string; nowrap?: boolean }) {
  return <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: bold ? 600 : 400, textAlign: center ? "center" : "left", color: color ?? "#333", whiteSpace: nowrap ? "nowrap" : "normal", borderBottom: "1px solid #eee", maxWidth: 240 }}>{children}</td>;
}

const card: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e8e8e8" };
const cardLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#888", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" };
const tbl: React.CSSProperties = { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e8e8e8", overflow: "hidden", fontSize: 13 };
const btnStyle: React.CSSProperties = { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
