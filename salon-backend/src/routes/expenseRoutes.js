import express from "express";

import Expense from "../models/expense.js";

import {
  authMiddleware,
} from "../middleware/auth.middleware.js";

import {
  roleMiddleware,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =========================
   CREATE EXPENSE
========================= */

router.post(
  "/",

  authMiddleware,

  roleMiddleware(["cashier", "admin"]),

  async (req, res) => {
    try {
      const expense =
        await Expense.create({
          ...req.body,

          createdBy: req.user.name,
        });

      res.status(201).json(expense);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

/* =========================
   GET EXPENSES
   ADMIN ONLY
========================= */

router.get(
  "/",

  authMiddleware,

  roleMiddleware(["admin"]),

  async (req, res) => {
    try {
      const expenses =
        await Expense.find().sort({
          createdAt: -1,
        });

      res.json(expenses);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

export default router;