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

export default function OfflineTransactionHistory() {

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const sessionTransactions = useSelector((state) => state.session.transactions);

  const [syncing, setSyncing] = useState(false);
  const [hidden, setHidden] = useState(false);
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

  if (hidden || (transactions.length === 0 && !feedback)) return null;

  const pendingCount = transactions.filter((tx) => !tx.synced).length;

  const handleSyncAll = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const synced = await syncTransactions();
      setSyncedCount(synced.length);
      if (synced.length > 0) {
        const existingIds = new Set(sessionTransactions.map((t) => t.uuid));
        const newOnes = synced.filter((t) => !existingIds.has(t.uuid));
        if (newOnes.length > 0) {
          dispatch(setTransactions([...sessionTransactions, ...newOnes]));
        }
        setFeedback("success");
        window.alert(`✅ ${synced.length} ${t("offline.syncedSuccess")}`);
      } else {
        const { db } = await import("../offline/db");
        const remaining = await db.transactions.where("synced").equals(false).count();
        if (remaining > 0) {
          setFeedback("error");
          window.alert(`❌ ${t("offline.stillOffline")}`);
        } else {
          setSyncedCount(0);
        }
      }
    } catch {
      setFeedback("error");
      window.alert(`❌ ${t("offline.stillOffline")}`);
    }
    setSyncing(false);
  };

  return (

    <div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h3 style={{ margin: 0 }}>
          {t("offline.title")}
        </h3>
        <button
          onClick={() => setHidden(true)}
          style={{ padding: "4px 10px", background: "var(--border-color)", color: "var(--text-primary)", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
        >
          {t("cashier.hideServices")}
        </button>
      </div>

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

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 14, background: "var(--color-warning)", color: "#fff", padding: "4px 12px", borderRadius: 12, fontWeight: 600 }}>
          {pendingCount} {t("offline.pending")}
        </span>
        <button
          onClick={handleSyncAll}
          disabled={syncing || pendingCount === 0}
          style={{ padding: "6px 14px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: 4, cursor: syncing || pendingCount === 0 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
        >
          {syncing ? t("offline.syncing") : t("offline.syncAll")}
        </button>
      </div>

    </div>
  );
}
