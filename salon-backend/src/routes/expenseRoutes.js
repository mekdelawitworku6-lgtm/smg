import express from "express";
import Expense from "../models/expense.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { Op } from "sequelize";

const router = express.Router();

/* =========================
   CREATE EXPENSE
========================= */

router.post("/", authMiddleware, roleMiddleware(["cashier", "admin"]), async (req, res) => {
  try {
    const allowed = ["name", "amount", "paymentType"];
    const body = {};
    for (const key of allowed) if (req.body[key] !== undefined) body[key] = req.body[key];
    body.createdBy = req.user.name;

    const expense = await Expense.create(body);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET EXPENSES (admin)
========================= */

router.get("/", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const expenses = await Expense.findAll({ order: [["createdAt", "DESC"]] });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   UPDATE EXPENSE (admin)
========================= */

router.put("/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const allowed = ["name", "amount", "paymentType"];
    const body = {};
    for (const key of allowed) if (req.body[key] !== undefined) body[key] = req.body[key];

    const [count] = await Expense.update(body, { where: { _id: req.params.id } });
    if (!count) return res.status(404).json({ message: "Expense not found" });
    const expense = await Expense.findOne({ where: { _id: req.params.id } });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   DELETE EXPENSE (admin)
========================= */

router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const count = await Expense.destroy({ where: { _id: req.params.id } });
    if (!count) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;