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

import servicesData from "../data/services";
import defaultStaff from "../data/staff";

import API from "../api/axios";

import {
  addToCart,
  removeFromCart,
  clearCart,
} from "../cart/cartSlice";

import { createTransaction }
from "../transactions/transactionSlice";

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
     CATEGORY STATE
  ========================= */

  const [selectedCategory, setSelectedCategory] =
    useState(serviceCatalog[0]);

  const [selectedSubcategory, setSelectedSubcategory] =
    useState(
      serviceCatalog[0].subcategories[0]
    );

  useEffect(() => {
    const firstCategory = serviceCatalog[0];
    const matchingCategory =
      selectedCategory &&
      serviceCatalog.find(
        (category) =>
          category.category ===
          selectedCategory.category
      );

    if (!matchingCategory && firstCategory) {
      setSelectedCategory(firstCategory);
      setSelectedSubcategory(
        firstCategory.subcategories[0]
      );
      return;
    }

    if (
      matchingCategory &&
      matchingCategory !== selectedCategory
    ) {
      setSelectedCategory(matchingCategory);

      const matchingSubcategory =
        selectedSubcategory &&
        matchingCategory.subcategories.find(
          (subcategory) =>
            subcategory.name ===
            selectedSubcategory.name
        );

      setSelectedSubcategory(
        matchingSubcategory ||
        matchingCategory.subcategories[0]
      );
    }
  }, [
    serviceCatalog,
    selectedCategory,
    selectedSubcategory,
  ]);

  /* =========================
     TRANSACTION STATE
  ========================= */

  const [selectedStaff, setSelectedStaff] = useState("");

  const [serviceIndex, setServiceIndex] =
    useState(-1);
  const [perServiceStaff, setPerServiceStaff] =
    useState("");
  const [showAllServices, setShowAllServices] =
    useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState("cash");

  const [savingTransaction, setSavingTransaction] =
    useState(false);

  const currentCategory =
    selectedCategory || serviceCatalog[0];
  const currentSubcategory =
    selectedSubcategory ||
    currentCategory?.subcategories?.[0];

  /* =========================
     COMPLETE TRANSACTION
  ========================= */

  const handleCompleteTransaction = async () => {

    if (items.length === 0) {
      return alert("Cart is empty");
    }

    const transactionData = {
      uuid: crypto.randomUUID(),
      services: items,
      total,
      paymentType: paymentMethod,
    };

    setSavingTransaction(true);

    const result = await dispatch(
      createTransaction(transactionData)
    );

    setSavingTransaction(false);

    if (createTransaction.fulfilled.match(result)) {
      dispatch(clearCart());
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
      alert("Transaction Completed");
      return;
    }

    alert(
      result.payload ||
      "Transaction failed. Please login again and retry."
    );
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    setSelectedStaff("");
  };

  const handleEndDay = () => {
    const cashTotal = sessionTransactions
      .filter((t) => t.paymentType === "cash")
      .reduce((sum, t) => sum + t.total, 0);
    const telebirrTotal = sessionTransactions
      .filter((t) => t.paymentType === "telebirr")
      .reduce((sum, t) => sum + t.total, 0);
    const abysinyaTotal = sessionTransactions
      .filter((t) => t.paymentType === "abysinya")
      .reduce((sum, t) => sum + t.total, 0);
    const cbeTotal = sessionTransactions
      .filter((t) => t.paymentType === "cbe")
      .reduce((sum, t) => sum + t.total, 0);

    const summary = {
      sessionId,
      date: sessionStart.split("T")[0],
      startedAt: sessionStart,
      endedAt: new Date().toISOString(),
      transactions: sessionTransactions.length,
      cashTotal,
      telebirrTotal,
      abysinyaTotal,
      cbeTotal,
      grandTotal: cashTotal + telebirrTotal + abysinyaTotal + cbeTotal,
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
        background: "#f7f7f7",
      }}
    >

      {/* =========================
          HEADER
      ========================= */}

      <div
        style={{
          padding: "15px 20px",
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #ddd",

          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >

        <div>
          <h1 style={{ margin: 0 }}>Cashier Dashboard</h1>
          <small style={{ color: "#666" }}>
            Session:{" "}
            {sessionStart
              ? new Date(
                  sessionStart
                ).toLocaleDateString()
              : ""}{" "}
            | {sessionTransactions.length} transaction
            {sessionTransactions.length !== 1
              ? "s"
              : ""}
          </small>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
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
                  : "#d4af37",
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
            End Day
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
            Logout
          </button>
        </div>

      </div>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
        }}
      >

        {/* =========================
            LEFT SIDE
        ========================= */}

        <div
          style={{
            width: "60%",
            padding: "20px",
            overflowY: "auto",
            borderRight: "1px solid #ddd",
          }}
        >

          {/* ALL SERVICES */}

          <h2
            onClick={() =>
              setShowAllServices(!showAllServices)
            }
            style={{
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>
              {showAllServices ? "▼" : "▶"}
            </span>
            All Services
          </h2>

          {showAllServices && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "15px",
                marginBottom: "30px",
              }}
            >
              {allServicesFlat.map((service, index) => (
                <div
                  key={index}
                  style={{
                    background: "#fff",
                    padding: "15px",
                    borderRadius: "10px",
                    boxShadow:
                      "0 2px 5px rgba(0,0,0,0.1)",
                  }}
                >
                  <h3 style={{ margin: "0 0 4px" }}>
                    {service.name}
                  </h3>
                  <small
                    style={{
                      color: "#666",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    {service.category} /{" "}
                    {service.subcategory}
                  </small>
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontWeight: "bold",
                    }}
                  >
                    {service.price} Birr
                  </p>

                  <select
                    value={
                      serviceIndex === index
                        ? perServiceStaff
                        : ""
                    }
                    onChange={(e) => {
                      setServiceIndex(index);
                      setPerServiceStaff(
                        e.target.value
                      );
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "10px",
                      borderRadius: "5px",
                    }}
                  >
                    <option value="">
                      Select Staff
                    </option>
                    {staffList.map((staff) => (
                      <option key={staff} value={staff}>
                        {staff}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      const staff =
                        serviceIndex === index
                          ? perServiceStaff
                          : "";
                      if (!staff)
                        return alert(
                          "Please select a staff member for this service"
                        );
                      dispatch(
                        addToCart({
                          name: service.name,
                          price: service.price,
                          staff,
                        })
                      );
                      setServiceIndex(-1);
                      setPerServiceStaff("");
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "#111",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* CATEGORIES */}

          <h2>Categories</h2>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >

            {serviceCatalog.length === 0 ? (
              <p>No services available</p>
            ) : serviceCatalog.map(
              (category, index) => (

                <button
                  key={index}

                  onClick={() => {

                    setSelectedCategory(
                      category
                    );

                    setSelectedSubcategory(
                      category.subcategories[0]
                    );
                  }}

                  style={{
                    padding: "10px 20px",

                    background:
                      currentCategory?.category ===
                      category.category
                        ? "#111"
                        : "#ddd",

                    color:
                      currentCategory?.category ===
                      category.category
                        ? "#fff"
                        : "#000",

                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  {category.category}
                </button>
              )
            )}

          </div>

          {/* SUBCATEGORIES */}

          <h2>Subcategories</h2>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >

            {(currentCategory?.subcategories || []).map(
              (subcategory, index) => (

                <button
                  key={index}

                  onClick={() =>
                    setSelectedSubcategory(
                      subcategory
                    )
                  }

                  style={{
                    padding: "8px 16px",

                    background:
                      currentSubcategory?.name ===
                      subcategory.name
                        ? "#333"
                        : "#ccc",

                    color:
                      currentSubcategory?.name ===
                      subcategory.name
                        ? "#fff"
                        : "#000",

                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  {subcategory.name}
                </button>
              )
            )}

          </div>

          {/* SERVICES */}

          <h2>Services</h2>

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(auto-fill, minmax(200px, 1fr))",

              gap: "15px",
            }}
          >

            {!currentSubcategory ? (
              <p>Select a category to view services.</p>
            ) : currentSubcategory.services.map(
              (service, index) => (

                <div
                  key={index}

                  style={{
                    background: "#fff",
                    padding: "15px",
                    borderRadius: "10px",
                    boxShadow:
                      "0 2px 5px rgba(0,0,0,0.1)",
                  }}
                >

                  <h3>{service.name}</h3>

                  <p>{service.price} Birr</p>

                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "10px",
                      borderRadius: "5px"
                    }}
                  >
                    <option value="">Select Staff</option>
                    {staffList.map((staff) => (
                      <option
                        key={staff}
                        value={staff}
                      >
                        {staff}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      if (!selectedStaff) return alert("Please select a staff member for this service");
                      dispatch(
                        addToCart({
                          name: service.name,
                          price: service.price,
                          staff: selectedStaff,
                        })
                      );
                      setSelectedStaff(""); // Reset after adding
                    }
                    }

                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "#111",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>

                </div>
              )
            )}

          </div>

        </div>

        {/* =========================
            RIGHT SIDE
        ========================= */}

        <div
          style={{
            width: "40%",
            padding: "20px",
            overflowY: "auto",
          }}
        >

          <h2>Transaction Cart</h2>

          {items.map((item, index) => (

            <div
              key={index}

              style={{
                borderBottom: "1px solid #ddd",
                marginBottom: "10px",
                paddingBottom: "10px",
              }}
            >

              <h4>{item.name}</h4>

              <p>{item.price} Birr</p>
              <small>Staff: {item.staff}</small>

              <button
                onClick={() =>
                  dispatch(
                    removeFromCart(index)
                  )
                }
              >
                Remove
              </button>

            </div>
          ))}

          <h2>Total: {total} Birr</h2>

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
            }}
          >

            <option value="cash">
              Cash
            </option>

            <option value="telebirr">
              Telebirr
            </option>

            <option value="abysinya">
              Abysinya
            </option>

            <option value="cbe">
              CBE
            </option>

          </select>

          {/* BUTTONS */}

          <button
            onClick={
              handleCompleteTransaction
            }
            disabled={savingTransaction}

            style={{
              width: "100%",
              padding: "15px",
              background: savingTransaction ? "#777" : "green",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              marginBottom: "10px",
            }}
          >
            {savingTransaction
              ? "Saving..."
              : "Complete Transaction"}
          </button>

          <button
            type="button"
            onClick={handleClearCart}

            style={{
              width: "100%",
              padding: "15px",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
            }}
          >
            Clear Cart
          </button>

          {/* SESSION SUMMARY */}

          <div style={{ marginTop: "30px" }}>
            <h2>Session Summary</h2>
            {sessionTransactions.length === 0 ? (
              <p style={{ color: "#999" }}>
                No transactions yet in this session.
              </p>
            ) : (
              <div>
                <p>
                  <strong>
                    {
                      sessionTransactions.length
                    }{" "}
                    transactions
                  </strong>
                </p>
                <p>
                  Cash:{" "}
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
                  Telebirr:{" "}
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
                  Abysinya:{" "}
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
                  CBE:{" "}
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
                <hr
                  style={{
                    border: "none",
                    borderTop:
                      "1px solid #ddd",
                    margin: "10px 0",
                  }}
                />
                <p>
                  <strong>
                    Grand Total:{" "}
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
              background: "#fff",
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "420px",
              width: "90%",
              boxShadow:
                "0 10px 40px rgba(0,0,0,0.3)",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px",
              }}
            >
              End of Day Summary
            </h2>

            <p>
              <strong>Date:</strong>{" "}
              {endSummary.date}
            </p>
            <p>
              <strong>Transactions:</strong>{" "}
              {endSummary.transactions}
            </p>

            <hr
              style={{
                border: "none",
                borderTop:
                  "1px solid #ddd",
                margin: "15px 0",
              }}
            />

            <p>
              Cash:{" "}
              <strong>
                {endSummary.cashTotal} Birr
              </strong>
            </p>
            <p>
              Telebirr:{" "}
              <strong>
                {endSummary.telebirrTotal} Birr
              </strong>
            </p>
            <p>
              Abysinya:{" "}
              <strong>
                {endSummary.abysinyaTotal} Birr
              </strong>
            </p>
            <p>
              CBE:{" "}
              <strong>
                {endSummary.cbeTotal} Birr
              </strong>
            </p>

            <hr
              style={{
                border: "none",
                borderTop:
                  "1px solid #ddd",
                margin: "15px 0",
              }}
            />

            <p
              style={{
                fontSize: "18px",
              }}
            >
              <strong>
                Grand Total:{" "}
                {endSummary.grandTotal} Birr
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
                  background: "#d4af37",
                  color: "#111",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Confirm & End Day
              </button>
              <button
                onClick={cancelEndDay}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#eee",
                  color: "#333",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
