import { useMemo, useState } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import OfflineTransactionHistory from "../../components/OfflineTransactionHistory";

const styles = {
  filterRow: { display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" },
  filterGroup: { display: "flex", flexDirection: "column", gap: 4 },
  filterLabel: { fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-primary)", fontSize: 13 },
  select: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-primary)", fontSize: 13, minWidth: 120 },
  panel: { background: "var(--bg-card)", borderRadius: 10, padding: 20, border: "1px solid var(--border-color)" },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "var(--color-primary)" },
  txItem: { padding: "12px 0", borderBottom: "1px solid var(--border-color)", fontSize: 13 },
  txHeader: { display: "flex", justifyContent: "space-between", marginBottom: 4 },
  txMeta: { display: "flex", gap: 12, fontSize: 11, color: "var(--text-secondary)" },
  badge: { display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 },
  card: { background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border-color)" },
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
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-primary)", cursor: "pointer" }}
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
            border: "1px solid var(--border-color)",
            background: canSearch ? "var(--color-primary)" : "var(--border-color)",
            color: canSearch ? "#fff" : "var(--text-muted)",
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
              border: "1px solid var(--border-color)",
              background: "var(--border-color)",
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
          >
            {t("tx.hideResults")}
          </button>
        )}
      </div>

      {showResults ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse", fontSize: 13, background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border-color)" }}>
            <thead>
              <tr style={{ background: "var(--border-color)", color: "var(--text-primary)" }}>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Date</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>{t("tx.service")}</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>{t("staff.name")}</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>{t("tx.payment")}</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>{t("tx.total")}</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>{t("tx.tip")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>{t("tx.noFound")}</td></tr>
              ) : (
                filtered.map((tx) => {
                  const svcs = tx.services || [];
                  return svcs.length === 0 ? (
                    <tr key={tx._id || tx.uuid} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>{new Date(tx.createdAt).toLocaleString()}</td>
                      <td style={{ padding: "8px 12px" }}>—</td>
                      <td style={{ padding: "8px 12px" }}>—</td>
                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}><span style={{ background: "var(--border-color)", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{tx.paymentType}</span></td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{tx.total} Birr</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap" }}>{tx.tip > 0 ? `${tx.tip} Birr` : "—"}</td>
                    </tr>
                  ) : svcs.map((svc, i) => (
                    <tr key={`${tx._id || tx.uuid}-${i}`} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      {i === 0 && (
                        <td rowSpan={svcs.length} style={{ padding: "8px 12px", whiteSpace: "nowrap", verticalAlign: "top" }}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                      )}
                      <td style={{ padding: "8px 12px" }}>{svc.name}</td>
                      <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{svc.staff}</td>
                      {i === 0 && (
                        <td rowSpan={svcs.length} style={{ padding: "8px 12px", whiteSpace: "nowrap", verticalAlign: "top" }}>
                          <span style={{ background: "var(--border-color)", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{tx.paymentType}</span>
                        </td>
                      )}
                      {i === 0 && (
                        <td rowSpan={svcs.length} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", verticalAlign: "top" }}>{tx.total} Birr</td>
                      )}
                      {i === 0 && (
                        <td rowSpan={svcs.length} style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap", verticalAlign: "top" }}>{tx.tip > 0 ? `${tx.tip} Birr` : "—"}</td>
                      )}
                    </tr>
                  ));
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ fontSize: 14, color: "var(--text-muted)", padding: 20, background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border-color)" }}>
          {t("tx.instructions")}
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <OfflineTransactionHistory />
      </div>
    </div>
  );
}
