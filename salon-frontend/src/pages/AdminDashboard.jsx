import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { logout } from "../auth/authSlice";
import { getTransactions } from "../transactions/transactionSlice";
import { fetchServices, setLocalServices } from "../services/servicesSlice";
import { fetchStaff, setStaffList } from "../staff/staffSlice";
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
    ["reports", t("nav.reports")],
  ], [lang]);

  const { list } = useSelector((state) => state.transactions);
  const services = useSelector((state) => state.services.apiList);
  const staffList = useSelector((state) => state.staff.apiList);
  const [activeView, setActiveView] = useState("dashboard");
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    dispatch(getTransactions());
    dispatch(fetchServices());
    dispatch(fetchStaff());
  }, [dispatch]);

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
        return <>
          <ServicesView />
          <div style={{ marginTop: 32 }}>
            <CategoriesView />
          </div>
        </>;
      case "staff":
        return <StaffView transactions={validTransactions} />;
      case "transactions":
        return <TransactionsView transactions={validTransactions} services={services} />;
      case "reports":
        return <ReportsView transactions={validTransactions} />;
      default:
        return null;
    }
  };

  const styles = {
    shell: { display: "flex", minHeight: "100vh", background: "var(--bg-body)", color: "var(--text-primary)" },
    topHeader: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", height: 60, background: "var(--bg-card)",
      borderBottom: "1px solid var(--border-color)", flexShrink: 0,
      position: "sticky", top: 0, zIndex: 100,
    },
    topLeft: { display: "flex", alignItems: "center", gap: 12 },
    topRight: { display: "flex", alignItems: "center", gap: 8 },
    brand: { fontSize: 20, fontWeight: 800, color: "var(--color-primary)", letterSpacing: 1 },
    topBtn: {
      padding: "8px 14px", borderRadius: 8, border: "none", fontSize: 13,
      fontWeight: 600, cursor: "pointer", transition: "0.15s",
    },
    topBtnActive: {
      background: "var(--color-primary)", color: "#fff",
    },
    topBtnInactive: {
      background: "transparent", color: "var(--text-secondary)",
    },
    logoutBtn: {
      background: "transparent", border: "1px solid var(--border-color)", color: "var(--color-danger)",
      padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: "pointer", transition: "0.15s",
    },
    body: { display: "flex", flex: 1, minHeight: 0 },
    sidebar: {
      width: 220, background: "var(--bg-card)", borderRight: "1px solid var(--border-color)",
      flexShrink: 0, padding: "12px 0", overflowY: "auto",
      ...(isMobile ? {
        position: "fixed", top: 60, left: 0, bottom: 0, zIndex: 1000,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        boxShadow: sidebarOpen ? "4px 0 20px rgba(0,0,0,0.12)" : "none",
      } : {}),
    },
    navBtn: {
      display: "flex", alignItems: "center", gap: 10,
      width: "100%", padding: "12px 20px",
      background: "none", border: "none", color: "var(--text-secondary)",
      fontSize: 14, cursor: "pointer", textAlign: "left",
      transition: "0.15s",
    },
    navBtnActive: {
      background: "var(--color-primary-light)", color: "var(--color-primary)", fontWeight: 700,
      borderRight: "3px solid var(--color-primary)",
    },
    main: { flex: 1, padding: isMobile ? "16px" : "24px 32px", overflowY: "auto", minHeight: 0 },
    header: { marginBottom: 24 },
    title: { fontSize: isMobile ? 20 : 24, fontWeight: 700, margin: 0, color: "var(--text-primary)" },
    notice: { background: "#FEF2F2", color: "var(--color-danger)", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 },
    hamburger: { background: "none", border: "none", color: "var(--color-primary)", fontSize: 22, cursor: "pointer", padding: "4px" },
    langBtn: {
      background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-secondary)",
      padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
      cursor: "pointer", transition: "0.15s",
    },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={styles.topHeader}>
        <div style={styles.topLeft}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)} style={styles.hamburger}>☰</button>
          )}
          <span style={styles.brand}>{t("admin.brand")}</span>
        </div>
        <div style={styles.topRight}>
          {navItems.map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setActiveView(key); }}
              style={{
                ...styles.topBtn,
                ...(activeView === key ? styles.topBtnActive : styles.topBtnInactive),
                display: isMobile ? "none" : "block",
              }}
            >
              {label}
            </button>
          ))}
          <button onClick={toggleLang} style={styles.langBtn}>{t("lang.switch")}</button>
          <button onClick={handleLogout} style={styles.logoutBtn}>{t("admin.logout")}</button>
        </div>
      </div>

      <div style={styles.body}>
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999, top: 60 }} />
        )}
        <aside style={styles.sidebar}>
          {navItems.map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setActiveView(key); if (isMobile) setSidebarOpen(false); }}
              style={activeView === key ? { ...styles.navBtn, ...styles.navBtnActive } : styles.navBtn}
            >
              {label}
            </button>
          ))}
        </aside>

        <main style={styles.main}>
          <div style={styles.header}>
            <h1 style={styles.title}>{navItems.find(([k]) => k === activeView)?.[1]}</h1>
          </div>
          {message && <div style={styles.notice}>{message}</div>}
          {renderView()}
        </main>
      </div>
    </div>
  );
}
