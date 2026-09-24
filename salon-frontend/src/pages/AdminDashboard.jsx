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
import ReportsView from "./admin/ReportsView";
import SettingsView from "./admin/SettingsView";
import AdminCashierView from "./admin/AdminCashierView";
import useOfflineTransactions from "../offline/useOfflineTransactions";
import WbsLogo from "../components/WbsLogo";


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
    ["cashierpanel", t("nav.cashierPanel")],
    ["settings", t("nav.settings") || "Settings"],
  ], [lang]);

  const { list } = useSelector((state) => state.transactions);
  const services = useSelector((state) => state.services.apiList);
  const staffList = useSelector((state) => state.staff.apiList);
  const [activeView, setActiveView] = useState("dashboard");
  const [serviceFilterStaff, setServiceFilterStaff] = useState("");

  const offlineTransactions = useOfflineTransactions();
  const pendingOfflineCount = offlineTransactions.filter((tx) => !tx.synced).length;
  const [message, setMessage] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

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
        return <ServicesView
          transactions={validTransactions}
          filterStaffName={serviceFilterStaff}
          onClearFilter={() => setServiceFilterStaff("")}
        />;
      case "staff":
        return <StaffView transactions={validTransactions} onCashierSelect={(name) => {
          setServiceFilterStaff(name);
          setActiveView("services");
        }} />;
      case "transactions":
        return <TransactionsView transactions={validTransactions} services={services} />;
      case "reports":
        return <ReportsView transactions={validTransactions} />;
      case "cashierpanel":
        return <AdminCashierView />;
      case "settings":
        return <SettingsView />;
      default:
        return null;
    }
  };

  const heroViews = ["dashboard", "staff", "reports", "cashierpanel"];

  return (
    <div className="wb" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header className="wb-header">
        {isMobile && (
          <button className="wb-ico" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        )}
        <WbsLogo className="wb-logo" />
        <span className="wb-name serif">Wondeya</span>
        <button className="wb-pill" onClick={toggleLang}>{t("lang.switch")}</button>
        <button className="wb-pill out" onClick={handleLogout}>{t("admin.logout")}</button>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {isMobile && (
          <>
            <div
              className={`wb-scrim${sidebarOpen ? " show" : ""}`}
              onClick={() => setSidebarOpen(false)}
              style={{ top: 62 }}
            />
            <aside className={`wb-drawer${sidebarOpen ? " show" : ""}`}>
              <div className="top">
                <WbsLogo className="wb-logo" style={{ width: 40 }} />
                <span className="wb-name serif" style={{ fontSize: 20 }}>Wondeya</span>
              </div>
              {navItems.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setActiveView(key); setSidebarOpen(false); }}
                  className={activeView === key ? "wb-nav on" : "wb-nav"}
                >
                  {label}
                </button>
              ))}
            </aside>
          </>
        )}

        {!isMobile && (
          <aside className="wb-drawer" style={{ transform: "none", position: "sticky", top: 62, bottom: "auto", height: "calc(100vh - 62px)", width: 230 }}>
            <div className="top">
              <WbsLogo className="wb-logo" style={{ width: 40 }} />
              <span className="wb-name serif" style={{ fontSize: 20 }}>Wondeya</span>
            </div>
            {navItems.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={activeView === key ? "wb-nav on" : "wb-nav"}
              >
                {label}
              </button>
            ))}
          </aside>
        )}

        <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column" }}>
          {heroViews.includes(activeView) && (
            <div className="wb-hero pc" style={{ flex: "0 0 auto" }}>
              <h1 className="serif">{navItems.find(([k]) => k === activeView)?.[1]}</h1>
            </div>
          )}

          <div style={{ width: "100%", maxWidth: 840, margin: "0 auto", flex: 1 }}>
            {pendingOfflineCount > 0 && (
              <div style={{ background: "#fef3c7", color: "#92400e", padding: "10px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700 }}>{pendingOfflineCount}</span>
                <span>{t("admin.offlinePending")}</span>
              </div>
            )}
            {message && (
              <div style={{ background: "#fef2f2", color: "var(--red)", padding: "10px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>
                {message}
              </div>
            )}
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
