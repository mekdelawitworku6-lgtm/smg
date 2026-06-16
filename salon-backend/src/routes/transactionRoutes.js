import express from "express";
import bcrypt from "bcryptjs";
import Transaction from "../models/Transaction.js";
import User from "../models/User.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      createdAt: new Date(),
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const data = await Transaction.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* DELETE TRANSACTIONS BY DATE RANGE (admin only, requires password) */
router.post("/delete-by-date", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const { startDate, endDate, password } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required to confirm deletion" });
    }

    const admin = await User.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const result = await Transaction.deleteMany({
      createdAt: { $gte: start, $lte: end },
    });

    res.json({ message: `Deleted ${result.deletedCount} transaction(s)`, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET TRANSACTIONS BY DATETIME (auth required) */
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

    const transactions = await Transaction.find({
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* DELETE MULTIPLE TRANSACTIONS BY IDS (admin only, requires password) */
router.post("/delete-multiple", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const { ids, password } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required to confirm deletion" });
    }

    const admin = await User.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    const result = await Transaction.deleteMany({
      _id: { $in: ids },
    });

    res.json({ message: `Deleted ${result.deletedCount} transaction(s)`, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET TODAY'S TRANSACTIONS (auth required) */
router.get("/today", authMiddleware, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const transactions = await Transaction.find({
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
