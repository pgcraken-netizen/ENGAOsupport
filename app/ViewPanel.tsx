"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Condition, Meal, Resident } from "@/types";

// ── 型定義 ────────────────────────────────────────────────────────────────────

type DateRange = "today" | "week" | "month";

type RecordRow = {
  id: string;
  meal: Meal;
  condition: Condition;
  note: string;
  recorded_at: string;
  residents: { name: string } | null;
  staff: { name: string } | null;
};

// ── ラベル・カラー定義 ────────────────────────────────────────────────────────

const MEAL_LABEL: Record<Meal, string> = {
  full:   "全量完食",
  normal: "普通量",
  half:   "半量以下",
  none:   "摂取なし",
};

const MEAL_COLOR: Record<Meal, { color: string; bg: string }> = {
  full:   { color: "#2563eb", bg: "#eff6ff" },
  normal: { color: "#4a8c5c", bg: "#e8f3ec" },
  half:   { color: "#d97706", bg: "#fef3c7" },
  none:   { color: "#6b7280", bg: "#f3f4f6" },
};

const CONDITION_LABEL: Record<Condition, string> = {
  normal:        "良好",
  slightly_poor: "やや不良",
  poor:          "不良",
};

const CONDITION_COLOR: Record<Condition, { color: string; bg: string }> = {
  normal:        { color: "#4a8c5c", bg: "#e8f3ec" },
  slightly_poor: { color: "#d97706", bg: "#fef3c7" },
  poor:          { color: "#dc2626", bg: "#fee2e2" },
};

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "today", label: "今日" },
  { value: "week",  label: "今週" },
  { value: "month", label: "今月" },
];

// ── ユーティリティ ────────────────────────────────────────────────────────────

function getDateBounds(range: DateRange): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  if (range === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (range === "week") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${h}:${m}`;
}

// ── ViewPanel コンポーネント ───────────────────────────────────────────────────

export default function ViewPanel({ residents }: { residents: Resident[] }) {
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [residentId, setResidentId] = useState<string>("all");
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, residentId]);

  async function fetchRecords() {
    setLoading(true);
    const { start, end } = getDateBounds(dateRange);

    let query = supabase
      .from("records")
      .select(`
        id, meal, condition, note, recorded_at,
        residents(name),
        staff(name)
      `)
      .gte("recorded_at", start.toISOString())
      .lte("recorded_at", end.toISOString())
      .order("recorded_at", { ascending: false });

    if (residentId !== "all") {
      query = query.eq("resident_id", residentId);
    }

    const { data } = await query;
    setRecords((data as unknown as RecordRow[]) ?? []);
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

      {/* ── フィルターバー ── */}
      <div style={{
        padding: "12px 16px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        {/* 日付レンジ */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {DATE_OPTIONS.map((opt) => {
            const active = dateRange === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                style={{
                  flex: 1, padding: "9px 0",
                  background: active ? "var(--green)" : "var(--surface-2)",
                  color: active ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${active ? "var(--green)" : "var(--border)"}`,
                  borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  transition: "background 0.12s",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* 利用者フィルター */}
        <select
          value={residentId}
          onChange={(e) => setResidentId(e.target.value)}
          style={{
            width: "100%", padding: "9px 12px",
            border: "1px solid var(--border)", borderRadius: 9,
            fontSize: 14, background: "var(--surface-2)",
            color: "var(--text-primary)", fontFamily: "inherit",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239c8a80' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: 36,
          }}
        >
          <option value="all">全利用者</option>
          {residents.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        {/* 件数表示 */}
        {!loading && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>
            {records.length} 件
          </p>
        )}
      </div>

      {/* ── 記録リスト ── */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 24px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              この期間の記録はありません
            </p>
          </div>
        ) : (
          records.map((r) => {
            const mealCfg = MEAL_COLOR[r.meal] ?? MEAL_COLOR.none;
            const condCfg = CONDITION_COLOR[r.condition] ?? CONDITION_COLOR.normal;
            return (
              <div
                key={r.id}
                style={{
                  padding: "14px 16px",
                  background: "var(--surface)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {/* ヘッダー行：利用者名 + 時刻 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                    {r.residents?.name ?? "—"}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0, marginLeft: 8 }}>
                    {formatDateTime(r.recorded_at)}
                  </span>
                </div>

                {/* バッジ行 */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: r.note ? 8 : 6 }}>
                  <Badge
                    label={MEAL_LABEL[r.meal] ?? r.meal}
                    color={mealCfg.color}
                    bg={mealCfg.bg}
                  />
                  <Badge
                    label={CONDITION_LABEL[r.condition] ?? r.condition}
                    color={condCfg.color}
                    bg={condCfg.bg}
                  />
                </div>

                {/* メモ */}
                {r.note && (
                  <p style={{
                    fontSize: 14, color: "var(--text-secondary)",
                    margin: "0 0 6px", lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                  }}>
                    {r.note}
                  </p>
                )}

                {/* 記録者 */}
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  記録：{r.staff?.name ?? "—"}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      background: bg, color,
      fontSize: 12, fontWeight: 700,
      padding: "3px 10px", borderRadius: 20,
    }}>
      {label}
    </span>
  );
}
