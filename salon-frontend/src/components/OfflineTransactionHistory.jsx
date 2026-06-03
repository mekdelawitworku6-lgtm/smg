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

  const transactions =
    useOfflineTransactions();

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

  return (

    <div>

      <h3>
        {t("offline.title")}
      </h3>

      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => setFilter("ALL")}>
          {t("offline.all")}
        </button>
        <button onClick={() => setFilter("PENDING")}>
          {t("offline.pending")}
        </button>
        <button
          onClick={handleSyncAll}
          disabled={syncing}
          style={{ marginLeft: 8, padding: "6px 10px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          {syncing ? "Syncing..." : "Sync All"}
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
            Services:{" "}
            {tx.services
              ?.map(
                (s) => s.name
              )
              .join(", ")}
          </p>

          <p>
            Payment:{" "}
            {tx.paymentType}
          </p>

          <p>
            Total:{" "}
            {tx.total} Birr
          </p>

          <p>
            Date:{" "}
            {new Date(
              tx.date
            ).toLocaleString()}
          </p>

        </div>
      ))}

    </div>
  );
}
