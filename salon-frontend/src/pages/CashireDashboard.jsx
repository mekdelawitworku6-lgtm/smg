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
import { useTranslation } from "../i18n/LanguageContext";

import servicesData from "../data/services";
import defaultStaff from "../data/staff";

import API from "../api/axios";

import {
  addToCart,
  removeFromCart,
  clearCart,
  toggleItemNonAsrat,
} from "../cart/cartSlice";

import { saveTransaction }
from "../offline/transactionOffline";

import OfflineIndicator
from "../components/OfflineIndicator";

import OfflineTransactionHistory
from "../components/OfflineTransactionHistory";

const buildCatalogFromServices = (services) => {
  const catalogMap = new Map();

  services.forEach((service) => {
    const categoryName = service.category;
    const subcategoryName = service.subcategory;

    if (!categoryName || !subcategoryName) {
      return;
    }

    if (!catalogMap.has(categoryName)) {
      catalogMap.set(categoryName, {
        category: categoryName,
        subcategories: new Map(),
      });
    }

    const category = catalogMap.get(categoryName);

    if (!category.subcategories.has(subcategoryName)) {
      category.subcategories.set(subcategoryName, {
        name: subcategoryName,
        services: [],
      });
    }

    category.subcategories
      .get(subcategoryName)
      .services.push({
        name: service.name,
        price: service.price,
        nonAsrat: !!service.nonAsrat,
      });
  });

  return Array.from(catalogMap.values()).map(
    (category) => ({
      category: category.category,
      subcategories: Array.from(
        category.subcategories.values()
      ),
    })
  );
};

const readStaffList = () => {
  try {
    return (
      JSON.parse(
        localStorage.getItem("adminStaffList")
      ) || defaultStaff
    );
  } catch {
    return defaultStaff;
  }
};

const readLocalServices = () => {
  try {
    const services = JSON.parse(
      localStorage.getItem("adminLocalServices")
    );

    return Array.isArray(services) ? services : [];
  } catch {
    return [];
  }
};

const SESSION_KEY = "cashierCurrentSession";

const loadSession = () => {
  try {
    const data = JSON.parse(
      localStorage.getItem(SESSION_KEY)
    );
    if (data && data.sessionId) return data;
  } catch {
    return null;
  }
};

const saveSession = (data) => {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(data)
  );
};

