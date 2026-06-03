import Dexie from "dexie";

export const db = new Dexie("WondeyaSpa");

db.version(1).stores({
  transactions: "++id, date, synced",
});
