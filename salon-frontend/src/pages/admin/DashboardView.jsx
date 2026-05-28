import { useMemo } from "react";
import { useTranslation } from "../../i18n/LanguageContext";

const styles = {
  chartGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  panel: { background: "#f5eedd", borderRadius: 10, padding: 20, border: "1px solid #e8dcc8" },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "#8B5E3C" },
  row: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e8dcc8", fontSize: 13, color: "#5c4a32" },
  barOuter: { height: 8, background: "#e8dcc8", borderRadius: 4, marginTop: 4 },
  barInner: { height: 8, borderRadius: 4, background: "#8B5E3C" },
};

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
    const revenueTrend = Object.entries(daily).sort().slice(-14).map(([date, amount]) => ({ label: date.slice(5), amount }));
    return {
      daily: daily[today] || 0,
      weekly: weekly[thisWeekKey] || 0,
      monthly: monthly[thisMonth] || 0,
      trend: revenueTrend,
    };
  }, [transactions]);

  const maxTrend = Math.max(...revenue.trend.map((r) => r.amount), 1);

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
          <div style={{ fontSize: 13, color: "#a09070" }}>{t("dashboard.noData")}</div>
        ) : (
          revenue.trend.map((r) => (
            <div key={r.label} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8b7355" }}>
                <span>{r.label}</span>
                <span>{r.amount.toLocaleString()}</span>
              </div>
              <div style={styles.barOuter}>
                <div style={{ ...styles.barInner, width: `${(r.amount / maxTrend) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