export default function CashierDashboard() {

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { t, toggleLang, lang } = useTranslation();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { items, total } = useSelector(
    (state) => state.cart
  );

  const [apiServices, setApiServices] = useState([]);
  const [localServices, setLocalServices] =
    useState(readLocalServices);
  const [staffList, setStaffList] = useState(
    readStaffList
  );
  const [sessionId, setSessionId] = useState("");
  const [sessionStart, setSessionStart] =
    useState("");
  const [sessionTransactions, setSessionTransactions] =
    useState([]);
  const [showEndSummary, setShowEndSummary] =
    useState(false);
  const [endSummary, setEndSummary] = useState(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await API.get("/services");
        setApiServices(
          Array.isArray(res.data) ? res.data : []
        );
      } catch {
        setApiServices([]);
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    const syncAdminData = () => {
      setStaffList(readStaffList());
      setLocalServices(readLocalServices());
    };

    window.addEventListener("storage", syncAdminData);
    window.addEventListener("focus", syncAdminData);

    return () => {
      window.removeEventListener(
        "storage",
        syncAdminData
      );
      window.removeEventListener(
        "focus",
        syncAdminData
      );
    };
  }, []);

  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.sessionId) {
      setSessionId(saved.sessionId);
      setSessionStart(saved.startedAt);
      setSessionTransactions(
        saved.transactions || []
      );
    } else {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      setSessionId(id);
      setSessionStart(now);
      setSessionTransactions([]);
      saveSession({
        sessionId: id,
        startedAt: now,
        transactions: [],
      });
    }
  }, []);

  const serviceCatalog = useMemo(() => {
    const flatDefaults = servicesData.flatMap((cat) =>
      cat.subcategories.flatMap((sub) =>
        sub.services.map((svc) => ({
          name: svc.name,
          category: cat.category,
          subcategory: sub.name,
          price: svc.price,
          nonAsrat: !!svc.nonAsrat,
        }))
      )
    );

    const merged = new Map();
    for (const s of flatDefaults) {
      merged.set(`${s.category}|${s.subcategory}|${s.name}`, s);
    }
    for (const s of localServices) {
      merged.set(`${s.category}|${s.subcategory}|${s.name}`, s);
    }
    for (const s of apiServices) {
      merged.set(`${s.category}|${s.subcategory}|${s.name}`, s);
    }

    return buildCatalogFromServices(Array.from(merged.values()));
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

  const [tipAmount, setTipAmount] = useState(0);

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

    const tip = Math.max(0, Number(tipAmount) || 0);

    const transactionData = {
      uuid: crypto.randomUUID(),
      services: items,
      total,
      tip,
      paymentType: paymentMethod,
    };

    setSavingTransaction(true);

    const result = await saveTransaction(transactionData);

    setSavingTransaction(false);

    dispatch(clearCart());
    setTipAmount(0);
    const updated = [
      ...sessionTransactions,
      {
        ...transactionData,
        completedAt: new Date().toISOString(),
      },
    ];
    setSessionTransactions(updated);
    saveSession({
      sessionId,
      startedAt: sessionStart,
      transactions: updated,
    });

    if (result.offline) {
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

    const transferPayments = sessionTransactions
      .filter(
        (t) =>
          t.paymentType !== "cash"
      )
      .reduce((sum, t) => sum + t.total, 0);

    const nonAsratSales = sessionTransactions
      .reduce((sum, t) => {
        const txNonAsrat = (t.services || [])
          .filter((svc) => svc.nonAsrat)
          .reduce((s, svc) => s + (Number(svc.price) || 0), 0);
        return sum + txNonAsrat;
      }, 0);

    const deductibleAmount =
      totalIncome - nonAsratSales;

    const asratMoney =
      deductibleAmount > 5500
        ? (deductibleAmount - 5500) * 0.1
        : 0;

    const totalTips = sessionTransactions.reduce(
      (sum, t) => sum + (t.tip || 0),
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
      transferPayments,
      nonAsratSales,
      deductibleAmount,
      asratMoney,
      totalTips,
      finalCashAmount,
    };

    setEndSummary(summary);
    setShowEndSummary(true);
  };

  const confirmEndDay = () => {
    const summaries = JSON.parse(
      localStorage.getItem("dailySummaries") || "[]"
    );
    summaries.push(endSummary);
    localStorage.setItem(
      "dailySummaries",
      JSON.stringify(summaries)
    );

    dispatch(clearCart());
    setTipAmount(0);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    setSessionId(id);
    setSessionStart(now);
    setSessionTransactions([]);
    saveSession({
      sessionId: id,
      startedAt: now,
      transactions: [],
    });
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
        minHeight: "100vh",
        background: "#fdf8f0",
      }}
    >

      {/* =========================
          HEADER
      ========================= */}

      <div
        style={{
          padding: "15px 20px",
          backgroundColor: "#f5eedd",
          borderBottom: "1px solid #e8dcc8",

          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          gap: isMobile ? 12 : 0,
        }}
      >

        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 24, color: "#3d2e1e" }}>{t("cashier.title")}</h1>
          <small style={{ color: "#8b7355" }}>
            {t("cashier.session")}{" "}
            {sessionStart
              ? new Date(
                  sessionStart
                ).toLocaleDateString()
              : ""}{" "}
            | {sessionTransactions.length} {t("cashier.transactions")}
          </small>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <OfflineIndicator />
          <button onClick={toggleLang} style={{ padding: "8px 12px", background: "#8B5E3C", color: "#111", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>{t("lang.switch")}</button>
          <button
            onClick={handleEndDay}
            disabled={
              sessionTransactions.length === 0
            }
            style={{
              padding: "8px 16px",
              backgroundColor:
                sessionTransactions.length === 0
                  ? "#ccc"
                  : "#8B5E3C",
              color:
                sessionTransactions.length === 0
                  ? "#999"
                  : "#111",
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
              padding: "8px 16px",
              backgroundColor: "#f44336",
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
        }}
      >

        {/* =========================
            LEFT SIDE — POS Service Table
        ========================= */}

        <div
          style={{
            width: isMobile ? "100%" : "60%",
            padding: isMobile ? "12px" : "20px",
            overflowY: "auto",
            borderRight: isMobile ? "none" : "1px solid #ddd",
          }}
        >

          <h2
            style={{
              margin: "0 0 20px",
              fontSize: "18px",
              color: "#3d2e1e",
            }}
          >
            {t("cashier.services")}
          </h2>

          {!showServices ? (
            <div style={{ color: "#8b7355", padding: 20, background: "#fefcf8", borderRadius: 10, border: "1px solid #e8dcc8" }}>
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
                  background: "#8B5E3C",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {t("cashier.showServices")}
              </button>
            </div>
          ) : groupedServices.length === 0 ? (
            <p style={{ color: "#999" }}>
              {t("cashier.noServices")}
            </p>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowServices(false)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #e8dcc8",
                    background: "#f5eedd",
                    color: "#5c4a32",
                    cursor: "pointer",
                  }}
                >
                  {t("cashier.hideServices")}
                </button>
              </div>
              {groupedServices.map((group) => (
                <div
                  key={group.category}
                  style={{
                    marginBottom: "24px",
                  }}
                >
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#8B5E3C",
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
                    background: "#fefcf8",
                    borderRadius: "6px",
                    overflow: "hidden",
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  {group.services.map((svc) => {
                    const key =
                      `${svc.category}|${svc.name}`;
                    const sel =
                      serviceSelections[key] || {};

                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding:
                            "8px 12px",
                          borderBottom:
                            "1px solid #f5edd0",
                          backgroundColor:
                            sel.checked
                              ? "#fdf5e6"
                              : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            !!sel.checked
                          }
                          onChange={(e) =>
                            setServiceSelections(
                              (prev) => ({
                                ...prev,
                                [key]: {
                                  ...prev[
                                    key
                                  ],
                                  checked:
                                    e.target
                                      .checked,
                                },
                              })
                            )
                          }
                          style={{
                            width: "18px",
                            height: "18px",
                            flexShrink: 0,
                          }}
                        />

                        <span
                          style={{
                            flex: 1,
                            fontSize:
                              "14px",
                            fontWeight: 500,
                          }}
                        >
                          {svc.name}
                        </span>
                        {svc.nonAsrat && <span style={{ background: "#f5eedd", color: "#8B5E3C", fontSize: 9, padding: "1px 5px", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap" }}>Non-Asrat</span>}

                        <span
                          style={{
                            width: "80px",
                            textAlign:
                              "right",
                            fontSize:
                              "14px",
                            fontWeight: 700,
                            whiteSpace:
                              "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {svc.price} Birr
                        </span>

                        <select
                          value={
                            sel.staff || ""
                          }
                          onChange={(e) =>
                            setServiceSelections(
                              (prev) => ({
                                ...prev,
                                [key]: {
                                  checked:
                                    prev[key]
                                      ?.checked ??
                                    true,
                                  staff:
                                    e.target
                                      .value,
                                },
                              })
                            )
                          }
                          style={{
                            width: "130px",
                            padding:
                              "5px 4px",
                            borderRadius:
                              "4px",
                            border:
                              "1px solid #e8dcc8",
                            fontSize:
                              "13px",
                            flexShrink: 0,
                          }}
                        >
                          <option value="">
                            {t("cashier.staffSelect")}
                          </option>
                          {staffList.map(
                            (s) => (
                              <option
                                key={s}
                                value={s}
                              >
                                {s}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            </>
          )}

          <button
            onClick={
              handleAddSelectedServices
            }
            disabled={selectedCount === 0}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor:
                selectedCount === 0
                  ? "#e8dcc8"
                  : "#8B5E3C",
              color:
                selectedCount === 0
                  ? "#a09070"
                  : "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 700,
              cursor:
                selectedCount === 0
                  ? "not-allowed"
                  : "pointer",
              marginTop: "8px",
            }}
          >
            {t("cashier.addSelected")}{selectedCount > 0
              ? ` (${selectedCount})`
              : ""}
          </button>

        </div>

        {/* =========================
            RIGHT SIDE
        ========================= */}

        <div
          style={{
            width: isMobile ? "100%" : "40%",
            padding: isMobile ? "12px" : "20px",
            overflowY: "auto",
          }}
        >

          <h2 style={{ color: "#3d2e1e" }}>{t("cashier.cart")}</h2>

          {items.map((item, index) => (

            <div
              key={index}

              style={{
                borderBottom: "1px solid #e8dcc8",
                marginBottom: "10px",
                paddingBottom: "10px",
              }}
            >

              <h4 style={{ color: "#3d2e1e", margin: "0 0 4px" }}>{item.name}</h4>

              <p style={{ margin: "0 0 2px", color: "#5c4a32" }}>{item.price} Birr</p>
              <small style={{ color: "#8b7355" }}>{t("cashier.staffSelect")}: {item.staff}</small>

              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#8b7355", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={!!item.nonAsrat}
                    onChange={() =>
                      dispatch(
                        toggleItemNonAsrat(index)
                      )
                    }
                  />
                  {t("cashier.nonAsrat")}
                </label>

                <button
                  onClick={() =>
                    dispatch(
                      removeFromCart(index)
                    )
                  }
                  style={{ fontSize: 12, padding: "3px 10px", background: "#b91c1c", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                  {t("cashier.remove")}
                </button>
              </div>

            </div>
          ))}

          <h2 style={{ color: "#8B5E3C" }}>{t("cashier.total")} {total} Birr</h2>

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
              border: "1px solid #e8dcc8",
              borderRadius: "6px",
              background: "#fefcf8",
              color: "#3d2e1e",
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

          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: 600,
                color: "#3d2e1e",
              }}
            >
              {t("cashier.tipLabel")}
            </label>
            <input
              type="number"
              min="0"
              value={tipAmount}
              onChange={(e) =>
                setTipAmount(
                  Math.max(
                    0,
                    Number(e.target.value) || 0
                  )
                )
              }
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border:
                  "1px solid #e8dcc8",
                boxSizing:
                  "border-box",
                background: "#fefcf8",
                color: "#3d2e1e",
              }}
            />
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
              background: savingTransaction ? "#a09070" : "#8B5E3C",
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
              background: "#5c4a32",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
            }}
          >
            {t("cashier.clearCart")}
          </button>

          {/* SESSION SUMMARY */}

          <div style={{ marginTop: "30px" }}>
            <h2 style={{ color: "#3d2e1e" }}>{t("cashier.sessionSummary")}</h2>
            {sessionTransactions.length === 0 ? (
              <p style={{ color: "#a09070" }}>
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

                <hr
                  style={{
                    border: "none",
                    borderTop:
                      "1px solid #e8dcc8",
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
            <h2 style={{ color: "#3d2e1e" }}>Local Transaction History</h2>
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
              "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fefcf8",
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "420px",
              width: "90%",
              boxShadow:
                "0 10px 40px rgba(0,0,0,0.3)",
              color: "#3d2e1e",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px",
                color: "#3d2e1e",
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
                  "1px solid #e8dcc8",
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
              {t("cashier.transferPayments")}{" "}
              {endSummary.transferPayments} Birr
            </p>
            <p>
              {t("cashier.nonAsratSales")}{" "}
              {endSummary.nonAsratSales} Birr
            </p>

            <hr
              style={{
                border: "none",
                borderTop:
                  "1px solid #e8dcc8",
                margin: "15px 0",
              }}
            />

            <p>
              {t("cashier.deductibleAmount")}{" "}
              {endSummary.deductibleAmount} Birr
            </p>
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
                  "1px solid #e8dcc8",
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
                  background: "#8B5E3C",
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
                  background: "#f5eedd",
                  color: "#5c4a32",
                  border: "1px solid #e8dcc8",
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
