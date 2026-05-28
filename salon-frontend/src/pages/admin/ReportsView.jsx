import { useMemo, useState } from "react";
import { useTranslation } from "../../i18n/LanguageContext";

const styles = {
  filterRow: { display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap" },
  filterGroup: { display: "flex", flexDirection: "column", gap: 4 },
  filterLabel: { fontSize: 11, color: "#8b7355", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid #e8dcc8", background: "#fefcf8", color: "#3d2e1e", fontSize: 13 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 24 },
  card: { background: "#f5eedd", borderRadius: 10, padding: 20, border: "1px solid #e8dcc8" },
  cardValue: { fontSize: 28, fontWeight: 700, margin: "4px 0 0", color: "#3d2e1e" },
  cardLabel: { fontSize: 12, color: "#8b7355", textTransform: "uppercase", letterSpacing: 0.5 },
  panel: { background: "#f5eedd", borderRadius: 10, padding: 20, border: "1px solid #e8dcc8", marginBottom: 20 },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "#8B5E3C" },
  row: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e8dcc8", fontSize: 14 },
  totalRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 16, fontWeight: 700, color: "#8B5E3C" },
  section: { marginBottom: 24 },
  formulaBox: { background: "#fefcf8", borderRadius: 8, padding: 16, marginTop: 12, fontSize: 13, fontFamily: "monospace", lineHeight: 1.6, border: "1px solid #e8dcc8", color: "#3d2e1e" },
  highlight: { color: "#8B5E3C", fontWeight: 600 },
};

export default function ReportsView({ transactions }) {
  const { t } = useTranslation();
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split("T")[0]);

  const dayTx = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.createdAt).toISOString().split("T")[0];
      return d === reportDate;
    });
  }, [transactions, reportDate]);

  const totalIncome = dayTx.reduce((s, t) => s + (t.total || 0), 0);
  const cashPayments = dayTx.filter((t) => t.paymentType === "cash").reduce((s, t) => s + (t.total || 0), 0);
  const transferPayments = dayTx.filter((t) => t.paymentType && t.paymentType !== "cash").reduce((s, t) => s + (t.total || 0), 0);
  const nonAsratSales = dayTx.reduce((s, t) => {
    const txNon = (t.services || []).filter((svc) => svc.nonAsrat).reduce((ss, svc) => ss + (Number(svc.price) || 0), 0);
    return s + txNon;
  }, 0);
  const deductibleAmount = totalIncome - nonAsratSales;
  const asratMoney = deductibleAmount > 5500 ? (deductibleAmount - 5500) * 0.1 : 0;
  const totalTips = dayTx.reduce((s, t) => s + (t.tip || 0), 0);
  const finalCashAmount = totalIncome - asratMoney - totalTips;
  const txCount = dayTx.length;

  return (
    <div>
      <div style={styles.filterRow}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>{t("report.reportDate")}</label>
          <input type="date" style={styles.input} value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>{t("report.totalIncome")}</div>
          <div style={styles.cardValue}>{totalIncome.toLocaleString()} Birr</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>{t("report.cashPayments")}</div>
          <div style={styles.cardValue}>{cashPayments.toLocaleString()} Birr</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>{t("report.transferPayments")}</div>
          <div style={styles.cardValue}>{transferPayments.toLocaleString()} Birr</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>{t("report.nonAsratSales")}</div>
          <div style={styles.cardValue}>{nonAsratSales.toLocaleString()} Birr</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>{t("report.deductibleAmount")}</div>
          <div style={styles.cardValue}>{deductibleAmount.toLocaleString()} Birr</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>{t("report.asratMoney")}</div>
          <div style={{ ...styles.cardValue, color: "#8B5E3C" }}>{asratMoney.toLocaleString()} Birr</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>{t("report.totalTips")}</div>
          <div style={styles.cardValue}>{totalTips.toLocaleString()} Birr</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>{t("report.txCount")}</div>
          <div style={styles.cardValue}>{txCount}</div>
        </div>
      </div>

      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{t("report.finalCashCalc")}</h3>
        <div style={styles.row}><span>{t("report.totalIncome")}</span><span>{totalIncome.toLocaleString()} Birr</span></div>
        <div style={styles.row}><span>{t("report.asratMoney")}</span><span style={{ color: "#f87171" }}>- {asratMoney.toLocaleString()} Birr</span></div>
        <div style={styles.row}><span>{t("report.totalTips")}</span><span style={{ color: "#f87171" }}>- {totalTips.toLocaleString()} Birr</span></div>
        <div style={{ ...styles.totalRow, borderTop: "1px solid #8B5E3C", marginTop: 8, paddingTop: 12 }}>
          <span>{t("report.finalCashAmount")}</span>
          <span>{finalCashAmount.toLocaleString()} Birr</span>
        </div>
      </div>

      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{t("report.asratCalc")}</h3>
        <div style={styles.formulaBox}>
          <div>{t("report.formula")}</div>
          <div style={{ marginTop: 8 }}>
            = <span style={styles.highlight}>{totalIncome.toLocaleString()}</span> − <span style={styles.highlight}>{nonAsratSales.toLocaleString()}</span>
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

      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{t("report.tipBreakdown")}</h3>
        {dayTx.filter((t) => t.tip > 0).length === 0 ? (
          <div style={{ fontSize: 13, color: "#a09070" }}>{t("report.noTips")}</div>
        ) : (
          dayTx.filter((t) => t.tip > 0).map((tx) => (
            <div key={tx._id || tx.uuid} style={styles.row}>
              <span>{new Date(tx.createdAt).toLocaleTimeString()} · {tx.services?.[0]?.name}</span>
              <span>{t("report.tip")} {tx.tip} Birr</span>
            </div>
          ))
        )}
        <div style={{ ...styles.totalRow, marginTop: 8 }}>
          <span>{t("report.totalTips")}</span>
          <span>{totalTips.toLocaleString()} Birr</span>
        </div>
      </div>
    </div>
  );
}
