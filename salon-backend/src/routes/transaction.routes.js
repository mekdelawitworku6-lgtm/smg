import express from "express";
import Transaction from "../models/Transaction.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =========================
   GET ALL TRANSACTIONS
========================= */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      services: {
        $exists: true,
        $ne: [],
      },
      total: {
        $type: "number",
      },
      createdAt: {
        $exists: true,
      },
    }).sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   CREATE TRANSACTION
========================= */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const services = Array.isArray(req.body.services)
      ? req.body.services.filter(
          (service) =>
            service.name &&
            service.staff &&
            Number(service.price) > 0
        )
      : [];

    if (services.length === 0) {
      return res.status(400).json({
        message: "At least one valid service is required",
      });
    }

    const total = services.reduce(
      (sum, service) =>
        sum + (Number(service.price) || 0),
      0
    );

    const transaction = await Transaction.create({
      ...req.body,
      services,
      total,
      cashierId: req.user.id, // Set from authMiddleware
    });
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
