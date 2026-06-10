import { useMemo } from "react";
import { useTranslation } from "../../i18n/LanguageContext";

const styles = {
  chartGrid: { display: "flex", flexDirection: "column", gap: 16 },
  panel: { background: "var(--bg-card)", borderRadius: 10, padding: 20, border: "1px solid var(--border-color)" },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "var(--color-primary)" },
  row: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-primary)" },
};

function formatLabel(iso) {
  const start = new Date(iso);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(start)}-${fmt(end)}`;
}

export default function DashboardView({ transactions }) {
  const { t } = useTranslation();
  const revenue = useMemo(() => {
    const daily = {}, weekly = {}, monthly = {};
    for (const tx of transactions) {
      const d = new Date(tx.createdAt);
      const dayKey = d.toISOString().split("T")[0];
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      daily[dayKey] = (daily[dayKey] || 0) + tx.total;
      weekly[weekKey] = (weekly[weekKey] || 0) + tx.total;
      monthly[monthKey] = (monthly[monthKey] || 0) + tx.total;
    }
    const today = new Date().toISOString().split("T")[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
    const thisWeekKey = thisWeek.toISOString().split("T")[0];
    const thisMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const trend = Object.entries(weekly).filter(([date]) => date !== thisWeekKey).sort().slice(-8).map(([date, amount]) => ({ label: formatLabel(date), amount }));
    return { daily: daily[today] || 0, weekly: weekly[thisWeekKey] || 0, monthly: monthly[thisMonth] || 0, trend };
  }, [transactions]);

  const maxVal = Math.max(...revenue.trend.map((r) => r.amount), 1);
  const W = 380, H = 200, PAD = { l: 45, r: 10, t: 10, b: 35 };
  const cw = W - PAD.l - PAD.r, ch = H - PAD.t - PAD.b;
  const stepX = cw / Math.max(revenue.trend.length - 1, 1);
  const getX = (i) => PAD.l + i * stepX;
  const getY = (v) => PAD.t + ch - (v / maxVal) * ch;
  const yLabels = [0, Math.round(maxVal / 2), maxVal];

  return (
    <div style={styles.chartGrid}>
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{t("dashboard.revenueOverview")}</h3>
        <div>
          <div style={styles.row}><span>{t("dashboard.daily")}</span><span>{revenue.daily.toLocaleString()} Birr</span></div>
          <div style={styles.row}><span>{t("dashboard.weekly")}</span><span>{revenue.weekly.toLocaleString()} Birr</span></div>
          <div style={styles.row}><span>{t("dashboard.monthly")}</span><span>{revenue.monthly.toLocaleString()} Birr</span></div>
        </div>
      </div>

      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{t("dashboard.revenueTrend")}</h3>
        {revenue.trend.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("dashboard.noData")}</div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
            {yLabels.map((v) => (
              <g key={v}>
                <line x1={PAD.l} y1={getY(v)} x2={W - PAD.r} y2={getY(v)} stroke="var(--border-color)" strokeWidth={1} />
                <text x={PAD.l - 4} y={getY(v) + 3} textAnchor="end" fontSize={9} fill="var(--text-muted)">{v.toLocaleString()}</text>
              </g>
            ))}
            <line x1={PAD.l} y1={PAD.t + ch} x2={W - PAD.r} y2={PAD.t + ch} stroke="var(--border-color)" strokeWidth={1} />
            <polyline fill="none" stroke="var(--color-primary)" strokeWidth={2.5} points={revenue.trend.map((r, i) => `${getX(i)},${getY(r.amount)}`).join(" ")} />
            {revenue.trend.map((r, i) => (
              <g key={r.label}>
                <text x={getX(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize={9} fill="var(--text-secondary)">{r.label}</text>
                <circle cx={getX(i)} cy={getY(r.amount)} r={3} fill="var(--color-primary)" />
                <text x={getX(i)} y={getY(r.amount) - 7} textAnchor="middle" fontSize={9} fill="var(--text-primary)">{r.amount.toLocaleString()}</text>
              </g>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
