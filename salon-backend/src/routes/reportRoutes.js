import express from "express";
import Transaction from "../models/Transaction.js";
import Expense from "../models/expense.js";

import {
  authMiddleware,
} from "../middleware/auth.middleware.js";

import {
  roleMiddleware,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/daily",

  authMiddleware,

  roleMiddleware(["admin"]),

  async (req, res) => {
    try {
      const today = new Date();

      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Query data created from the start of today
      const transactions =
        await Transaction.find({
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        });

      const expenses =
        await Expense.find({
          createdAt: {
            $gte: today,
          },
        });

      const totalIncome =
        transactions.reduce(
          (sum, item) => sum + (item.total || 0),
          0
        );

      const totalExpenses =
        expenses.reduce(
          (sum, item) => sum + (item.amount || 0),
          0
        );

      const profit =
        totalIncome - totalExpenses;

      res.json({
        totalIncome,
        totalExpenses,
        profit,

        transactionCount:
          transactions.length,
      });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

router.get(
  "/monthly",

  authMiddleware,

  roleMiddleware(["admin"]),

  async (req, res) => {
    try {
      const now = new Date();
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );
      const nextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      );

      const transactions =
        await Transaction.find({
          createdAt: {
            $gte: monthStart,
            $lt: nextMonth,
          },
        });

      const expenses =
        await Expense.find({
          createdAt: {
            $gte: monthStart,
            $lt: nextMonth,
          },
        });

      const totalIncome =
        transactions.reduce(
          (sum, item) => sum + (item.total || 0),
          0
        );

      const totalExpenses =
        expenses.reduce(
          (sum, item) => sum + (item.amount || 0),
          0
        );

      res.json({
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses,
        transactionCount: transactions.length,
        month:
          now.toLocaleString("default", {
            month: "long",
          }),
        year: now.getFullYear(),
      });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

export default router;
