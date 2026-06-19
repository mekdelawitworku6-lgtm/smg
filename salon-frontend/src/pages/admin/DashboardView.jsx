import { useState, useMemo } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#a4de6c", "#d0ed57", "#83a6ed", "#8dd1e1", "#b668d9", "#f08080"];

const styles = {
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 },
  summaryCard: { background: "var(--bg-card)", borderRadius: 12, padding: "16px 20px", border: "1px solid var(--border-color)", textAlign: "center" },
  summaryLabel: { fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: 700, color: "var(--color-primary)" },
  summarySub: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 },
  panel: { background: "var(--bg-card)", borderRadius: 12, padding: 20, border: "1px solid var(--border-color)", marginBottom: 20 },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "var(--color-primary)" },
  tabRow: { display: "flex", gap: 8, marginBottom: 16 },
  tab: { padding: "4px 14px", borderRadius: 20, border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  tabActive: { background: "var(--color-primary)", color: "#fff", borderColor: "var(--color-primary)" },
  drillRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-primary)", cursor: "pointer" },
  insightGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 },
  insightCard: { background: "var(--bg-card)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--border-color)" },
  insightLabel: { fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  insightValue: { fontSize: 16, fontWeight: 700, color: "var(--text-primary)" },
  row: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-primary)" },
};

function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isToday(d) {
  return fmt(d) === fmt(new Date());
}

function isThisWeek(d) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return d >= start && d <= end;
}

