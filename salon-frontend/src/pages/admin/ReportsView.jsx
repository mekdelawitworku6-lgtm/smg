import { useMemo, useState } from "react";
import { useTranslation } from "../../i18n/LanguageContext";

const styles = {
  filterRow: { display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap" },
  filterGroup: { display: "flex", flexDirection: "column", gap: 4 },
  filterLabel: { fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13 },
  reportCard: { background: "var(--bg-card)", borderRadius: 12, padding: 24, border: "1px solid var(--border-color)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  reportTitle: { fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 20px", paddingBottom: 12, borderBottom: "2px solid var(--color-primary)" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 },
  fieldBox: { background: "var(--bg-card)", borderRadius: 10, padding: "14px 18px", border: "1px solid var(--border-color)" },
  fieldLabel: { fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  fieldValue: { fontSize: 22, fontWeight: 700, color: "var(--text-primary)" },
  highlightValue: { color: "var(--color-primary)" },
  panel: { background: "var(--bg-card)", borderRadius: 10, padding: 20, border: "1px solid var(--border-color)", marginBottom: 20 },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "var(--color-primary)" },
  row: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)", fontSize: 14 },
  totalRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 16, fontWeight: 700, color: "var(--color-primary)" },
  formulaBox: { background: "var(--bg-card)", borderRadius: 8, padding: 16, marginTop: 12, fontSize: 13, fontFamily: "monospace", lineHeight: 1.6, border: "1px solid var(--border-color)", color: "var(--text-primary)" },
};

