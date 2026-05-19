import express from "express";
import Transaction from "../models/Transaction.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =========================
   CREATE TRANSACTION (ADD)
========================= */
router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const transaction = new Transaction({
        ...req.body,
        createdAt: new Date(),
      });

      await transaction.save();

      res.status(201).json(transaction);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

/* =========================
   GET ALL
========================= */
router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const data = await Transaction.find().sort({
        createdAt: -1,
      });

      res.json(data);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

/* =========================
   UPDATE TRANSACTION
========================= */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const updated =
        await Transaction.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );

      res.json(updated);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

/* =========================
   DELETE TRANSACTION
========================= */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      await Transaction.findByIdAndDelete(
        req.params.id
      );

      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

export default router;