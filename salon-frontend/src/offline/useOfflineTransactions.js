import { useEffect, useState }
from "react";

import { db }
from "./db";

export default function useOfflineTransactions() {

  const [transactions,
    setTransactions] =
      useState([]);

  const load = async () => {
    try {
      const data =
        await db.transactions
          .where("synced")
          .equals(false)
          .toArray();
      setTransactions(data);
    } catch {
      setTransactions([]);
    }
  };

  useEffect(() => {

    load();

    const interval =
      setInterval(load, 2000);

    return () =>
      clearInterval(interval);

  }, []);

  return transactions;
}