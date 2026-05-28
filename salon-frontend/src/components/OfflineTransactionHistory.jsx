import { useState }
from "react";

import useOfflineTransactions
from "../offline/useOfflineTransactions";

import { db }
from "../offline/db";

import API
from "../api/axios";

import { useTranslation }
from "../i18n/LanguageContext";

export default function OfflineTransactionHistory() {

  const { t } = useTranslation();

  const transactions =
    useOfflineTransactions();

  const [filter, setFilter] =
    useState("ALL");

  const filtered =
    transactions.filter((tx) => {
      if (filter === "ALL") return true;
      if (filter === "SYNCED") return tx.synced;
      if (filter === "PENDING") return !tx.synced;
    });

  const retrySync = async (tx) => {
    try {
      await API.post("/transactions", tx);
      await db.transactions.update(tx.id, { synced: true });
      alert(t("offline.syncedSuccess"));
    } catch {
      alert(t("offline.stillOffline"));
    }
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
        <button onClick={() => setFilter("SYNCED")}>
          {t("offline.synced")}
        </button>
        <button onClick={() => setFilter("PENDING")}>
          {t("offline.pending")}
        </button>
      </div>

      {filtered.length === 0 && (
        <p>{t("offline.noLocal")}</p>
      )}

      {filtered.map((tx) => (

        <div
          key={tx.id}
          style={{
            border: "1px solid #ddd",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "6px",
          }}
        >

          {/* STATUS BADGE */}
          <div>

            {tx.synced ? (
              <span
                style={{
                  color: "green",
                  fontWeight: "bold",
                }}
              >
                ✔ {t("offline.synced")}
              </span>
            ) : (
              <span
                style={{
                  color: "orange",
                  fontWeight: "bold",
                }}
              >
                🟠 {t("offline.pending")}
              </span>
            )}

          </div>

          {/* INFO */}
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

          {!tx.synced && (
            <button
              onClick={() => retrySync(tx)}
              style={{
                marginTop: "8px",
                padding: "6px 10px",
                background: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {t("offline.retrySync")}
            </button>
          )}

        </div>
      ))}

    </div>
  );
}