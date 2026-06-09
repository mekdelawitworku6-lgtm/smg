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
        // item may already be deleted
      }
      return txData;
    }
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
    for (let tx of unsynced) {
      try {
        const data = await syncOne(tx);
        if (data) results.push(data);
      } catch {
        hasError = true;
      }
    }
    if (hasError && results.length === 0) {
      throw new Error("Sync failed for all transactions");
    }
    return results;
  } finally {
    syncing = false;
  }
}
