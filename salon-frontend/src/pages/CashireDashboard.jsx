import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import { logout } from "../auth/authSlice";
import { fetchServices } from "../services/servicesSlice";
import { fetchStaff } from "../staff/staffSlice";
import { initSession, addTransaction, setTransactions, endSession } from "../session/sessionSlice";
import { useTranslation } from "../i18n/LanguageContext";

import {
  addToCart,
  removeFromCart,
  clearCart,
} from "../cart/cartSlice";

import { saveTransaction }
from "../offline/transactionOffline";

import OfflineIndicator
from "../components/OfflineIndicator";

import OfflineTransactionHistory
from "../components/OfflineTransactionHistory";

import { syncTransactions }
from "../offline/sync";

import servicesData from "../data/services";
import staffData from "../data/staff";

export default function CashierDashboard() {

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { t, toggleLang, lang } = useTranslation();

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    syncTransactions().then((synced) => {
      if (synced.length === 0) return;
      const existingIds = new Set(session.transactions.map((t) => t.uuid));
      const newOnes = synced.filter((t) => !existingIds.has(t.uuid));
      if (newOnes.length === 0) return;
      dispatch(setTransactions([...session.transactions, ...newOnes]));
    }).catch(() => {});
  }, [isOnline]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  const [showEndSummary, setShowEndSummary] =
    useState(false);
  const [endSummary, setEndSummary] = useState(null);

  useEffect(() => {
    dispatch(fetchServices());
    dispatch(fetchStaff());
    if (!session.id) dispatch(initSession());
  }, []);

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
    const allServices = [...(apiServices || []), ...(localServices || [])];
    if (allServices.length > 0) return buildCatalogFromServices(allServices);
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

  /* =========================
     POS SERVICE SELECTION
  ========================= */

  const [serviceSelections, setServiceSelections] =
    useState({});
  const [showServices, setShowServices] = useState(false);

  /* =========================
     COMPLETE TRANSACTION
  ========================= */

  const handleCompleteTransaction = async () => {

    if (items.length === 0) {
      return alert(t("cashier.cartEmpty"));
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
      alert(t("cashier.txSavedOffline"));
    } else {
      alert(t("cashier.txCompleted"));
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
    return Array.from(map.values());
  }, [allServicesFlat]);

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
          alert(
            `${t("cashier.selectStaffFor")}"${svc.name}"`
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

  const handleEndDay = () => {
    const totalIncome = sessionTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );

    const cashPayments = sessionTransactions
      .filter((t) => t.paymentType === "cash")
      .reduce((sum, t) => sum + t.total, 0);

    const telebirrPayments = sessionTransactions
      .filter((t) => t.paymentType === "telebirr")
      .reduce((sum, t) => sum + t.total, 0);

    const abysinyaPayments = sessionTransactions
      .filter((t) => t.paymentType === "abysinya")
      .reduce((sum, t) => sum + t.total, 0);

    const cbePayments = sessionTransactions
      .filter((t) => t.paymentType === "cbe")
      .reduce((sum, t) => sum + t.total, 0);

    const asratMoney =
      totalIncome > 5500
        ? (totalIncome - 5500) * 0.1
        : 0;

    const totalTips = sessionTransactions.reduce(
      (sum, t) => {
        const txTips = t.tips || [];
        return sum + txTips.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      },
      0
    );

    const finalCashAmount =
      totalIncome - asratMoney - totalTips;

    const summary = {
      sessionId,
      date: sessionStart.split("T")[0],
      startedAt: sessionStart,
      endedAt: new Date().toISOString(),
      transactionCount:
        sessionTransactions.length,
      totalIncome,
      cashPayments,
      telebirrPayments,
      abysinyaPayments,
      cbePayments,
      asratMoney,
      totalTips,
      finalCashAmount,
    };

    setEndSummary(summary);
    setShowEndSummary(true);
  };

  const confirmEndDay = () => {
    dispatch(endSession());
    dispatch(initSession());
    dispatch(clearCart());
    setTipEntries([]);
    setShowEndSummary(false);
    setEndSummary(null);
  };

  const cancelEndDay = () => {
    setShowEndSummary(false);
    setEndSummary(null);
  };

  return (

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: isMobile ? "auto" : "100vh",
        overflow: "hidden",
        background: "var(--bg-body)",
      }}
    >

      {/* =========================
          HEADER
      ========================= */}

      <div
        style={{
          padding: "15px 20px",
          backgroundColor: "var(--bg-card)",
          borderBottom: "1px solid var(--border-color)",

          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          gap: isMobile ? 12 : 0,
        }}
      >

        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 24, color: "var(--text-primary)" }}>{t("cashier.title")}</h1>
          <small style={{ color: "var(--text-secondary)" }}>
            {t("cashier.session")}{" "}
            {sessionStart
              ? new Date(
                  sessionStart
                ).toLocaleDateString()
              : ""}{" "}
            | {sessionTransactions.length} {t("cashier.transactions")}
          </small>
        </div>

        <div style={{ display: "flex", gap: isMobile ? 6 : 10, alignItems: "center", flexWrap: "wrap" }}>
          <OfflineIndicator isOnline={isOnline} />
          <button onClick={toggleLang} style={{ padding: isMobile ? "6px 8px" : "8px 12px", fontSize: isMobile ? 12 : undefined, background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>{t("lang.switch")}</button>
          <button
            onClick={handleEndDay}
            disabled={
              sessionTransactions.length === 0
            }
            style={{
              padding: isMobile ? "6px 10px" : "8px 16px",
              fontSize: isMobile ? 12 : undefined,
              backgroundColor:
                sessionTransactions.length === 0
                  ? "var(--border-color)"
                  : "var(--color-primary)",
              color:
                sessionTransactions.length === 0
                  ? "var(--text-muted)"
                  : "#fff",
              border: "none",
              borderRadius: "4px",
              cursor:
                sessionTransactions.length === 0
                  ? "not-allowed"
                  : "pointer",
              fontWeight: 700,
            }}
          >
            {t("cashier.endDay")}
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: isMobile ? "6px 10px" : "8px 16px",
              fontSize: isMobile ? 12 : undefined,
              backgroundColor: "var(--color-danger)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {t("cashier.logout")}
          </button>
        </div>

      </div>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flex: 1,
          minHeight: 0,
          overflow: isMobile ? "auto" : "hidden",
        }}
      >

        {/* =========================
            LEFT SIDE — POS Service Table
        ========================= */}

        <div
          style={{
            width: isMobile ? "100%" : "60%",
            padding: isMobile ? "12px" : "20px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            borderRight: isMobile ? "none" : "1px solid var(--border-color)",
          }}
        >
          <div style={{ paddingRight: isMobile ? 0 : 20, flexShrink: 0 }}>
            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "18px",
                color: "var(--text-primary)",
              }}
            >
              {t("cashier.services")}
            </h2>

            <button
              onClick={handleAddSelectedServices}
              disabled={selectedCount === 0}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor:
                  selectedCount === 0
                    ? "var(--border-color)"
                    : "var(--color-primary)",
                color:
                  selectedCount === 0
                    ? "var(--text-muted)"
                    : "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 700,
                cursor:
                  selectedCount === 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {t("cashier.addSelected")}
              {selectedCount > 0 ? ` (${selectedCount})` : ""}
            </button>

            {showServices && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowServices(false)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border-color)",
                    background: "#fff",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  {t("cashier.hideServices")}
                </button>
              </div>
            )}
          </div>

          <div 
            style={{ 
              overflowY: isMobile ? "visible" : "auto", 
              flex: 1, 
              minHeight: 0, 
              paddingRight: isMobile ? 0 : 20, 
              marginTop: 12 
            }}
          >
            {!showServices ? (
            <div style={{ color: "var(--text-secondary)", padding: 20, background: "#fff", borderRadius: 10, border: "1px solid var(--border-color)" }}>
              <p style={{ margin: 0, marginBottom: 12 }}>
                {t("cashier.servicesHidden")}
              </p>
              <button
                type="button"
                onClick={() => setShowServices(true)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--color-primary)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {t("cashier.showServices")}
              </button>
            </div>
          ) : groupedServices.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>
              {t("cashier.noServices")}
            </p>
          ) : (
            groupedServices.map((group) => (
              <div
                key={group.category}
                style={{
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "var(--color-primary)",
                    color: "#fff",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "4px",
                  }}
                >
                  {group.category}
                </div>

                <div
                  style={{
                    background: "#fff",
                    borderRadius: "6px",
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  {group.services.map((svc) => {
                    const key = `${svc.category}|${svc.name}`;
                    const sel = serviceSelections[key] || {};

                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 12px",
                          borderBottom: "1px solid var(--border-color)",
                          backgroundColor: sel.checked ? "var(--color-primary-light)" : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!sel.checked}
                          onChange={(e) =>
                            setServiceSelections((prev) => ({
                              ...prev,
                              [key]: {
                                ...prev[key],
                                checked: e.target.checked,
                              },
                            }))
                          }
                          style={{ width: "18px", height: "18px", flexShrink: 0 }}
                        />

                        <span style={{ flex: 1, fontSize: "14px", fontWeight: 500 }}>
                          {svc.name}
                        </span>

                        <span
                          style={{
                            width: "80px",
                            textAlign: "right",
                            fontSize: "14px",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {svc.price} Birr
                        </span>

                        <select
                          value={sel.staff || ""}
                          onChange={(e) =>
                            setServiceSelections((prev) => ({
                              ...prev,
                              [key]: {
                                checked: prev[key]?.checked ?? true,
                                staff: e.target.value,
                              },
                            }))
                          }
                          style={{
                            width: "130px",
                            padding: "5px 4px",
                            borderRadius: "4px",
                            border: "1px solid var(--border-color)",
                            fontSize: "13px",
                            flexShrink: 0,
                          }}
                        >
                          <option value="">{t("cashier.staffSelect")}</option>
                          {staffNames.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          </div>
        </div>

        {/* =========================
            RIGHT SIDE
        ========================= */}

        <div
          style={{
            width: isMobile ? "100%" : "40%",
            padding: isMobile ? "12px" : "20px",
            overflowY: isMobile ? "visible" : "auto",
            height: isMobile ? "auto" : "100%",
          }}
        >

           <h2 style={{ color: "var(--text-primary)" }}>{t("cashier.cart")}</h2>

          <p style={{ color: "var(--text-primary)", margin: "0 0 12px" }}>
            {items.length} {t("cashier.services")} — {total} Birr
          </p>

          {items.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12, border: "1px solid var(--border-color)", borderRadius: 6, padding: "4px 8px", background: "#fff" }}>
              {items.map((item, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0",                     borderBottom: index < items.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                  <span style={{ flex: 1, fontSize: 13 }}>
                    {item.name} <small style={{ color: "var(--text-secondary)" }}>({item.staff})</small>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{item.price} Birr</span>
                  <button
                    onClick={() => dispatch(removeFromCart(index))}
                    style={{ fontSize: 11, padding: "2px 8px", background: "var(--color-danger)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                  >
                    {t("cashier.remove")}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* PAYMENT */}

          <select
            value={paymentMethod}

            onChange={(e) =>
              setPaymentMethod(
                e.target.value
              )
            }

            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              background: "#fff",
              color: "var(--text-primary)",
            }}
          >

            <option value="cash">
              {t("cashier.paymentCash")}
            </option>

            <option value="telebirr">
              {t("cashier.paymentTelebirr")}
            </option>

            <option value="abysinya">
              {t("cashier.paymentAbysinya")}
            </option>

            <option value="cbe">
              {t("cashier.paymentCBE")}
            </option>

          </select>

          {/* TIP */}

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 600, color: "var(--text-primary)" }}>
              {t("cashier.tipLabel")}
            </label>
            {tipEntries.map((entry, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                <select
                  value={entry.staff}
                  onChange={(e) => {
                    const next = [...tipEntries];
                    next[i] = { ...next[i], staff: e.target.value };
                    setTipEntries(next);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "5px",
                    border: "1px solid var(--border-color)",
                    background: "#fff",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">{t("cashier.staffSelect")}</option>
                  {staffNames.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  value={entry.amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const next = [...tipEntries];
                    next[i] = { ...next[i], amount: val === "" ? 0 : Number(val) };
                    setTipEntries(next);
                  }}
                  style={{
                    width: "100px",
                    padding: "8px",
                    borderRadius: "5px",
                    border: "1px solid var(--border-color)",
                    background: "#fff",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  onClick={() => setTipEntries(tipEntries.filter((_, idx) => idx !== i))}
                  style={{ padding: "6px 10px", background: "var(--color-danger)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => setTipEntries([...tipEntries, { staff: "", amount: 0 }])}
              style={{ padding: "8px 12px", background: "#fff", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: 6, cursor: "pointer", fontSize: 13, marginTop: 4 }}
            >
              + {t("cashier.addStaff")}
            </button>
          </div>

          {/* BUTTONS */}

          <button
            onClick={
              handleCompleteTransaction
            }
            disabled={savingTransaction}

            style={{
              width: "100%",
              padding: "15px",
              background: savingTransaction ? "var(--text-muted)" : "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              marginBottom: "10px",
            }}
          >
            {savingTransaction
              ? t("cashier.saving")
              : t("cashier.completeTx")}
          </button>

          <button
            type="button"
            onClick={handleClearCart}

            style={{
              width: "100%",
              padding: "15px",
              background: "var(--text-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
            }}
          >
            {t("cashier.clearCart")}
          </button>

          {/* SESSION SUMMARY */}

          <div style={{ marginTop: "30px" }}>
            <h2 style={{ color: "var(--text-primary)" }}>{t("cashier.sessionSummary")}</h2>
            {sessionTransactions.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>
                {t("cashier.noTxYet")}
              </p>
            ) : (
              <div>
                                <p>
                  <strong>
                    {
                      sessionTransactions.length
                    }{" "}
                    {t("cashier.transactions")}
                  </strong>
                </p>
                <p>
                  {t("cashier.cashLabel")} {" "}
                  {sessionTransactions
                    .filter(
                      (t) =>
                        t.paymentType === "cash"
                    )
                    .reduce(
                      (s, t) => s + t.total,
                      0
                    )}{" "}
                  Birr
                </p>
                                <p>
                  {t("cashier.telebirrLabel")} {" "}
                  {sessionTransactions
                    .filter(
                      (t) =>
                        t.paymentType ===
                        "telebirr"
                    )
                    .reduce(
                      (s, t) => s + t.total,
                      0
                    )}{" "}
                  Birr
                </p>
                                <p>
                  {t("cashier.abysinyaLabel")} {" "}
                  {sessionTransactions
                    .filter(
                      (t) =>
                        t.paymentType ===
                        "abysinya"
                    )
                    .reduce(
                      (s, t) => s + t.total,
                      0
                    )}{" "}
                  Birr
                </p>
                                <p>
                  {t("cashier.cbeLabel")} {" "}
                  {sessionTransactions
                    .filter(
                      (t) =>
                        t.paymentType === "cbe"
                    )
                    .reduce(
                      (s, t) => s + t.total,
                      0
                    )}{" "}
                  Birr
                </p>
                                <p>
                  {t("cashier.tipsLabel")} {" "}
                  {sessionTransactions.reduce(
                    (s, t) =>
                      s + (t.tip || 0),
                    0
                  )}{" "}
                  Birr
                </p>

                {staffTips.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-primary)" }}>
                    <strong>{t("cashier.tipsByStaff")}:</strong>
                    {staffTips.map(([name, amount]) => (
                      <div key={name} style={{ display: "flex", justifyContent: "space-between", paddingLeft: 8, marginTop: 2 }}>
                        <span>{name}</span>
                        <span>{Math.round(amount)} Birr</span>
                      </div>
                    ))}
                  </div>
                )}

                <hr
                  style={{
                    border: "none",
                    borderTop:
                      "1px solid var(--border-color)",
                    margin: "10px 0",
                  }}
                />
                                <p>
                  <strong>
                    {t("cashier.grandTotal")} {" "}
                    {sessionTransactions.reduce(
                      (s, t) => s + t.total,
                      0
                    )}{" "}
                    Birr
                  </strong>
                </p>
              </div>
            )}
          </div>

          {/* LOCAL OFFLINE TRANSACTIONS */}

          <div style={{ marginTop: "30px" }}>
            <h2 style={{ color: "var(--text-primary)" }}>{t("offline.title")}</h2>
            <OfflineTransactionHistory />
          </div>

        </div>

      </div>

      {/* END DAY SUMMARY MODAL */}

      {showEndSummary && endSummary && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "420px",
              width: "90%",
              boxShadow:
                "0 10px 40px rgba(0,0,0,0.3)",
              color: "var(--text-primary)",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px",
                color: "var(--text-primary)",
              }}
            >
                            {t("cashier.endSummaryTitle")}
            </h2>

            <p>
              <strong>{t("cashier.date")}</strong> {" "}
              {endSummary.date}
            </p>
            <p>
                            <strong>{t("cashier.txCount")}</strong> {" "}
              {endSummary.transactionCount}
            </p>

            <hr
              style={{
                border: "none",
                borderTop:
                  "1px solid var(--border-color)",
                margin: "15px 0",
              }}
            />

            <p>
              <strong>{t("cashier.totalIncome")}{" "}
              {endSummary.totalIncome} Birr</strong>
            </p>
            <p>
              {t("cashier.cashPayments")}{" "}
              {endSummary.cashPayments} Birr
            </p>
            <p>
              {t("cashier.paymentTelebirr")}{" "}
              {endSummary.telebirrPayments} Birr
            </p>
            <p>
              {t("cashier.paymentAbysinya")}{" "}
              {endSummary.abysinyaPayments} Birr
            </p>
            <p>
              {t("cashier.paymentCBE")}{" "}
              {endSummary.cbePayments} Birr
            </p>

            <hr
              style={{
                border: "none",
                borderTop:
                  "1px solid var(--border-color)",
                margin: "15px 0",
              }}
            />

            <p>
              {t("cashier.asratMoney")}{" "}
              <strong>
                {endSummary.asratMoney} Birr
              </strong>
            </p>
            <p>
              {t("cashier.totalTips")}{" "}
              {endSummary.totalTips} Birr
            </p>

            <hr
              style={{
                border: "none",
                borderTop:
                  "1px solid var(--border-color)",
                margin: "15px 0",
              }}
            />

            <p
              style={{
                fontSize: "18px",
              }}
            >
              <strong>
                {t("cashier.finalCash")}{" "}
                {endSummary.finalCashAmount} Birr
              </strong>
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={confirmEndDay}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "var(--color-primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t("cashier.confirmEnd")}
              </button>
              <button
                onClick={cancelEndDay}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#fff",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                {t("cashier.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
