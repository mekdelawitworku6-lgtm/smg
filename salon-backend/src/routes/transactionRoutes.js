import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Transaction from "../models/Transaction.js";
import User from "../models/User.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { Op, fn, col } from "sequelize";

const router = express.Router();

/* =========================
   SALON DAY BOUNDARIES
   The host runs in UTC but the salon keeps Africa/Addis_Ababa time (UTC+3, no
   DST). Resolving "today" with a plain server-local Date() left the first three
   hours of the morning on the previous UTC day, so those sales survived
   "End Day" and reappeared on the dashboard. Every day query goes through
   salonDayRange() so the ledger, /today and the reports agree.
========================= */

const SALON_UTC_OFFSET_MINUTES = Number(process.env.SALON_UTC_OFFSET_MINUTES ?? 180);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const salonDayRange = (dateStr) => {
  const offsetMs = SALON_UTC_OFFSET_MINUTES * 60000;
  const day = dateStr || new Date(Date.now() - offsetMs).toISOString().slice(0, 10);
  const midnight = new Date(`${day}T00:00:00.000Z`);

  if (Number.isNaN(midnight.getTime())) return null;

  return {
    start: new Date(midnight.getTime() - offsetMs),
    end: new Date(midnight.getTime() + 86400000 - offsetMs - 1),
  };
};

/* =========================
   CREATE TRANSACTION
========================= */

router.post("/", authMiddleware, async (req, res) => {
  try {
    const allowed = ["uuid", "offlineId", "services", "total", "amount", "tip", "tips", "paymentType", "paymentMethod", "staff"];
    const body = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) body[key] = req.body[key];
    }
    body.createdAt = new Date();

    const tx = await Transaction.create(body);
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET TRANSACTIONS (sort newest first)
========================= */

router.get("/", authMiddleware, async (req, res) => {
  try {
    const data = await Transaction.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   UPDATE TRANSACTION
========================= */

router.put("/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const allowed = ["services", "total", "amount", "tip", "tips", "paymentType", "paymentMethod", "staff"];
    const body = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) body[key] = req.body[key];
    }

    const [count] = await Transaction.update(body, { where: { _id: req.params.id } });
    if (!count) return res.status(404).json({ message: "Transaction not found" });

    const tx = await Transaction.findOne({ where: { _id: req.params.id } });
    res.json(tx);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   DELETE ONE TRANSACTION
========================= */

router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const count = await Transaction.destroy({ where: { _id: req.params.id } });
    if (!count) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   DELETE MULTIPLE TRANSACTIONS BY IDS (admin, requires password)
========================= */

router.post("/delete-multiple-transactions", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }
    const count = await Transaction.destroy({ where: { _id: { [Op.in]: ids } } });
    res.json({ message: `Deleted ${count} transaction(s)`, deletedCount: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   DELETE MULTIPLE BY IDS (legacy route name kept)
========================= */

router.post("/delete-multiple", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }
    const count = await Transaction.destroy({ where: { _id: { [Op.in]: ids } } });
    res.json({ message: `Deleted ${count} transaction(s)`, deletedCount: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   CLEAR TODAY'S TRANSACTIONS
   Permanently removes every transaction dated today so the
   dashboard and reports start from zero after "End Day".
========================= */

router.post("/clear-day", authMiddleware, roleMiddleware(["admin", "cashier"]), async (req, res) => {
  try {
    const { date } = req.body || {};

    if (date !== undefined && !DATE_PATTERN.test(date)) {
      return res.status(400).json({ message: "date must be YYYY-MM-DD" });
    }

    const range = salonDayRange(date);
    if (!range) return res.status(400).json({ message: "Invalid date" });

    const count = await Transaction.destroy({
      where: { createdAt: { [Op.gte]: range.start, [Op.lte]: range.end } },
    });

    res.json({ message: `Cleared ${count} transaction(s)`, deletedCount: count, date: date || range.start.toISOString().slice(0, 10) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   CLEAR ALL TRANSACTIONS (admin)
   Wipes the entire ledger. Intended for resetting demo data.
========================= */

router.post("/clear-all", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const count = await Transaction.destroy({ where: {} });
    res.json({ message: `Cleared ${count} transaction(s)`, deletedCount: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET TODAY'S TRANSACTIONS (auth required)
========================= */

router.get("/today", authMiddleware, async (req, res) => {
  try {
    const range = salonDayRange(req.query.date);
    if (!range) return res.status(400).json({ message: "Invalid date" });

    const transactions = await Transaction.findAll({
      where: { createdAt: { [Op.gte]: range.start, [Op.lte]: range.end } },
      order: [["createdAt", "DESC"]],
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET TRANSACTIONS BY DATETIME (auth required)
========================= */

router.get("/by-datetime", authMiddleware, async (req, res) => {
  try {
    const { datetime } = req.query;
    if (!datetime) {
      return res.status(400).json({ message: "datetime query parameter is required" });
    }

    const dt = new Date(datetime);
    if (isNaN(dt.getTime())) {
      return res.status(400).json({ message: "Invalid datetime format" });
    }

    const start = new Date(dt);
    start.setMinutes(start.getMinutes() - 1);
    const end = new Date(dt);
    end.setMinutes(end.getMinutes() + 1);

    const transactions = await Transaction.findAll({
      where: { createdAt: { [Op.gte]: start, [Op.lte]: end } },
      order: [["createdAt", "DESC"]],
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;