import { db } from "./db";
import API from "../api/axios";

let syncing = false;

export async function syncTransactions() {
  if (syncing) return { synced: [], failed: [] };
  syncing = true;
  try {
    const unsynced = await db.transactions
      .where("synced")
      .equals(false)
      .toArray();

    const synced = [];
    const failed = [];

    for (const tx of unsynced) {
      const { id, synced: _s, date: _d, ...cleanTx } = tx;

      try {
        await API.post("/transactions", cleanTx);

        await db.transactions.update(id, { synced: true });

        synced.push({
          services: tx.services,
          total: tx.total,
          tip: tx.tip || 0,
          tips: tx.tips || [],
          paymentType: tx.paymentType,
          uuid: tx.uuid,
          completedAt: new Date().toISOString(),
        });
      } catch (err) {
        if (err.response?.status === 409) {
          await db.transactions.update(id, { synced: true });
          synced.push({
            services: tx.services,
            total: tx.total,
            tip: tx.tip || 0,
            tips: tx.tips || [],
            paymentType: tx.paymentType,
            uuid: tx.uuid,
            completedAt: new Date().toISOString(),
          });
        } else {
          console.error("Sync failed for", tx.uuid, err.response?.status || err.message);
          failed.push({ uuid: tx.uuid, error: err });
        }
      }
    }

    return { synced, failed };
  } finally {
    syncing = false;
  }
}
