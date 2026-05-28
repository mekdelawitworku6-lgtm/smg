import { useEffect, useState }
from "react";

import useOnlineStatus
from "../hooks/useOnlineStatus";

import { db }
from "../offline/db";

export default function OfflineIndicator() {

  const isOnline =
    useOnlineStatus();

  const [pendingCount,
    setPendingCount] =
      useState(0);

  /* =========================
     LOAD PENDING COUNT
  ========================= */

  const loadPending =
    async () => {
      try {
        const pending =
          await db.transactions
            .where("synced")
            .equals(false)
            .count();
        setPendingCount(pending);
      } catch {
        setPendingCount(0);
      }
    };

  useEffect(() => {

    loadPending();

    const interval =
      setInterval(
        loadPending,
        2000
      );

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div
      style={{
        padding: "12px",
        borderRadius: "10px",
        color: "white",
        fontWeight: "bold",
        minWidth: "180px",
        textAlign: "center",
        backgroundColor:
          isOnline
            ? "#4caf50"
            : "#ff9800",
      }}
    >

      <div>
        {isOnline
          ? "ONLINE"
          : "OFFLINE MODE"}
      </div>

      <div
        style={{
          marginTop: "6px",
          fontSize: "14px",
        }}
      >
        Pending Sync:
        {" "}
        {pendingCount}
      </div>

    </div>
  );
}