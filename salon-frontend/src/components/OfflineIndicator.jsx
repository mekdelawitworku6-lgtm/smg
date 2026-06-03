import { useEffect, useState } from "react";
import { db } from "../offline/db";

export default function OfflineIndicator({ isOnline: propOnline }) {
  const [localOnline, setLocalOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  const isOnline = propOnline !== undefined ? propOnline : localOnline;

  useEffect(() => {
    const update = () => setLocalOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const loadPending = async () => {
    try {
      const pending = await db.transactions.where("synced").equals(false).count();
      setPendingCount(pending);
    } catch {
      setPendingCount(0);
    }
  };

  useEffect(() => {
    loadPending();
    const interval = setInterval(loadPending, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: "8px",
        color: "#fff",
        fontWeight: 700,
        fontSize: 13,
        backgroundColor: isOnline ? "var(--color-success)" : "var(--color-warning)",
        cursor: "default",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#fff",
          display: "inline-block",
        }}
      />
      <span>{isOnline ? "ONLINE" : "OFFLINE"}</span>
      <span style={{ opacity: 0.8 }}>|</span>
      <span style={{ opacity: 0.8 }}>{pendingCount} pending</span>
    </div>
  );
}