import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =========================
   REGISTER (TEST ONLY)
========================= */
router.post("/register", async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: "Phone is required",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      phone,
      password: hashedPassword,
      role,
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   LOGIN (MAIN FIX HERE)
========================= */
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    console.log("LOGIN BODY:", req.body);

    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone and password required",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    if (user.active === false) {
      return res.status(403).json({
        message: "Account deactivated. Contact admin.",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Wrong password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      name: user.name,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   CASHIER MANAGEMENT (ADMIN ONLY)
========================= */

/* GET ALL CASHIERS */
router.get("/cashiers", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    const cashiers = await User.find({ role: "cashier" }).select("-password").sort({ createdAt: -1 });
    res.json(cashiers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* CREATE CASHIER */
router.post("/cashiers", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ message: "Name, phone, and password required" });
    }
    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: "Phone number already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const cashier = await User.create({ name, phone, password: hashed, role: "cashier" });
    res.status(201).json({ _id: cashier._id, name: cashier.name, phone: cashier.phone, role: cashier.role, active: cashier.active });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* UPDATE CASHIER (name, phone) */
router.put("/cashiers/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    const { name, phone } = req.body;
    const update = {};
    if (name) update.name = name;
    if (phone) {
      const dup = await User.findOne({ phone, _id: { $ne: req.params.id } });
      if (dup) return res.status(400).json({ message: "Phone number already in use" });
      update.phone = phone;
    }
    const cashier = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    if (!cashier) return res.status(404).json({ message: "Cashier not found" });
    res.json(cashier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* RESET PASSWORD */
router.put("/cashiers/:id/reset-password", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Password required" });
    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.params.id, { password: hashed });
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* UPDATE CASHIER BY PHONE (used when editing staff) */
router.put("/cashiers/by-phone/:phone", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    const { name, phone } = req.body;
    const update = {};
    if (name) update.name = name;
    if (phone) update.phone = phone;
    const cashier = await User.findOneAndUpdate(
      { phone: req.params.phone, role: "cashier" },
      update,
      { new: true }
    ).select("-password");
    if (!cashier) return res.status(404).json({ message: "Cashier not found" });
    res.json(cashier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* TOGGLE ACTIVE / DEACTIVATE */
router.put("/cashiers/:id/toggle-active", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    const cashier = await User.findById(req.params.id);
    if (!cashier) return res.status(404).json({ message: "Cashier not found" });
    cashier.active = !cashier.active;
    await cashier.save();
    res.json({ _id: cashier._id, name: cashier.name, active: cashier.active });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   ADMIN - Update own phone
   PUT /auth/me
========================= */
router.put("/me", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone is required" });

    const duplicate = await User.findOne({ phone, _id: { $ne: req.user.id } });
    if (duplicate) return res.status(400).json({ message: "Phone number already in use" });

    const user = await User.findByIdAndUpdate(req.user.id, { phone }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "Admin user not found" });

    res.json({ message: "Phone updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   ADMIN - Change own password
   PUT /auth/me/password
   body: { currentPassword, newPassword }
========================= */
router.put("/me/password", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "currentPassword and newPassword are required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Admin user not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;