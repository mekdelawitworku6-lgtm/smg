import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addExpense, removeExpense } from "../day/daySlice";
import { useTranslation } from "../i18n/LanguageContext";

export default function ExpenseManager() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentDay = useSelector((state) => state.day.currentDay);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("cash");
  const [showForm, setShowForm] = useState(false);

  if (!currentDay) return null;

  const expenses = currentDay.expenses || [];
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const handleAdd = () => {
    if (!name || !amount || Number(amount) <= 0) return;
    dispatch(addExpense({ name, amount: Number(amount), paymentType }));
    setName("");
    setAmount("");
    setShowForm(false);
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 15, color: "var(--text-primary)" }}>{t("day.expenseTitle")}</h3>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-danger)" }}>
          {t("day.totalExpenses")} {totalExpenses} Birr
        </span>
      </div>

      {expenses.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {expenses.map((exp, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border-color)", fontSize: 13 }}>
              <span style={{ flex: 1 }}>{exp.name}</span>
              <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{exp.amount} Birr</span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", background: "var(--border-color)", padding: "2px 6px", borderRadius: 4 }}>{exp.paymentType}</span>
              <button onClick={() => dispatch(removeExpense(i))} style={{ padding: "2px 8px", background: "var(--color-danger)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("day.expenseName")} style={{ flex: 1, minWidth: 120, padding: "8px", borderRadius: 5, border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-primary)", fontSize: 13 }} />
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder={t("day.expenseAmount")} style={{ width: 100, padding: "8px", borderRadius: 5, border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-primary)", fontSize: 13 }} />
          <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} style={{ padding: "8px", borderRadius: 5, border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-primary)", fontSize: 13 }}>
            <option value="cash">{t("cashier.paymentCash")}</option>
            <option value="telebirr">{t("cashier.paymentTelebirr")}</option>
            <option value="abysinya">{t("cashier.paymentAbysinya")}</option>
            <option value="cbe">{t("cashier.paymentCBE")}</option>
          </select>
          <button onClick={handleAdd} style={{ padding: "8px 14px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{t("day.addExpense")}</button>
          <button onClick={() => setShowForm(false)} style={{ padding: "8px 14px", background: "var(--border-color)", color: "var(--text-primary)", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 13 }}>{t("cashier.cancel")}</button>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{ padding: "8px 14px", background: "#fff", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: 5, cursor: "pointer", fontSize: 13 }}>
          + {t("day.addExpense")}
        </button>
      )}
    </div>
  );
}
