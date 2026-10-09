import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import { logout } from "../auth/authSlice";
import { fetchServices } from "../services/servicesSlice";
import { fetchStaff } from "../staff/staffSlice";
import { initSession, addTransaction, endSession, setTransactions } from "../session/sessionSlice";
import { startDay, closeDay, pendUnclosedDay, reviewAndClose, autoCloseDay, refreshDay } from "../day/daySlice";
import { useTranslation } from "../i18n/LanguageContext";

import { useToast } from "../components/Toast";

import {
  addToCart,
  removeFromCart,
  clearCart,
} from "../cart/cartSlice";

import { saveTransaction }
from "../offline/transactionOffline";

import { db } from "../offline/db";

import useOfflineTransactions
from "../offline/useOfflineTransactions";

import API from "../api/axios";

import OfflineIndicator
from "../components/OfflineIndicator";

import OfflineTransactionHistory
from "../components/OfflineTransactionHistory";

import servicesData from "../data/services";
import staffData from "../data/staff";
import { sortCategories } from "../data/categoryOrder";
import WbsLogo from "../components/WbsLogo";

export default function CashierDashboard() {

  const toast = useToast();
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { t, toggleLang, lang } = useTranslation();

  const [isOnline, setIsOnline] = useState(true);

  const checkServer = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }
    try {
      const res = await API.get("");
      setIsOnline(res.data?.status === "ok");
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    checkServer();
    const onLine = () => { setIsOnline(true); setTimeout(checkServer, 1500); };
    const offLine = () => setIsOnline(false);
    window.addEventListener("online", onLine);
    window.addEventListener("offline", offLine);
    const interval = setInterval(checkServer, 30000);
    return () => {
      window.removeEventListener("online", onLine);
      window.removeEventListener("offline", offLine);
      clearInterval(interval);
    };
  }, [checkServer]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const offlineTransactions = useOfflineTransactions();
  const pendingOfflineCount = offlineTransactions.filter((tx) => !tx.synced).length;

  const { items, total } = useSelector(
    (state) => state.cart
  );

  const apiServices = useSelector((state) => state.services.apiList);
  const localServices = useSelector((state) => state.services.localList);
  const staffList = useSelector((state) => state.staff.apiList);
  const staffNames = useMemo(() => {
    const raw = staffList.length > 0 ? staffList : staffData;
    return raw.map((s) => (typeof s === "string" ? s : s.name));
  }, [staffList]);
  const session = useSelector((state) => state.session);
  const { id: sessionId, start: sessionStart, transactions: sessionTransactions } = session;
  const sessionTxsRef = useRef(sessionTransactions);
  sessionTxsRef.current = sessionTransactions;

  const dayState = useSelector((state) => state.day);
  const currentDay = dayState.currentDay;
  const lastDay = dayState.lastDay;

  const [showEndSummary, setShowEndSummary] =
    useState(false);
  const [endSummary, setEndSummary] = useState(null);
  const [closingBalance, setClosingBalance] = useState("");

  useEffect(() => {
    dispatch(refreshDay());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const days = JSON.parse(localStorage.getItem("days") || "[]");
    const unclosed = days.find((d) => d.date === yesterdayStr && d.status === "OPEN");
    if (unclosed) {
      dispatch(pendUnclosedDay());
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchServices());
    dispatch(fetchStaff());
    if (!session.id) dispatch(initSession());
  }, []);

  // auto-sync removed to avoid race with OfflineTransactionHistory "Sync All"

  const buildCatalogFromServices = (services) => {
    const map = {};
    for (const svc of services) {
      if (!map[svc.category]) {
        map[svc.category] = { category: svc.category, subcategories: [{ name: svc.category, services: [] }] };
      }
      map[svc.category].subcategories[0].services.push(svc);
    }
    return Object.values(map);
  };

  const serviceCatalog = useMemo(() => {
    // API is the source of truth. The local cache is only an offline
    // fallback, so merging the two naively rendered every service twice.
    const seen = new Set();
    const merged = [];
    for (const svc of [...(apiServices || []), ...(localServices || [])]) {
      const key = `${svc.category}|${svc.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(svc);
    }
    if (merged.length > 0) return buildCatalogFromServices(merged);
    return servicesData;
  }, [apiServices, localServices]);

  const allServicesFlat = useMemo(() => {
    const list = [];
    for (const cat of serviceCatalog) {
      for (const sub of cat.subcategories) {
        for (const svc of sub.services) {
          list.push({
            ...svc,
            category: cat.category,
            subcategory: sub.name,
          });
        }
      }
    }
    return list;
  }, [serviceCatalog]);

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    dispatch(logout());

    navigate("/");
  };

  /* =========================
     PAYMENT / TIP STATE
  ========================= */

  const [paymentMethod, setPaymentMethod] =
    useState("cash");

  const [tipEntries, setTipEntries] = useState([]);

  const [savingTransaction, setSavingTransaction] =
    useState(false);

  const formatDayName = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  /* =========================
     POS SERVICE SELECTION
  ========================= */

  const [serviceSelections, setServiceSelections] =
    useState({});
  const [showServices, setShowServices] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );

  /* =========================
     COMPLETE TRANSACTION
  ========================= */

  const handleCompleteTransaction = async () => {

    if (items.length === 0) {
      return toast(t("cashier.cartEmpty"), "error");
    }

    const validTips = tipEntries.filter(
      (e) => e.staff && Number(e.amount) > 0
    );
    const totalTip = validTips.reduce(
      (s, e) => s + Number(e.amount),
      0
    );

    const transactionData = {
      uuid: crypto.randomUUID(),
      services: items,
      total,
      tip: totalTip,
      tips: validTips,
      paymentType: paymentMethod,
    };

    setSavingTransaction(true);

    const result = await saveTransaction(transactionData);

    setSavingTransaction(false);

    dispatch(clearCart());
    setTipEntries([]);
    dispatch(addTransaction({
      ...transactionData,
      completedAt: new Date().toISOString(),
    }));

    if (result.offline || !isOnline) {
      toast(t("cashier.txSavedOffline"), "success");
    } else {
      toast(t("cashier.txCompleted"), "success");
    }
  };

  const groupedServices = useMemo(() => {
    const map = new Map();
    for (const svc of allServicesFlat) {
      if (!map.has(svc.category)) {
        map.set(svc.category, {
          category: svc.category,
          services: [],
        });
      }
      map.get(svc.category).services.push(svc);
    }
    return Array.from(map.values()).sort((a, b) => sortCategories(a.category, b.category));
  }, [allServicesFlat]);

  const sortedGroupedServices = useMemo(() => {
    return groupedServices.map(group => ({
      ...group,
      services: [...group.services].sort((a, b) => {
        const keyA = `${a.category}|${a.name}`;
        const keyB = `${b.category}|${b.name}`;
        const checkedA = serviceSelections[keyA]?.checked ? 1 : 0;
        const checkedB = serviceSelections[keyB]?.checked ? 1 : 0;
        return checkedB - checkedA;
      }),
    }));
  }, [groupedServices, serviceSelections]);

  const selectedCount = useMemo(() => {
    return Object.values(serviceSelections).filter(
      (s) => s.checked
    ).length;
  }, [serviceSelections]);

  const staffTips = useMemo(() => {
    const map = new Map();
    for (const tx of sessionTransactions) {
      const txTips = tx.tips || [];
      for (const t of txTips) {
        if (t.staff && Number(t.amount) > 0) {
          map.set(t.staff, (map.get(t.staff) || 0) + Number(t.amount));
        }
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sessionTransactions]);

  const handleAddSelectedServices = () => {
    let added = 0;
    for (const svc of allServicesFlat) {
      const key = `${svc.category}|${svc.name}`;
      const sel = serviceSelections[key];
      if (sel?.checked) {
        if (!sel.staff) {
          toast(
            `${t("cashier.selectStaffFor")}"${svc.name}"`,
            "error"
          );
          return;
        }
        dispatch(
          addToCart({
            name: svc.name,
            price: svc.price,
            staff: sel.staff,
            nonAsrat: !!svc.nonAsrat,
          })
        );
        added++;
      }
    }
    if (added > 0) {
      setServiceSelections({});
      setShowServices(false);
    }
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const buildSummaryTransactions = useCallback((baseTransactions = [], pendingTransactions = []) => {
    const merged = [];
    const seen = new Set();

    for (const tx of [...baseTransactions, ...pendingTransactions]) {
      const key = tx?.uuid || tx?.offlineId || tx?._id || tx?.id;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(tx);
    }

    return merged;
  }, []);

  const getPendingOfflineTransactions = useCallback(async () => {
    try {
      return await db.transactions.where("synced").equals(false).toArray();
    } catch {
      return [];
    }
  }, []);

  const handleEndDay = async () => {
    const pendingOffline = await getPendingOfflineTransactions();
    if (pendingOffline.length > 0) {
      return toast(t("cashier.syncPendingFirst", { count: pendingOffline.length }), "error");
    }

    const summaryTransactions = buildSummaryTransactions(sessionTransactions);
    const totalIncome = summaryTransactions.reduce(
      (sum, t) => sum + (Number(t.total) || 0),
      0
    );

    const cashPayments = summaryTransactions
      .filter((t) => t.paymentType === "cash")
      .reduce((sum, t) => sum + (Number(t.total) || 0), 0);

    const telebirrPayments = summaryTransactions
      .filter((t) => t.paymentType === "telebirr")
      .reduce((sum, t) => sum + (Number(t.total) || 0), 0);

    const abysinyaPayments = summaryTransactions
      .filter((t) => t.paymentType === "abysinya")
      .reduce((sum, t) => sum + (Number(t.total) || 0), 0);

    const cbePayments = summaryTransactions
      .filter((t) => t.paymentType === "cbe")
      .reduce((sum, t) => sum + (Number(t.total) || 0), 0);

    const asratMoney =
      totalIncome > 5500
        ? (totalIncome - 5500) * 0.1
        : 0;

    const totalTips = summaryTransactions.reduce(
      (sum, t) => {
        const txTips = t.tips || [];
        return sum + txTips.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      },
      0
    );

    const totalExpenses = currentDay?.expenses?.reduce((s, e) => s + e.amount, 0) || 0;

    const finalCashAmount =
      cashPayments - asratMoney - totalTips;

    const summary = {
      sessionId,
      date: sessionStart.split("T")[0],
      startedAt: sessionStart,
      endedAt: new Date().toISOString(),
      transactionCount: summaryTransactions.length,
      totalIncome,
      totalExpenses,
      cashPayments,
      telebirrPayments,
      abysinyaPayments,
      cbePayments,
      asratMoney,
      totalTips,
      finalCashAmount,
      transactions: summaryTransactions,
    };

    setEndSummary(summary);
    setShowEndSummary(true);
  };

  const confirmEndDay = async () => {
    const cb = Number(closingBalance) || 0;
    const summaryTransactions = endSummary?.transactions || sessionTransactions;
    const totalIncome = summaryTransactions.reduce((s, t) => s + (Number(t.total) || 0), 0);

    try {
      await API.post("/transactions/clear-day");
    } catch {
      toast(t("cashier.clearDayFailed"), "error");
    }

    dispatch(setTransactions(summaryTransactions));
    dispatch(closeDay({
      closingBalance: cb,
      totalIncome,
      transactionCount: summaryTransactions.length,
    }));
    dispatch(endSession());
    dispatch(initSession());
    dispatch(clearCart());
    setTipEntries([]);
    setClosingBalance("");
    setShowEndSummary(false);
    setEndSummary(null);
  };

  const cancelEndDay = () => {
    setShowEndSummary(false);
    setEndSummary(null);
  };

  const pendingClosureDay = lastDay && lastDay.status === "PENDING_CLOSURE" ? lastDay : null;

  if (pendingClosureDay) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100dvh", padding: 20, background: "var(--bg-body)", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: "var(--text-primary)", margin: "0 0 8px" }}>{pendingClosureDay.date} {t("day.notClosed")}</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24, maxWidth: 400 }}>
          {t("cashier.pendingClosureMsg")}
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => { dispatch(reviewAndClose({ date: pendingClosureDay.date })); dispatch(refreshDay()); }} style={{ padding: "14px 28px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            {t("day.reviewClose")}
          </button>
          <button onClick={() => { dispatch(autoCloseDay({ date: pendingClosureDay.date })); dispatch(refreshDay()); }} style={{ padding: "14px 28px", background: "var(--border-color)", color: "var(--text-primary)", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            {t("day.autoClose")}
          </button>
        </div>
      </div>
    );
  }

  if (!currentDay) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const prevDay = lastDay?.date === yesterdayStr ? lastDay : null;
    const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const hour = new Date().getHours();
    const greetKey = hour < 12 ? "day.greetingMorning" : hour < 18 ? "day.greetingAfternoon" : "day.greetingEvening";

    return (
      <div className="wb wb-gate">
        <div className="wb-hero orb">
          <div className="spark">
            <WbsLogo style={{ width: 64, height: 64 }} />
          </div>
          <h1 className="t big serif">{t(greetKey)}</h1>
          <span className="sub">{t("day.todaysDate")}</span>
        </div>
        <main>
          <section className="wb-card">
            <div className="wb-day">
              <p className="wb-date-line">{todayStr}</p>
              <div className="day-rowi">
                <span>{t("day.prevDay")}</span>
                <b className="wb-chip">
                  {prevDay ? (prevDay.status === "CLOSED" ? t("day.closed") : prevDay.status) : t("day.closed")}
                </b>
              </div>
              <button
                className="wb-orb-btn"
                onClick={() => { dispatch(startDay()); if (!session.id) dispatch(initSession()); }}
              >
                {t("day.startDay")}
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const paymentTotal = (type) =>
    sessionTransactions.filter((tt) => tt.paymentType === type).reduce((s, tt) => s + (Number(tt.total) || 0), 0);

  const serviceBoard = (
    <div style={{ overflowY: "auto", flex: 1, minHeight: 0, marginTop: 12, padding: "0 4px 16px" }}>
      {groupedServices.length === 0 ? (
        <p className="wb-empty" style={{ textAlign: "center" }}>{t("cashier.noServices")}</p>
      ) : (
        sortedGroupedServices.map((group) => (
          <div key={group.category} style={{ marginBottom: "18px" }}>
            <div className="wb-catbadge">{group.category}</div>
            <div className="wb-card" style={{ padding: 0, boxShadow: "0 10px 26px rgba(184,59,104,.10)", borderRadius: 18, marginBottom: 0 }}>
              {group.services.map((svc) => {
                const key = `${svc.category}|${svc.name}`;
                const sel = serviceSelections[key] || {};
                return (
                  <div key={key} className="wb-svc" style={{ background: sel.checked ? "#fbeef1" : "transparent" }}>
                    <input
                      className="wb-chk"
                      type="checkbox"
                      checked={!!sel.checked}
                      onChange={(e) =>
                        setServiceSelections((prev) => ({ ...prev, [key]: { ...prev[key], checked: e.target.checked } }))
                      }
                    />
                    <span className="name">{svc.name}</span>
                    <span className="price">{svc.price} {t("cashier.birr")}</span>
                    <select
                      className="wb-staff"
                      value={sel.staff || ""}
                      onChange={(e) =>
                        setServiceSelections((prev) => ({ ...prev, [key]: { checked: prev[key]?.checked ?? true, staff: e.target.value } }))
                      }
                    >
                      <option value="">{t("cashier.staffSelect")}</option>
                      {staffNames.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const cartPanel = (
    <div>
      <div className="wb-top" style={{ marginBottom: 10 }}>
        <h2 className="serif" style={{ fontSize: 24 }}>{t("cashier.cart")}</h2>
        <span className="wb-tag" style={{ background: "#fbe7de" }}>
          {items.length} · {total} {t("cashier.birr")}
        </span>
      </div>

      {items.length > 0 ? (
        <ul className="wb-list" style={{ maxHeight: 190, overflowY: "auto" }}>
          {items.map((item, index) => (
            <li className="wb-li" key={index}>
              <span className="m">
                {item.name}
                <small>{item.staff}</small>
              </span>
              <span className="tag">{item.price} {t("cashier.birr")}</span>
              <button className="wb-x" onClick={() => dispatch(removeFromCart(index))}>×</button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="wb-empty" style={{ textAlign: "center", padding: "10px 0" }}>{t("cashier.cartEmpty")}</p>
      )}

      <div className="wb-field">
        <label>{t("tx.payment")}</label>
        <select className="wb-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="cash">{t("cashier.paymentCash")}</option>
          <option value="telebirr">{t("cashier.paymentTelebirr")}</option>
          <option value="abysinya">{t("cashier.paymentAbysinya")}</option>
          <option value="cbe">{t("cashier.paymentCBE")}</option>
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--mut)", margin: "0 0 6px 6px" }}>
          {t("cashier.tipLabel")}
        </label>
        {tipEntries.map((entry, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
            <select
              className="wb-select"
              style={{ height: 40, flex: 1 }}
              value={entry.staff}
              onChange={(e) => { const next = [...tipEntries]; next[i] = { ...next[i], staff: e.target.value }; setTipEntries(next); }}
            >
              <option value="">{t("cashier.staffSelect")}</option>
              {staffNames.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <input
              className="wb-input"
              style={{ height: 40, width: 88, padding: "0 10px", textAlign: "center" }}
              type="text"
              inputMode="numeric"
              value={entry.amount}
              onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); const next = [...tipEntries]; next[i] = { ...next[i], amount: val === "" ? 0 : Number(val) }; setTipEntries(next); }}
            />
            <button className="wb-x" onClick={() => setTipEntries(tipEntries.filter((_, idx) => idx !== i))}>×</button>
          </div>
        ))}
        <button
          className="wb-btn line"
          style={{ width: "100%", marginTop: 4 }}
          onClick={() => setTipEntries([...tipEntries, { staff: "", amount: 0 }])}
        >
          + {t("cashier.addStaff")}
        </button>
      </div>

      <button className="wb-btn pink block" style={{ marginTop: 16 }} onClick={handleCompleteTransaction} disabled={savingTransaction}>
        {savingTransaction ? t("cashier.saving") : t("cashier.completeTx")}
      </button>
      <button className="wb-btn red block" style={{ marginTop: 8 }} type="button" onClick={handleClearCart}>
        {t("cashier.clearCart")}
      </button>

      <section className="wb-card" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>{t("cashier.sessionSummary")}</h2>
        {sessionTransactions.length === 0 ? (
          <p className="wb-empty">{t("cashier.noTxYet")}</p>
        ) : (
          <>
            <div className="wb-sum" style={{ marginBottom: 12 }}>
              <div className="wb-tile"><i>{t("tx.cash")}</i><b>{paymentTotal("cash")}</b></div>
              <div className="wb-tile"><i>{t("tx.telebirr")}</i><b>{paymentTotal("telebirr")}</b></div>
              <div className="wb-tile"><i>{t("tx.abysinya")}</i><b>{paymentTotal("abysinya")}</b></div>
              <div className="wb-tile"><i>{t("tx.cbe")}</i><b>{paymentTotal("cbe")}</b></div>
              <div className="wb-tile"><i>{t("cashier.tipsLabel")}</i><b>{sessionTransactions.reduce((s, tt) => s + (tt.tip || 0), 0)}</b></div>
              <div className="wb-tile total">
                <i>{t("cashier.grandTotal")}</i>
                <b>{sessionTransactions.reduce((s, tt) => s + (Number(tt.total) || 0), 0)}</b>
              </div>
            </div>
            {staffTips.length > 0 && (
              <div>
                <strong style={{ fontSize: 13 }}>{t("cashier.tipsByStaff")}</strong>
                {staffTips.map(([name, amount]) => (
                  <div key={name} className="wb-tx-item" style={{ padding: "7px 0", fontSize: 13 }}>
                    <span className="grow">{name}</span>
                    <b>{Math.round(amount)}</b>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <div style={{ marginTop: 18 }}>
        <OfflineTransactionHistory />
      </div>
    </div>
  );

  return (

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
        background: "var(--bg-body)",
      }}
    >

      {/* =========================
          HEADER
      ========================= */}

      <header
        style={{
          padding: isMobile ? "10px 14px" : "10px 16px",
          background: "rgba(255,255,255,.95)",
          borderBottom: "1px solid var(--line)",

          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <WbsLogo className="wb-logo" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="wb-name serif" style={{ fontSize: isMobile ? 18 : 21 }}>
            Wondeya
          </div>
          <div style={{ fontSize: 12, color: "var(--mut)" }}>
            {currentDay?.date || formatDayName(sessionStart)}{" · "}
            {sessionTransactions.length} {t("cashier.transactions")}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <OfflineIndicator isOnline={isOnline} />
          <button
            className="wb-pill pink"
            onClick={toggleLang}
            style={{ fontSize: isMobile ? 12 : 13 }}
          >
            {t("lang.switch")}
          </button>
          <button
            className="wb-pill pink"
            onClick={handleEndDay}
            disabled={sessionTransactions.length === 0}
            style={{
              cursor: sessionTransactions.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            {t("cashier.endDay")}
          </button>
          <button className="wb-pill out" onClick={handleLogout} style={{ fontSize: isMobile ? 12 : 13 }}>
            {t("cashier.logout")}
          </button>
        </div>
      </header>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {isMobile ? (
          showServices ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ flexShrink: 0, padding: "12px 12px 0" }}>
                <div className="wb-top" style={{ marginBottom: 10 }}>
                  <h2 className="serif" style={{ fontSize: 24 }}>{t("cashier.services")}</h2>
                  <button className="wb-btn pink" type="button" style={{ width: "auto", padding: "0 14px" }} onClick={() => setShowServices(false)}>
                    ▲ {t("cashier.hideServices")}
                  </button>
                </div>
                <button className="wb-btn pink block" onClick={handleAddSelectedServices} disabled={selectedCount === 0}>
                  {t("cashier.addSelected")}{selectedCount > 0 ? ` (${selectedCount})` : ""}
                </button>
              </div>
              {serviceBoard}
            </div>
          ) : (
            <div style={{ width: "100%", height: "100%", overflowY: "auto", padding: "12px 12px 24px" }}>
              <button
                className="wb-btn pink block"
                onClick={() => setShowServices(true)}
                style={{ marginBottom: 14 }}
              >
                + {t("cashier.showServices")} ▼
              </button>
              {cartPanel}
            </div>
          )
        ) : (
          <div style={{ display: "flex", flexDirection: "row", flex: 1, minHeight: 0, overflow: "hidden" }}>
            {showServices ? (
              <>
                <div style={{ width: "60%", padding: "16px", display: "flex", flexDirection: "column", minHeight: 0, borderRight: "1px solid var(--line)", overflow: "hidden" }}>
                  <div className="wb-top" style={{ marginBottom: 12 }}>
                    <h2 className="serif" style={{ fontSize: 24 }}>{t("cashier.services")}</h2>
<button className="wb-btn pink" type="button" style={{ width: "auto", padding: "0 18px" }} onClick={() => setShowServices(false)}>
                    ▲ {t("cashier.hideServices")}
                  </button>
                </div>
                <button className="wb-btn pink block" style={{ flexShrink: 0 }} onClick={handleAddSelectedServices} disabled={selectedCount === 0}>
                  {t("cashier.addSelected")}{selectedCount > 0 ? ` (${selectedCount})` : ""}
                </button>
                {serviceBoard}
              </div>
              <div className="wb" style={{ width: "40%", padding: "16px", overflowY: "auto", height: "100%" }}>
                {cartPanel}
              </div>
            </>
          ) : (
            <div style={{ width: "100%", height: "100%", overflowY: "auto", padding: "16px 16px 24px" }}>
              <div style={{ maxWidth: 640, margin: "0 auto" }}>
                <button className="wb-btn pink block" onClick={() => setShowServices(true)} style={{ marginBottom: 14 }}>
                  + {t("cashier.showServices")} ▼
                </button>
                  {cartPanel}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* END DAY SUMMARY MODAL */}

      {showEndSummary && endSummary && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(30,15,20,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "14px",
          }}
        >
          <div className="wb-dialog" style={{ maxWidth: 420, width: "100%" }}>
            <h2 className="serif" style={{ fontSize: 24, margin: "0 0 8px" }}>
              {t("cashier.endSummaryTitle")}
            </h2>

            <div className="wb-tx-item" style={{ padding: "6px 0" }}>
              <span className="grow">{t("cashier.date")}</span>
              <b>{formatDayName(endSummary.date)}</b>
            </div>
            <div className="wb-tx-item" style={{ padding: "6px 0" }}>
              <span className="grow">{t("cashier.txCount")}</span>
              <b>{endSummary.transactionCount}</b>
            </div>

            <hr className="wb-hr" />

            <div className="wb-sum" style={{ marginBottom: 0 }}>
              <div className="wb-tile total">
                <i>{t("cashier.totalIncome")}</i>
                <b>{endSummary.totalIncome} {t("cashier.birr")}</b>
              </div>
              <div className="wb-tile">
                <i>{t("day.totalExpenses")}</i>
                <b>{endSummary.totalExpenses || 0} {t("cashier.birr")}</b>
              </div>
              <div className="wb-tile"><i>{t("tx.cash")}</i><b>{endSummary.cashPayments}</b></div>
              <div className="wb-tile"><i>{t("tx.telebirr")}</i><b>{endSummary.telebirrPayments}</b></div>
              <div className="wb-tile"><i>{t("tx.abysinya")}</i><b>{endSummary.abysinyaPayments}</b></div>
              <div className="wb-tile"><i>{t("tx.cbe")}</i><b>{endSummary.cbePayments}</b></div>
              <div className="wb-tile"><i>{t("cashier.asratMoney")}</i><b>{endSummary.asratMoney} {t("cashier.birr")}</b></div>
              <div className="wb-tile"><i>{t("cashier.totalTips")}</i><b>{endSummary.totalTips} {t("cashier.birr")}</b></div>
            </div>

            <hr className="wb-hr" />

            <div className="wb-tx-item" style={{ padding: "5px 0", fontSize: 16 }}>
              <span className="grow"><strong>{t("cashier.finalCash")}</strong></span>
              <b>{endSummary.finalCashAmount} {t("cashier.birr")}</b>
            </div>

            <div className="wb-field" style={{ marginTop: 14 }}>
              <label>{t("day.closingBalance")}</label>
              <input
                className="wb-input"
                type="text"
                inputMode="numeric"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value.replace(/\D/g, ""))}
                placeholder={t("day.enterClosingBalance")}
              />
            </div>

            <div className="wb-acts" style={{ marginTop: 18 }}>
              <button className="wb-btn line" onClick={cancelEndDay}>{t("cashier.cancel")}</button>
              <button className="wb-btn pink" onClick={confirmEndDay}>{t("cashier.confirmEnd")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
