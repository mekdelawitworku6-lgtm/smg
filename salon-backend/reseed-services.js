/* DESTRUCTIVE: replaces the entire Services table with the current price list.

   Usage:
     npm run reseed:services          (asks for confirmation)
     npm run reseed:services -- --yes (skips confirmation)

   Historical transactions are NOT affected: Transaction.services stores a
   JSONB snapshot of names/prices captured at sale time, not foreign keys. */

import readline from "readline";
import { sequelize } from "./src/config/db.js";
import Service from "./src/models/service.js";
import { services, replaceServices } from "./seed.js";

const summarize = () => {
  const grouped = services.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {});
  console.log("\nNew list by category:");
  for (const [cat, count] of Object.entries(grouped)) {
    console.log(`  ${String(count).padStart(2)}  ${cat}`);
  }
  console.log(`\n  ${services.length} services total`);
};

const apply = async () => {
  const { before, after } = await replaceServices();
  console.log(`Services before:  ${before}`);
  console.log(`Services after:   ${after}`);
  console.log("Done. Users, staff, expenses and transactions were not modified.");
};

const main = async () => {
  await sequelize.authenticate();

  const before = await Service.count();
  console.log(`Services before: ${before}`);
  console.log(`Will insert:     ${services.length}`);
  summarize();

  if (!process.argv.includes("--yes")) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((resolve) =>
      rl.question(`\nType "replace" to delete all ${before} services and load the new list: `, resolve)
    );
    rl.close();
    if (answer.trim().toLowerCase() !== "replace") {
      console.log("Cancelled. Nothing was changed.");
      await sequelize.close();
      return;
    }
  }

  await apply();
  await sequelize.close();
};

main().catch(async (err) => {
  console.error("\nReseed failed:", err.message);
  try { await sequelize.close(); } catch { /* already closed */ }
  process.exit(1);
});
