import { useMemo, useState } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import OfflineTransactionHistory from "../../components/OfflineTransactionHistory";

const styles = {
  filterRow: { display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" },
  filterGroup: { display: "flex", flexDirection: "column", gap: 4 },
  filterLabel: { fontSize: 11, color: "#8b7355", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid #e8dcc8", background: "#fefcf8", color: "#3d2e1e", fontSize: 13 },
  select: { padding: "8px 12px", borderRadius: 6, border: "1px solid #e8dcc8", background: "#fefcf8", color: "#3d2e1e", fontSize: 13, minWidth: 120 },
  panel: { background: "#f5eedd", borderRadius: 10, padding: 20, border: "1px solid #e8dcc8" },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "#8B5E3C" },
  txItem: { padding: "12px 0", borderBottom: "1px solid #e8dcc8", fontSize: 13 },
  txHeader: { display: "flex", justifyContent: "space-between", marginBottom: 4 },
  txMeta: { display: "flex", gap: 12, fontSize: 11, color: "#8b7355" },
  badge: { display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 },
  card: { background: "#f5eedd", borderRadius: 10, padding: 16, border: "1px solid #e8dcc8" },
  row: { display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 },
};

export default function TransactionsView({ transactions }) {
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  const canSearch = Boolean(
    search || dateFrom || dateTo || serviceFilter || paymentFilter
  );

  const serviceNames = useMemo(
    () => [...new Set(transactions.flatMap((tx) => tx.services?.map((s) => s.name) || []))].sort(),
    [transactions]
  );

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.createdAt).toISOString().split("T")[0];
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      if (serviceFilter) {
        const has = tx.services?.some((s) => s.name === serviceFilter);
        if (!has) return false;
      }
      if (paymentFilter && tx.paymentType !== paymentFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchService = tx.services?.some((s) => s.name.toLowerCase().includes(q));
        const matchStaff = tx.services?.some((s) => s.staff?.toLowerCase().includes(q));
        if (!matchService && !matchStaff && !(tx.uuid || "").toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [transactions, dateFrom, dateTo, serviceFilter, paymentFilter, search]);

  return (
    <div>
      <div style={styles.filterRow}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>{t("tx.from")}</label>
          <input type="date" style={styles.input} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>{t("tx.to")}</label>
          <input type="date" style={styles.input} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>{t("tx.service")}</label>
          <select style={styles.select} value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
            <option value="">{t("tx.all")}</option>
            {serviceNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>{t("tx.payment")}</label>
          <select style={styles.select} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option value="">{t("tx.all")}</option>
            <option value="cash">{t("tx.cash")}</option>
            <option value="telebirr">{t("tx.telebirr")}</option>
            <option value="abysinya">{t("tx.abysinya")}</option>
            <option value="cbe">{t("tx.cbe")}</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>{t("tx.search")}</label>
          <input type="text" placeholder={t("tx.searchPlaceholder")} style={styles.input} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => {
            setDateFrom("");
            setDateTo("");
            setServiceFilter("");
            setPaymentFilter("");
            setSearch("");
            setShowResults(true);
          }}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e8dcc8", background: "#f5eedd", color: "#5c4a32", cursor: "pointer" }}
        >
          {t("tx.showAll")}
        </button>
        <button
          type="button"
          disabled={!canSearch}
          onClick={() => setShowResults(true)}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #e8dcc8",
            background: canSearch ? "#8B5E3C" : "#e8dcc8",
            color: canSearch ? "#fff" : "#a09070",
            cursor: canSearch ? "pointer" : "not-allowed",
          }}
        >
          {t("tx.search")}
        </button>
        {showResults && (
          <button
            type="button"
            onClick={() => setShowResults(false)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #e8dcc8",
              background: "#e8dcc8",
              color: "#5c4a32",
              cursor: "pointer",
            }}
          >
            {t("tx.hideResults")}
          </button>
        )}
      </div>

      {showResults ? (
        <div style={styles.grid}>
        {filtered.length === 0 ? (
          <div style={{ fontSize: 13, color: "#a09070", gridColumn: "1/-1" }}>{t("tx.noFound")}</div>
        ) : (
          filtered.map((tx) => (
            <div key={tx._id || tx.uuid} style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#a09070" }}>
                  {new Date(tx.createdAt).toLocaleString()}
                </div>
                <span style={{ ...styles.badge, background: "#e8dcc8", color: "#5c4a32" }}>
                  {tx.paymentType}
                </span>
              </div>

              {tx.services?.map((svc, i) => (
                <div key={i} style={styles.row}>
                  <span>{svc.name}</span>
                  <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "#8b7355" }}>{svc.staff}</span>
                    <span style={{ fontWeight: 600 }}>{svc.price} Birr</span>
                  </span>
                </div>
              ))}

              <div style={{ borderTop: "1px solid #e8dcc8", marginTop: 8, paddingTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#8b7355" }}>{t("tx.total")}</span>
                    <span style={{ fontWeight: 700, color: "#8B5E3C" }}>{tx.total} Birr</span>
                    {tx.tip > 0 && <span style={{ fontSize: 11, color: "#8b7355" }}>{t("tx.tip")} {tx.tip} Birr</span>}
                  </div>
                  {(tx.services || []).some((svc) => svc.nonAsrat) && (
                    <span style={{ ...styles.badge, background: "#f5eedd", color: "#8B5E3C", fontSize: 10 }}>{t("tx.nonAsrat")}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      ) : (
        <div style={{ fontSize: 14, color: "#a09070", padding: 20, background: "#f5eedd", borderRadius: 10, border: "1px solid #e8dcc8" }}>
          {t("tx.instructions")}
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <OfflineTransactionHistory />
      </div>
    </div>
  );
}
