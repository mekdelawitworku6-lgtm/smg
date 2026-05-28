import { v4 as uuidv4 }
from "uuid";

import { db }
from "./db";

import API
from "../api/axios";

export async function saveTransaction(data) {

  /* UNIQUE ID */
  const offlineId = uuidv4();

  const payload = {
    ...data,
    offlineId,
  };

  try {

    const res =
      await API.post(
        "/transactions",
        payload
      );

    return res.data;

  } catch {

    /* SAVE LOCALLY */
    await db.transactions.add({

      ...payload,

      synced: false,

      date: new Date(),
    });

    return {
      offline: true,
    };
  }
}