export default function ReportsView({ transactions }) {
  const { t } = useTranslation();
  const today = new Date().toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  const dayTx = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.createdAt).toISOString().split("T")[0];
      return d >= dateFrom && d <= dateTo;
    });
  }, [transactions, dateFrom, dateTo]);

  const totalIncome = dayTx.reduce((s, t) => s + (t.total || 0), 0);
  const cashTotal = dayTx.filter((t) => t.paymentType === "cash").reduce((s, t) => s + (t.total || 0), 0);
  const telebirrTotal = dayTx.filter((t) => t.paymentType === "telebirr").reduce((s, t) => s + (t.total || 0), 0);
  const abysinyaTotal = dayTx.filter((t) => t.paymentType === "abysinya").reduce((s, t) => s + (t.total || 0), 0);
  const cbeTotal = dayTx.filter((t) => t.paymentType === "cbe").reduce((s, t) => s + (t.total || 0), 0);
  const transferTotal = telebirrTotal + abysinyaTotal + cbeTotal;
  const nonAsratSales = dayTx.reduce((s, t) => {
    const txNon = (t.services || []).filter((svc) => svc.nonAsrat).reduce((ss, svc) => ss + (Number(svc.price) || 0), 0);
    return s + txNon;
  }, 0);
  const deductibleAmount = totalIncome - nonAsratSales;
  const asratMoney = deductibleAmount > 5500 ? (deductibleAmount - 5500) * 0.1 : 0;
  const totalTips = dayTx.reduce((s, t) => {
    const txTips = t.tips || [];
    return s + txTips.reduce((ss, e) => ss + (Number(e.amount) || 0), 0);
  }, 0);
  const finalCashAmount = totalIncome - asratMoney - totalTips;
  const txCount = dayTx.length;
  const servicesCount = dayTx.reduce((s, t) => s + ((t.services || []).length), 0);

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
      </div>

      <div style={styles.reportCard}>
        <h2 style={styles.reportTitle}>Report — {dateFrom} to {dateTo}</h2>

        <div style={styles.grid2}>
          <div style={styles.fieldBox}>
            <div style={styles.fieldLabel}>{t("report.totalIncome")}</div>
            <div style={styles.fieldValue}>{totalIncome.toLocaleString()} Birr</div>
          </div>
          <div style={styles.fieldBox}>
            <div style={styles.fieldLabel}>Cash Total</div>
            <div style={styles.fieldValue}>{cashTotal.toLocaleString()} Birr</div>
          </div>
          <div style={styles.fieldBox}>
            <div style={styles.fieldLabel}>Transfer Total</div>
            <div style={styles.fieldValue}>{transferTotal.toLocaleString()} Birr</div>
          </div>
          <div style={styles.fieldBox}>
            <div style={styles.fieldLabel}>{t("report.totalTips")}</div>
            <div style={styles.fieldValue}>{totalTips.toLocaleString()} Birr</div>
          </div>
          <div style={styles.fieldBox}>
            <div style={styles.fieldLabel}>{t("report.txCount")}</div>
            <div style={styles.fieldValue}>{txCount}</div>
          </div>
          <div style={styles.fieldBox}>
            <div style={styles.fieldLabel}>Services Count</div>
            <div style={styles.fieldValue}>{servicesCount}</div>
          </div>
          <div style={styles.fieldBox}>
            <div style={styles.fieldLabel}>{t("report.nonAsratSales")}</div>
            <div style={styles.fieldValue}>{nonAsratSales.toLocaleString()} Birr</div>
          </div>
          <div style={styles.fieldBox}>
            <div style={styles.fieldLabel}>{t("report.asratMoney")}</div>
            <div style={{ ...styles.fieldValue, ...styles.highlightValue }}>{asratMoney.toLocaleString()} Birr</div>
          </div>
          <div style={{ ...styles.fieldBox, gridColumn: "1/-1" }}>
            <div style={styles.fieldLabel}>{t("report.finalCashAmount")}</div>
            <div style={{ ...styles.fieldValue, fontSize: 28 }}>{finalCashAmount.toLocaleString()} Birr</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 400px" }}>
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>{t("report.finalCashCalc")}</h3>
            <div style={styles.row}><span>{t("report.totalIncome")}</span><span>{totalIncome.toLocaleString()} Birr</span></div>
            <div style={styles.row}><span>Transfer Total</span><span>{transferTotal.toLocaleString()} Birr</span></div>
            <div style={styles.row}><span>{t("report.nonAsratSales")}</span><span>{nonAsratSales.toLocaleString()} Birr</span></div>
            <div style={styles.row}><span>{t("report.asratMoney")}</span><span style={{ color: "var(--color-danger)" }}>- {asratMoney.toLocaleString()} Birr</span></div>
            <div style={styles.row}><span>{t("report.totalTips")}</span><span style={{ color: "var(--color-danger)" }}>- {totalTips.toLocaleString()} Birr</span></div>
            <div style={{ ...styles.totalRow, borderTop: "1px solid var(--color-primary)", marginTop: 8, paddingTop: 12 }}>
              <span>{t("report.finalCashAmount")}</span>
              <span>{finalCashAmount.toLocaleString()} Birr</span>
            </div>
          </div>
        </div>

        <div style={{ flex: "1 1 400px" }}>
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>{t("report.asratCalc")}</h3>
            <div style={styles.formulaBox}>
              <div>{t("report.formula")}</div>
              <div style={{ marginTop: 8 }}>
                = <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>{totalIncome.toLocaleString()}</span> − <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>{nonAsratSales.toLocaleString()}</span>
              </div>
              <div style={{ marginTop: 4, fontWeight: 700 }}>= {deductibleAmount.toLocaleString()} Birr</div>
              {deductibleAmount > 5500 ? (
                <>
                  <div style={{ marginTop: 12 }}>{t("report.sinceGt")}</div>
                  <div style={{ marginTop: 4 }}>{t("report.asratBase", { deductible: deductibleAmount.toLocaleString(), base: (deductibleAmount - 5500).toLocaleString() })}</div>
                  <div style={{ marginTop: 4 }}>{t("report.asratMoneyEq", { base: (deductibleAmount - 5500).toLocaleString(), asrat: asratMoney.toLocaleString() })}</div>
                </>
              ) : (
                <div style={{ marginTop: 12 }}>{t("report.sinceLte")}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>Payment Breakdown</h3>
        <div style={styles.row}><span>{t("cashier.paymentCash")}</span><span>{cashTotal.toLocaleString()} Birr</span></div>
        <div style={styles.row}><span>{t("cashier.paymentTelebirr")}</span><span>{telebirrTotal.toLocaleString()} Birr</span></div>
        <div style={styles.row}><span>{t("cashier.paymentAbysinya")}</span><span>{abysinyaTotal.toLocaleString()} Birr</span></div>
        <div style={styles.row}><span>{t("cashier.paymentCBE")}</span><span>{cbeTotal.toLocaleString()} Birr</span></div>
      </div>

      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>Transactions</h3>
        {dayTx.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No transactions for this date</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-primary)" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Time</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>{t("tx.service")}</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Staff</th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>{t("tx.payment")}</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>{t("tx.total")}</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>{t("tx.tip")}</th>
                </tr>
              </thead>
              <tbody>
                {dayTx.map((tx) => {
                  const svcs = tx.services || [];
                  return svcs.length === 0 ? (
                    <tr key={tx._id || tx.uuid} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>{new Date(tx.createdAt).toLocaleTimeString()}</td>
                      <td style={{ padding: "8px 12px" }}>—</td>
                      <td style={{ padding: "8px 12px" }}>—</td>
                      <td style={{ padding: "8px 12px" }}><span style={{ background: "var(--border-color)", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{tx.paymentType}</span></td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>{tx.total} Birr</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>{tx.tip > 0 ? `${tx.tip} Birr` : "—"}</td>
                    </tr>
                  ) : svcs.map((svc, i) => (
                    <tr key={`${tx._id || tx.uuid}-${i}`} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      {i === 0 && <td rowSpan={svcs.length} style={{ padding: "8px 12px", whiteSpace: "nowrap", verticalAlign: "top" }}>{new Date(tx.createdAt).toLocaleTimeString()}</td>}
                      <td style={{ padding: "8px 12px" }}>{svc.name}</td>
                      <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{svc.staff}</td>
                      {i === 0 && <td rowSpan={svcs.length} style={{ padding: "8px 12px", verticalAlign: "top" }}><span style={{ background: "var(--border-color)", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{tx.paymentType}</span></td>}
                      {i === 0 && <td rowSpan={svcs.length} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, verticalAlign: "top" }}>{tx.total} Birr</td>}
                      {i === 0 && <td rowSpan={svcs.length} style={{ padding: "8px 12px", textAlign: "right", verticalAlign: "top" }}>{tx.tip > 0 ? `${tx.tip} Birr` : "—"}</td>}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
