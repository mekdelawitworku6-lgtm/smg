import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import API from "../api/axios";
import { logout } from "../auth/authSlice";
import { getTransactions } from "../transactions/transactionSlice";
import { useTranslation } from "../i18n/LanguageContext";

import DashboardView from "./admin/DashboardView";
import ServicesView from "./admin/ServicesView";
import StaffView from "./admin/StaffView";
import TransactionsView from "./admin/TransactionsView";
import CategoriesView from "./admin/CategoriesView";
import ReportsView from "./admin/ReportsView";


export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, toggleLang, lang } = useTranslation();

  const navItems = useMemo(() => [
    ["dashboard", t("nav.dashboard")],
    ["services", t("nav.services")],
    ["staff", t("nav.staff")],
    ["transactions", t("nav.transactions")],
    ["categories", t("nav.categories")],
    ["reports", t("nav.reports")],
  ], [lang]);

  const { list } = useSelector((state) => state.transactions);
  const [activeView, setActiveView] = useState("dashboard");
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    dispatch(getTransactions());
  }, [dispatch]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [svcRes, staffRes] = await Promise.all([
          API.get("/services"),
          API.get("/staff"),
        ]);
        setServices(Array.isArray(svcRes.data) ? svcRes.data : []);
        setStaffList(Array.isArray(staffRes.data) ? staffRes.data : []);
      } catch (err) {
        if (err.response?.status === 401) {
          setMessage(t("admin.sessionExpired"));
        } else {
          setMessage(t("admin.connectionError"));
        }
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const validTransactions = list
    .map((tx) => {
      if (!tx) return null;
      const servicesArr = Array.isArray(tx.services)
        ? tx.services
        : tx.serviceName
          ? [{ name: tx.serviceName, staff: tx.staffName, price: tx.price }]
          : [];
      const total =
        Number(tx.total ?? tx.amount) ||
        servicesArr.reduce((s, svc) => s + (Number(svc.price) || 0), 0);
      const createdAt = tx.createdAt || tx.created_at || tx.date;
      if (!createdAt || Number.isNaN(new Date(createdAt).getTime()) || (servicesArr.length === 0 && total <= 0)) return null;
      return { ...tx, services: servicesArr, total, createdAt, paymentType: tx.paymentType || tx.paymentMethod || "Payment" };
    })
    .filter(Boolean);

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView transactions={validTransactions} services={services} />;
      case "services":
        return <ServicesView services={services} setServices={setServices} />;
      case "staff":
        return <StaffView staffList={staffList} setStaffList={setStaffList} transactions={validTransactions} />;
      case "transactions":
        return <TransactionsView transactions={validTransactions} services={services} />;
      case "categories":
        return <CategoriesView />;
      case "reports":
        return <ReportsView transactions={validTransactions} />;
      default:
        return null;
    }
  };

  const styles = {
    shell: { display: "flex", minHeight: "100vh", background: "#fdf8f0", color: "#3d2e1e" },
    sidebar: {
      width: 220, background: "#f5eedd", display: "flex", flexDirection: "column", borderRight: "1px solid #e8dcc8", flexShrink: 0,
      ...(isMobile ? {
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 1000,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        boxShadow: sidebarOpen ? "4px 0 20px rgba(0,0,0,0.15)" : "none",
      } : {}),
    },
    brand: { padding: "20px 16px", fontSize: 18, fontWeight: 700, color: "#8B5E3C", borderBottom: "1px solid #e8dcc8" },
    nav: { flex: 1, padding: "12px 0" },
    navBtn: { display: "block", width: "100%", padding: "10px 20px", textAlign: "left", background: "none", border: "none", color: "#5c4a32", fontSize: 14, cursor: "pointer", transition: "0.15s" },
    navBtnActive: { background: "#8B5E3C", color: "#fff", fontWeight: 600 },
    logoutBtn: { padding: "12px 20px", background: "none", border: "none", borderTop: "1px solid #e8dcc8", color: "#c0392b", fontSize: 14, cursor: "pointer", textAlign: "left", width: "100%" },
    main: { flex: 1, padding: isMobile ? "16px" : "24px 32px", overflowY: "auto" },
    topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    title: { fontSize: isMobile ? 20 : 24, fontWeight: 700, margin: 0, color: "#3d2e1e" },
    notice: { background: "#fce4e4", color: "#c0392b", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 },
    hamburger: { background: "none", border: "none", color: "#8B5E3C", fontSize: 24, cursor: "pointer", padding: "4px 8px 4px 0", marginRight: 12 },
  };

  return (
    <div style={styles.shell}>
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} />
      )}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>{t("admin.brand")}</div>
        {isMobile && sidebarOpen && (
          <button onClick={() => setSidebarOpen(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#aaa", fontSize: 22, cursor: "pointer" }}>✕</button>
        )}
        <nav style={styles.nav}>
          {navItems.map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setActiveView(key); if (isMobile) setSidebarOpen(false); }}
              style={activeView === key ? { ...styles.navBtn, ...styles.navBtnActive } : styles.navBtn}
            >
              {label}
            </button>
          ))}
        </nav>
        <button onClick={toggleLang} style={{ ...styles.logoutBtn, color: "#8B5E3C", borderTop: "none", fontSize: 12 }}>{t("lang.switch")}</button>
        <button onClick={handleLogout} style={styles.logoutBtn}>{t("admin.logout")}</button>
      </aside>

      <main style={styles.main}>
        <div style={styles.topbar}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={styles.hamburger}>☰</button>
            )}
            <h1 style={styles.title}>{navItems.find(([k]) => k === activeView)?.[1]}</h1>
          </div>
        </div>
        {message && <div style={styles.notice}>{message}</div>}
        {renderView()}
      </main>
    </div>
  );
}
