import { useState } from "react";

import useOfflineTransactions
from "../offline/useOfflineTransactions";

import { syncTransactions }
from "../offline/sync";

import { db }
from "../offline/db";

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

  const filtered =
    transactions.filter((tx) => {
      if (filter === "ALL") return true;
      if (filter === "PENDING") return !tx.synced;
      return false;
    });

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await syncTransactions();
    } catch {}
    setSyncing(false);
  };

  const handleRemoveAll = async () => {
    await db.transactions.clear();
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

      <div style={{ marginBottom: "10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button onClick={() => setFilter("ALL")} style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid var(--border-color)", background: filter === "ALL" ? "var(--color-primary)" : "#fff", color: filter === "ALL" ? "#fff" : "var(--text-primary)", cursor: "pointer" }}>
          {t("offline.all")}
        </button>
        <button onClick={() => setFilter("PENDING")} style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid var(--border-color)", background: filter === "PENDING" ? "var(--color-primary)" : "#fff", color: filter === "PENDING" ? "#fff" : "var(--text-primary)", cursor: "pointer" }}>
          {t("offline.pending")}
        </button>
        <button
          onClick={handleSyncAll}
          disabled={syncing}
          style={{ padding: "6px 10px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: 4, cursor: syncing ? "not-allowed" : "pointer" }}
        >
          {syncing ? t("offline.syncing") : t("offline.syncAll")}
        </button>
        <button
          onClick={handleRemoveAll}
          style={{ padding: "6px 10px", background: "var(--color-danger)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          {t("offline.removeAll")}
        </button>
      </div>

      {filtered.length === 0 && (
        <p>{t("offline.noLocal")}</p>
      )}

      {filtered.map((tx) => (

        <div
          key={tx.id}
          style={{
            border: "1px solid var(--border-color)",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "6px",
          }}
        >

          <div>
            <span
              style={{
                color: "var(--color-warning)",
                fontWeight: "bold",
              }}
            >
              🟠 {t("offline.pending")}
            </span>
          </div>

          <p>
            {t("offline.services")}{" "}
            {tx.services
              ?.map(
                (s) => s.name
              )
              .join(", ")}
          </p>

          <p>
            {t("offline.payment")}{" "}
            {tx.paymentType}
          </p>

          <p>
            {t("offline.total")}{" "}
            {tx.total} Birr
          </p>

          <p>
            {t("offline.date")}{" "}
            {new Date(
              tx.date
            ).toLocaleString()}
          </p>

        </div>
      ))}

    </div>
  );
}
