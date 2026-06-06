import { useState } from "react";

import useOfflineTransactions
from "../offline/useOfflineTransactions";

import { syncTransactions }
from "../offline/sync";

import { useTranslation }
from "../i18n/LanguageContext";

export default function OfflineTransactionHistory() {

  const { t } = useTranslation();

  const [filter, setFilter] =
    useState("ALL");
  const [syncing, setSyncing] = useState(false);
  const [hidden, setHidden] = useState(false);

  const transactions =
    useOfflineTransactions();

  if (transactions.length === 0 || hidden) return null;

  const pendingCount = transactions.filter((tx) => !tx.synced).length;

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await syncTransactions();
    } catch {}
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

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 14, background: "var(--color-warning)", color: "#fff", padding: "4px 12px", borderRadius: 12, fontWeight: 600 }}>
          {pendingCount} {t("offline.pending")}
        </span>
        <button
          onClick={handleSyncAll}
          disabled={syncing}
          style={{ padding: "6px 14px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: 4, cursor: syncing ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
        >
          {syncing ? t("offline.syncing") : t("offline.syncAll")}
        </button>
      </div>

    </div>
  );
}
