import { db } from "./db";
import API from "../api/axios";

async function syncOne(tx) {
  const { id, synced, date, ...cleanTx } = tx;
  try {
    await API.post("/transactions", cleanTx);
    const txData = {
      services: tx.services,
      total: tx.total,
      tip: tx.tip || 0,
      tips: tx.tips || [],
      paymentType: tx.paymentType,
      uuid: tx.uuid,
      completedAt: new Date().toISOString(),
    };
    await db.transactions.delete(tx.id);
    return txData;
  } catch (err) {
    if (err.response?.status === 409) {
      const txData = {
        services: tx.services,
        total: tx.total,
        tip: tx.tip || 0,
        tips: tx.tips || [],
        paymentType: tx.paymentType,
        uuid: tx.uuid,
        completedAt: new Date().toISOString(),
      };
      try {
        await db.transactions.delete(tx.id);
      } catch {
      }
      return txData;
    }
    console.error("Sync error for transaction", tx.uuid, err.response?.status || err.message);
    throw err;
  }
}

let syncing = false;

export async function syncTransactions() {
  if (syncing) return [];
  syncing = true;
  try {
    let unsynced;
    try {
      unsynced = await db.transactions
        .where("synced")
        .equals(false)
        .toArray();
    } catch {
      return [];
    }

    const results = [];
    let hasError = false;
    let lastError = null;
    for (let tx of unsynced) {
      try {
        const data = await syncOne(tx);
        if (data) results.push(data);
      } catch (err) {
        hasError = true;
        lastError = err;
      }
    }
    if (hasError && results.length === 0) {
      const status = lastError?.response?.status || "unknown";
      const msg = lastError?.response?.data?.message || lastError?.message || "Unknown error";
      throw new Error(`Sync failed (HTTP ${status}): ${msg}`);
    }
    return results;
  } finally {
    syncing = false;
  }
}
