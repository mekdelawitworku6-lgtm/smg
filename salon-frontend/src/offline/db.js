import Dexie from "dexie";

export const db = new Dexie("SalonPOS");

db.version(1).stores({
  transactions: "++id, date, synced",
});
