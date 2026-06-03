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

export async function syncTransactions() {
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
  for (let tx of unsynced) {
    try {
      const data = await syncOne(tx);
      if (data) results.push(data);
    } catch {
      // skip failed syncs
    }
  }
  return results;
}