function isThisMonth(d) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardView({ transactions }) {
  const { t } = useTranslation();
  const [trendMode, setTrendMode] = useState("daily");
  const [catDrill, setCatDrill] = useState(null);
  const [topDrill, setTopDrill] = useState(null);
  const [revDrill, setRevDrill] = useState(null);
  const [mthDrill, setMthDrill] = useState(null);

  const todayServices = useMemo(() => transactions.filter((tx) => isToday(new Date(tx.createdAt))), [transactions]);
  const weekServices = useMemo(() => transactions.filter((tx) => isThisWeek(new Date(tx.createdAt))), [transactions]);
  const monthServices = useMemo(() => transactions.filter((tx) => isThisMonth(new Date(tx.createdAt))), [transactions]);

  const summary = useMemo(() => ({
    today: { count: todayServices.reduce((s, t) => s + (t.services || []).length, 0), revenue: todayServices.reduce((s, t) => s + (t.total || 0), 0) },
    week: { count: weekServices.reduce((s, t) => s + (t.services || []).length, 0), revenue: weekServices.reduce((s, t) => s + (t.total || 0), 0) },
    month: { count: monthServices.reduce((s, t) => s + (t.services || []).length, 0), revenue: monthServices.reduce((s, t) => s + (t.total || 0), 0) },
  }), [todayServices, weekServices, monthServices]);

  const trendData = useMemo(() => {
    if (transactions.length === 0) return [];
    if (trendMode === "daily") {
      const map = {};
      for (let h = 7; h <= 21; h++) map[`${h}:00`] = 0;
      for (const tx of transactions) {
        const d = new Date(tx.createdAt);
        if (isToday(d)) {
          const h = d.getHours();
          const key = `${h}:00`;
          if (map[key] !== undefined) map[key] += (tx.services || []).length;
        }
      }
      return Object.entries(map).map(([label, count]) => ({ label, count }));
    }
    if (trendMode === "weekly") {
      const map = {};
      for (const d of DAYS) map[d] = 0;
      for (const tx of transactions) {
        if (isThisWeek(new Date(tx.createdAt))) {
          const d = DAYS[new Date(tx.createdAt).getDay()];
          map[d] += (tx.services || []).length;
        }
      }
      return Object.entries(map).map(([label, count]) => ({ label, count }));
    }
    const map = {};
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) map[String(i)] = 0;
    for (const tx of transactions) {
      const d = new Date(tx.createdAt);
      if (isThisMonth(d)) {
        map[String(d.getDate())] += (tx.services || []).length;
      }
    }
    return Object.entries(map).map(([label, count]) => ({ label, count }));
  }, [transactions, trendMode]);

  const categoryDist = useMemo(() => {
    const map = {};
    for (const tx of transactions) {
      for (const svc of (tx.services || [])) {
        const cat = svc.category || "Other";
        map[cat] = (map[cat] || 0) + 1;
      }
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const catDrillServices = useMemo(() => {
    if (!catDrill) return [];
    const map = {};
    for (const tx of transactions) {
      for (const svc of (tx.services || [])) {
        if ((svc.category || "Other") === catDrill) {
          const n = svc.name;
          map[n] = (map[n] || 0) + 1;
        }
      }
    }
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [transactions, catDrill]);

  const topServices = useMemo(() => {
    const map = {};
    for (const tx of transactions) {
      for (const svc of (tx.services || [])) {
        map[svc.name] = (map[svc.name] || 0) + 1;
      }
    }
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [transactions]);

  const topDrillData = useMemo(() => {
    if (!topDrill) return null;
    const todayCount = todayServices.reduce((s, tx) => s + (tx.services || []).filter((svc) => svc.name === topDrill).length, 0);
    const weekCount = weekServices.reduce((s, tx) => s + (tx.services || []).filter((svc) => svc.name === topDrill).length, 0);
    const monthCount = monthServices.reduce((s, tx) => s + (tx.services || []).filter((svc) => svc.name === topDrill).length, 0);
    const revenue = transactions.reduce((s, tx) => s + (tx.services || []).filter((svc) => svc.name === topDrill).reduce((ss, svc) => ss + Number(svc.price || 0), 0), 0);
    return { todayCount, weekCount, monthCount, revenue };
  }, [transactions, topDrill, todayServices, weekServices, monthServices]);

  const revenueDist = useMemo(() => {
    const map = {};
    for (const tx of transactions) {
      for (const svc of (tx.services || [])) {
        map[svc.name] = (map[svc.name] || 0) + Number(svc.price || 0);
      }
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [transactions]);

  const revDrillData = useMemo(() => {
    if (!revDrill) return null;
    const todayRev = todayServices.reduce((s, tx) => s + (tx.services || []).filter((svc) => svc.name === revDrill).reduce((ss, svc) => ss + Number(svc.price || 0), 0), 0);
    const weekRev = weekServices.reduce((s, tx) => s + (tx.services || []).filter((svc) => svc.name === revDrill).reduce((ss, svc) => ss + Number(svc.price || 0), 0), 0);
    const monthRev = monthServices.reduce((s, tx) => s + (tx.services || []).filter((svc) => svc.name === revDrill).reduce((ss, svc) => ss + Number(svc.price || 0), 0), 0);
    return { todayRev, weekRev, monthRev };
  }, [transactions, revDrill, todayServices, weekServices, monthServices]);

  const monthlyGrowth = useMemo(() => {
    const map = {};
    for (const tx of transactions) {
      const d = new Date(tx.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { services: 0, revenue: 0 };
      map[key].services += (tx.services || []).length;
      map[key].revenue += tx.total || 0;
    }
    return Object.entries(map).map(([key, val]) => {
      const [y, m] = key.split("-");
      return { label: `${MONTHS[parseInt(m) - 1]} ${y.slice(2)}`, services: val.services, revenue: val.revenue };
    }).slice(-12);
  }, [transactions]);

  const mthDrillData = useMemo(() => {
    if (!mthDrill) return null;
    const totalServices = mthDrill.services;
    const totalRevenue = mthDrill.revenue;
    const svcMap = {};
    for (const tx of transactions) {
      const d = new Date(tx.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      if (label === mthDrill.label) {
        for (const svc of (tx.services || [])) {
          svcMap[svc.name] = (svcMap[svc.name] || 0) + 1;
        }
      }
    }
    const topSvc = Object.entries(svcMap).sort((a, b) => b[1] - a[1])[0];
    return { services: totalServices, revenue: totalRevenue, topService: topSvc ? topSvc[0] : "-" };
  }, [transactions, mthDrill]);

  const insights = useMemo(() => {
    if (transactions.length === 0) return {};
    const svcCount = {};
    const svcRev = {};
    const catCount = {};
    const dayCount = {};
    const hourCount = {};
    for (const tx of transactions) {
      const d = new Date(tx.createdAt);
      const day = DAYS[d.getDay()];
      const h = d.getHours();
      dayCount[day] = (dayCount[day] || 0) + (tx.services || []).length;
      hourCount[h] = (hourCount[h] || 0) + (tx.services || []).length;
      for (const svc of (tx.services || [])) {
        svcCount[svc.name] = (svcCount[svc.name] || 0) + 1;
        svcRev[svc.name] = (svcRev[svc.name] || 0) + Number(svc.price || 0);
        const cat = svc.category || "Other";
        catCount[cat] = (catCount[cat] || 0) + 1;
      }
    }
    const mostPopular = Object.entries(svcCount).sort((a, b) => b[1] - a[1])[0];
    const highestRevenue = Object.entries(svcRev).sort((a, b) => b[1] - a[1])[0];
    const fastestCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
    const busiestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
    const peakHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];
    const growth = monthlyGrowth.length >= 2
      ? ((monthlyGrowth[monthlyGrowth.length - 1].services - monthlyGrowth[monthlyGrowth.length - 2].services) / monthlyGrowth[monthlyGrowth.length - 2].services * 100).toFixed(0)
      : "0";
    return {
      mostPopular: mostPopular ? mostPopular[0] : "-",
      highestRevenue: highestRevenue ? highestRevenue[0] : "-",
      fastestCategory: fastestCategory ? fastestCategory[0] : "-",
      busiestDay: busiestDay ? busiestDay[0] : "-",
      peakHour: peakHour ? `${peakHour[0]}:00 - ${Number(peakHour[0]) + 2}:00` : "-",
      growth: `${growth}%`,
    };
  }, [transactions, monthlyGrowth]);

  const chartHeight = 240;

  return (
    <div>
      {/* 1. Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>{t("dashboard.todayServices")}</div>
          <div style={styles.summaryValue}>{summary.today.count}</div>
          <div style={styles.summarySub}>{summary.today.revenue.toLocaleString()} ETB</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>{t("dashboard.todayRevenue")}</div>
          <div style={styles.summaryValue}>{summary.today.revenue.toLocaleString()} ETB</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>{t("dashboard.weekServices")}</div>
          <div style={styles.summaryValue}>{summary.week.count}</div>
          <div style={styles.summarySub}>{summary.week.revenue.toLocaleString()} ETB</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>{t("dashboard.weekRevenue")}</div>
          <div style={styles.summaryValue}>{summary.week.revenue.toLocaleString()} ETB</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>{t("dashboard.monthServices")}</div>
          <div style={styles.summaryValue}>{summary.month.count}</div>
          <div style={styles.summarySub}>{summary.month.revenue.toLocaleString()} ETB</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>{t("dashboard.monthRevenue")}</div>
          <div style={styles.summaryValue}>{summary.month.revenue.toLocaleString()} ETB</div>
        </div>
      </div>

      {/* 2. Service Activity Trend */}
      <div style={styles.panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ ...styles.panelTitle, margin: 0 }}>{t("dashboard.serviceTrend")}</h3>
          <div style={styles.tabRow}>
            {["daily", "weekly", "monthly"].map((mode) => (
              <button key={mode} style={{ ...styles.tab, ...(trendMode === mode ? styles.tabActive : {}) }} onClick={() => { setTrendMode(mode); setTopDrill(null); }}>{t(`dashboard.${mode}`)}</button>
            ))}
          </div>
        </div>
        {trendData.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)", padding: 20, textAlign: "center" }}>{t("dashboard.noData")}</div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2.5} dot={{ r: 3, fill: "#8884d8" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 3. Category Distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>{t("dashboard.categoryDist")}</h3>
          {categoryDist.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)", padding: 20, textAlign: "center" }}>{t("dashboard.noData")}</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryDist} cx="50%" cy="50%" outerRadius={80} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryDist.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} cursor="pointer" onClick={() => setCatDrill(catDrill === _.name ? null : _.name)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {catDrill && (
                <div style={{ marginTop: 12, borderTop: "1px solid var(--border-color)", paddingTop: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{catDrill}</div>
                  {catDrillServices.map((s) => (
                    <div key={s.name} style={styles.row}>
                      <span>{s.name}</span>
                      <span>{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Top 10 Services */}
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>{t("dashboard.topServices")}</h3>
          {topServices.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)", padding: 20, textAlign: "center" }}>{t("dashboard.noData")}</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topServices} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" cursor="pointer" onClick={(data) => setTopDrill(topDrill === data.name ? null : data.name)} />
                </BarChart>
              </ResponsiveContainer>
              {topDrill && topDrillData && (
                <div style={{ marginTop: 12, borderTop: "1px solid var(--border-color)", paddingTop: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{topDrill}</div>
                  <div style={styles.row}><span>{t("dashboard.today")}</span><span>{topDrillData.todayCount}</span></div>
                  <div style={styles.row}><span>{t("dashboard.weekly")}</span><span>{topDrillData.weekCount}</span></div>
                  <div style={styles.row}><span>{t("dashboard.monthly")}</span><span>{topDrillData.monthCount}</span></div>
                  <div style={styles.row}><span>{t("dashboard.revenue")}</span><span>{topDrillData.revenue.toLocaleString()} ETB</span></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 5. Revenue Distribution */}
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{t("dashboard.revenueDist")}</h3>
        {revenueDist.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)", padding: 20, textAlign: "center" }}>{t("dashboard.noData")}</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={revenueDist} cx="50%" cy="50%" outerRadius={90} innerRadius={55} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {revenueDist.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} cursor="pointer" onClick={() => setRevDrill(revDrill === _.name ? null : _.name)} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v.toLocaleString()} ETB`} />
              </PieChart>
            </ResponsiveContainer>
            {revDrill && revDrillData && (
              <div style={{ marginTop: 12, borderTop: "1px solid var(--border-color)", paddingTop: 12, display: "flex", gap: 32, justifyContent: "center" }}>
                <div><div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t("dashboard.revenueToday")}</div><div style={{ fontWeight: 700, fontSize: 16 }}>{revDrillData.todayRev.toLocaleString()} ETB</div></div>
                <div><div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t("dashboard.revenueWeek")}</div><div style={{ fontWeight: 700, fontSize: 16 }}>{revDrillData.weekRev.toLocaleString()} ETB</div></div>
                <div><div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t("dashboard.revenueMonth")}</div><div style={{ fontWeight: 700, fontSize: 16 }}>{revDrillData.monthRev.toLocaleString()} ETB</div></div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 6. Monthly Growth */}
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{t("dashboard.monthlyGrowth")}</h3>
        {monthlyGrowth.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)", padding: 20, textAlign: "center" }}>{t("dashboard.noData")}</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="services" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} strokeWidth={2.5} cursor="pointer" activeDot={{ r: 5, onClick: (_, payload) => payload && setMthDrill(mthDrill?.label === payload.payload.label ? null : payload.payload) }} />
              </AreaChart>
            </ResponsiveContainer>
            {mthDrill && mthDrillData && (
              <div style={{ marginTop: 12, borderTop: "1px solid var(--border-color)", paddingTop: 12, display: "flex", gap: 32, justifyContent: "center" }}>
                <div><div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t("dashboard.services")}</div><div style={{ fontWeight: 700, fontSize: 16 }}>{mthDrillData.services}</div></div>
                <div><div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t("dashboard.revenue")}</div><div style={{ fontWeight: 700, fontSize: 16 }}>{mthDrillData.revenue.toLocaleString()} ETB</div></div>
                <div><div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t("dashboard.topService")}</div><div style={{ fontWeight: 700, fontSize: 16 }}>{mthDrillData.topService}</div></div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 7. Insights Panel */}
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{t("dashboard.insights")}</h3>
        <div style={styles.insightGrid}>
          <div style={styles.insightCard}>
            <div style={styles.insightLabel}>{t("dashboard.mostPopular")}</div>
            <div style={styles.insightValue}>{insights.mostPopular}</div>
          </div>
          <div style={styles.insightCard}>
            <div style={styles.insightLabel}>{t("dashboard.highestRevenue")}</div>
            <div style={styles.insightValue}>{insights.highestRevenue}</div>
          </div>
          <div style={styles.insightCard}>
            <div style={styles.insightLabel}>{t("dashboard.fastestCategory")}</div>
            <div style={styles.insightValue}>{insights.fastestCategory}</div>
          </div>
          <div style={styles.insightCard}>
            <div style={styles.insightLabel}>{t("dashboard.busiestDay")}</div>
            <div style={styles.insightValue}>{insights.busiestDay}</div>
          </div>
          <div style={styles.insightCard}>
            <div style={styles.insightLabel}>{t("dashboard.peakHour")}</div>
            <div style={styles.insightValue}>{insights.peakHour}</div>
          </div>
          <div style={styles.insightCard}>
            <div style={styles.insightLabel}>{t("dashboard.monthlyGrowth")}</div>
            <div style={styles.insightValue}>{insights.growth}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
