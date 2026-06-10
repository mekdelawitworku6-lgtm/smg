import { useEffect, useState, useRef } from "react";

import { db } from "./db";

export default function useOfflineTransactions() {
  const [transactions, setTransactions] = useState([]);
  const mountedRef = useRef(true);

  const load = async () => {
    try {
      const data = await db.transactions.toArray();
      if (mountedRef.current) {
        setTransactions(data.filter((tx) => tx.synced === false));
      }
    } catch {
      if (mountedRef.current) setTransactions([]);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    load();
    const interval = setInterval(load, 2000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  return transactions;
}
