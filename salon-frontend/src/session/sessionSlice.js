import { createSlice } from "@reduxjs/toolkit";

const SESSION_KEY = "cashierCurrentSession";

const loadSession = () => {
  try {
    const data = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (data && data.sessionId) return data;
  } catch { return null; }
  return null;
};

const persist = (data) => localStorage.setItem(SESSION_KEY, JSON.stringify(data));

const saved = loadSession();

const sessionSlice = createSlice({
  name: "session",
  initialState: {
    id: saved?.sessionId || "",
    start: saved?.startedAt || "",
    transactions: saved?.transactions || [],
  },
  reducers: {
    initSession(state) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      state.id = id;
      state.start = now;
      state.transactions = [];
      persist({ sessionId: id, startedAt: now, transactions: [] });
    },
    addTransaction(state, action) {
      state.transactions.push(action.payload);
      persist({ sessionId: state.id, startedAt: state.start, transactions: state.transactions });
    },
    setTransactions(state, action) {
      state.transactions = action.payload;
      persist({ sessionId: state.id, startedAt: state.start, transactions: state.transactions });
    },
    endSession(state) {
      const summary = {
        sessionId: state.id,
        date: state.start.split("T")[0],
        startedAt: state.start,
        endedAt: new Date().toISOString(),
        transactionCount: state.transactions.length,
        totalIncome: state.transactions.reduce((s, t) => s + t.total, 0),
        cashPayments: state.transactions.filter((t) => t.paymentType === "cash").reduce((s, t) => s + t.total, 0),
        telebirrPayments: state.transactions.filter((t) => t.paymentType === "telebirr").reduce((s, t) => s + t.total, 0),
        abysinyaPayments: state.transactions.filter((t) => t.paymentType === "abysinya").reduce((s, t) => s + t.total, 0),
        cbePayments: state.transactions.filter((t) => t.paymentType === "cbe").reduce((s, t) => s + t.total, 0),
        totalTips: state.transactions.reduce((sum, t) => {
          const txTips = t.tips || [];
          return sum + txTips.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        }, 0),
      };
      const totalIncome = summary.totalIncome;
      const asratMoney = totalIncome > 5500 ? (totalIncome - 5500) * 0.1 : 0;
      summary.asratMoney = asratMoney;
      summary.finalCashAmount = totalIncome - asratMoney - summary.totalTips;

      const summaries = JSON.parse(localStorage.getItem("dailySummaries") || "[]");
      summaries.push(summary);
      localStorage.setItem("dailySummaries", JSON.stringify(summaries));

      state.id = "";
      state.start = "";
      state.transactions = [];
      persist({ sessionId: "", startedAt: "", transactions: [] });
    },
  },
});

export const { initSession, addTransaction, setTransactions, endSession } = sessionSlice.actions;
export default sessionSlice.reducer;
