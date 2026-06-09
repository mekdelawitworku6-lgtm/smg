import { createSlice } from "@reduxjs/toolkit";

const DAYS_KEY = "days";
const today = () => new Date().toISOString().split("T")[0];

const loadDays = () => {
  try {
    return JSON.parse(localStorage.getItem(DAYS_KEY) || "[]");
  } catch {
    return [];
  }
};

const persist = (days) => localStorage.setItem(DAYS_KEY, JSON.stringify(days));

const days = loadDays();
const currentDay = days.find((d) => d.status === "OPEN") || null;
const lastDay = days.length > 0 ? days[days.length - 1] : null;

const initialState = {
  days,
  currentDay,
  lastDay,
  today: today(),
};

const daySlice = createSlice({
  name: "day",
  initialState,
  reducers: {
    startDay(state) {
      const existing = state.days.find((d) => d.date === state.today);
      if (existing && existing.status === "OPEN") {
        state.currentDay = existing;
        return;
      }
      if (existing) {
        existing.status = "OPEN";
        existing.startedAt = new Date().toISOString();
        existing.transactionCount = 0;
        existing.totalIncome = 0;
        existing.totalExpenses = 0;
        existing.expenses = [];
        state.currentDay = existing;
        persist(state.days);
        return;
      }
      const newDay = {
        date: state.today,
        status: "OPEN",
        startedAt: new Date().toISOString(),
        endedAt: null,
        closingBalance: null,
        totalIncome: 0,
        totalExpenses: 0,
        expenses: [],
        transactionCount: 0,
      };
      state.days.push(newDay);
      state.currentDay = newDay;
      state.lastDay = state.days.length > 1 ? state.days[state.days.length - 2] : null;
      persist(state.days);
    },

    addExpense(state, action) {
      if (!state.currentDay) return;
      const expense = {
        name: action.payload.name,
        amount: Number(action.payload.amount),
        paymentType: action.payload.paymentType || "cash",
      };
      state.currentDay.expenses.push(expense);
      state.currentDay.totalExpenses = state.currentDay.expenses.reduce((s, e) => s + e.amount, 0);
      const dayInList = state.days.find((d) => d.date === state.currentDay.date);
      if (dayInList) {
        dayInList.expenses = state.currentDay.expenses;
        dayInList.totalExpenses = state.currentDay.totalExpenses;
      }
      persist(state.days);
    },

    removeExpense(state, action) {
      if (!state.currentDay) return;
      const idx = action.payload;
      state.currentDay.expenses.splice(idx, 1);
      state.currentDay.totalExpenses = state.currentDay.expenses.reduce((s, e) => s + e.amount, 0);
      const dayInList = state.days.find((d) => d.date === state.currentDay.date);
      if (dayInList) {
        dayInList.expenses = state.currentDay.expenses;
        dayInList.totalExpenses = state.currentDay.totalExpenses;
      }
      persist(state.days);
    },

    closeDay(state, action) {
      if (!state.currentDay) return;
      state.currentDay.status = "CLOSED";
      state.currentDay.endedAt = new Date().toISOString();
      state.currentDay.closingBalance = action.payload?.closingBalance ?? null;
      state.currentDay.totalIncome = action.payload?.totalIncome ?? 0;
      state.currentDay.transactionCount = action.payload?.transactionCount ?? 0;
      const dayInList = state.days.find((d) => d.date === state.currentDay.date);
      if (dayInList) {
        Object.assign(dayInList, state.currentDay);
      }
      persist(state.days);
      state.lastDay = { ...state.currentDay };
      state.currentDay = null;
    },

    pendUnclosedDay(state) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const unclosed = state.days.find((d) => d.date === yesterdayStr && d.status === "OPEN");
      if (unclosed) {
        unclosed.status = "PENDING_CLOSURE";
        persist(state.days);
      }
      const last = state.days[state.days.length - 1];
      if (last && last.status === "OPEN") {
        last.status = "PENDING_CLOSURE";
        persist(state.days);
      }
      state.lastDay = state.days.length > 0 ? state.days[state.days.length - 1] : null;
      if (state.currentDay && state.currentDay.status === "OPEN") {
        state.currentDay.status === "PENDING_CLOSURE";
      }
    },

    reviewAndClose(state, action) {
      const day = state.days.find((d) => d.date === action.payload.date);
      if (day) {
        day.status = "CLOSED";
        day.endedAt = new Date().toISOString();
        day.closingBalance = action.payload?.closingBalance ?? day.closingBalance ?? 0;
        persist(state.days);
      }
      state.lastDay = state.days.length > 0 ? state.days[state.days.length - 1] : null;
    },

    autoCloseDay(state, action) {
      const day = state.days.find((d) => d.date === action.payload.date);
      if (day) {
        day.status = "CLOSED";
        day.endedAt = new Date().toISOString();
        day.closingBalance = day.closingBalance ?? 0;
        persist(state.days);
      }
      state.lastDay = state.days.length > 0 ? state.days[state.days.length - 1] : null;
    },

    refreshDay(state) {
      const freshDays = loadDays();
      state.days = freshDays;
      state.currentDay = freshDays.find((d) => d.status === "OPEN") || null;
      state.lastDay = freshDays.length > 0 ? freshDays[freshDays.length - 1] : null;
      state.today = today();
    },
  },
});

export const {
  startDay,
  addExpense,
  removeExpense,
  closeDay,
  pendUnclosedDay,
  reviewAndClose,
  autoCloseDay,
  refreshDay,
} = daySlice.actions;
export default daySlice.reducer;
