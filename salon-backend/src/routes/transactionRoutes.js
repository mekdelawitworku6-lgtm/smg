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
   GET TODAY'S TRANSACTIONS (auth required)
========================= */

router.get("/today", authMiddleware, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const transactions = await Transaction.findAll({
      where: { createdAt: { [Op.gte]: start, [Op.lte]: end } },
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