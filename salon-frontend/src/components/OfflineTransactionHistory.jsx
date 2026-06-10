import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import useOfflineTransactions
from "../offline/useOfflineTransactions";

import { syncTransactions }
from "../offline/sync";

import { setTransactions }
from "../session/sessionSlice";

import { useTranslation }
from "../i18n/LanguageContext";

import { useToast }
from "./Toast";

export default function OfflineTransactionHistory() {

  const toast = useToast();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const sessionTransactions = useSelector((state) => state.session.transactions);

  const [syncing, setSyncing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [syncedCount, setSyncedCount] = useState(0);

  const transactions =
    useOfflineTransactions();

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const pendingCount = transactions.filter((tx) => !tx.synced).length;

  const handleSyncAll = async () => {
    setSyncing(true);
    setFeedback(null);
    const { synced, failed } = await syncTransactions();
    setSyncedCount(synced.length);
    if (synced.length > 0) {
      const existingIds = new Set(sessionTransactions.map((t) => t.uuid));
      const newOnes = synced.filter((t) => !existingIds.has(t.uuid));
      if (newOnes.length > 0) {
        dispatch(setTransactions([...sessionTransactions, ...newOnes]));
      }
      setFeedback("success");
    }
    if (failed.length > 0) {
      setFeedback("error");
      const msg = failed[0].error?.response?.data?.message || failed[0].error?.message || t("offline.stillOffline");
      toast(`${t("offline.syncError")} ${msg}`, "error");
    } else if (synced.length === 0) {
      toast(`${t("offline.syncedSuccess")} (0)`, "success");
    } else {
      toast(`${synced.length} ${t("offline.syncedSuccess")}`, "success");
    }
    setSyncing(false);
  };

  return (

    <div style={{ border: "1px solid var(--border-color)", borderRadius: 8, overflow: "hidden" }}>

      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-secondary, #f5f5f5)", cursor: "pointer", userSelect: "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, color: "var(--text-primary)" }}>
            {collapsed ? "\u25B6" : "\u25BC"}
          </span>
          <strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
            {t("offline.title")}
          </strong>
          <span style={{ fontSize: 12, background: pendingCount > 0 ? "var(--color-warning)" : "var(--border-color)", color: pendingCount > 0 ? "#fff" : "var(--text-muted)", padding: "2px 10px", borderRadius: 12, fontWeight: 600 }}>
            {pendingCount} {t("offline.pending")}
          </span>
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: "10px 14px" }}>

          {feedback === "success" && (
            <div style={{ fontSize: 13, color: "var(--color-success)", fontWeight: 600, marginBottom: 8 }}>
              {t("offline.syncedSuccess")} ({syncedCount})
            </div>
          )}
          {feedback === "error" && (
            <div style={{ fontSize: 13, color: "var(--color-danger)", fontWeight: 600, marginBottom: 8 }}>
              {t("offline.stillOffline")}
            </div>
          )}

          {pendingCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={handleSyncAll}
                disabled={syncing}
                style={{ padding: "6px 14px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: 4, cursor: syncing ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
              >
                {syncing ? t("offline.syncing") : t("offline.syncAll")}
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
