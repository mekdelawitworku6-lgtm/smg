import { db }
from "./db";

import API
from "../api/axios";

export async function syncTransactions() {

  const unsynced =
    await db.transactions
      .where("synced")
      .equals(false)
      .toArray();

  for (let tx of unsynced) {

    try {

      await API.post(
        "/transactions",
        tx
      );

      /* MARK SYNCED */
      await db.transactions.update(
        tx.id,
        {
          synced: true,
        }
      );

    } catch (err) {

      /* DUPLICATE? */
      if (
        err.response?.status === 409
      ) {

        await db.transactions.update(
          tx.id,
          {
            synced: true,
          }
        );
      }

      console.log(
        "Sync failed"
      );
    }
  }
}