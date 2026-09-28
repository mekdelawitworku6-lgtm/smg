import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../services/token.service.js";
import { Op } from "sequelize";

const router = express.Router();

const WITHOUT_PASSWORD = { attributes: { exclude: ["password"] } };

/* =========================
   NO PUBLIC REGISTRATION
   Accounts are provisioned
   by an authenticated admin
   via POST /auth/cashiers
   and POST /auth/admins.
   The first admin is created
   by the idempotent seed on
   server boot (seed.js).
========================= */

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

    const user = await User.findOne({ where: { phone } });

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

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Wrong password",
      });
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      token,
      refreshToken,
      role: user.role,
      name: user.name,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   REFRESH ACCESS TOKEN
   Used to recover the session
   after a long offline stretch
========================= */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "refreshToken is required" });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      const message =
        err.name === "TokenExpiredError" ? "refresh token expired" : "refresh token invalid";
      return res.status(401).json({ message });
    }

    const user = await User.findOne({
      where: { _id: decoded.id },
      ...WITHOUT_PASSWORD,
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.active === false) {
      return res.status(403).json({
        message: "Account deactivated. Contact admin.",
      });
    }

    res.json({
      token: generateAccessToken(user),
      refreshToken: generateRefreshToken(user),
      role: user.role,
      name: user.name,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   ADMIN MANAGEMENT (ADMIN ONLY)
   The only way to mint an
   admin after the initial
   seed. Role is hard-coded,
   never taken from the body.
========================= */

/* GET ALL ADMINS */
router.get("/admins", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    const admins = await User.findAll({
      where: { role: "admin" },
      ...WITHOUT_PASSWORD,
      order: [["createdAt", "DESC"]],
    });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* CREATE ADMIN */
router.post("/admins", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res
        .status(400)
        .json({ message: "Name, phone, and password required" });
    }
    const existing = await User.findOne({ where: { phone } });
    if (existing) {
      return res.status(400).json({ message: "Phone number already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name,
      phone,
      password: hashed,
      role: "admin",
    });
    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      phone: admin.phone,
      role: admin.role,
      active: admin.active,
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
    const cashiers = await User.findAll({
      where: { role: "cashier" },
      ...WITHOUT_PASSWORD,
      order: [["createdAt", "DESC"]],
    });
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
    const existing = await User.findOne({ where: { phone } });
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
      const dup = await User.findOne({ where: { phone, _id: { [Op.ne]: req.params.id } } });
      if (dup) return res.status(400).json({ message: "Phone number already in use" });
      update.phone = phone;
    }
    const [count] = await User.update(update, { where: { _id: req.params.id } });
    if (!count) return res.status(404).json({ message: "Cashier not found" });
    const cashier = await User.findOne({ where: { _id: req.params.id }, ...WITHOUT_PASSWORD });
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
    await User.update({ password: hashed }, { where: { _id: req.params.id } });
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
    const [count] = await User.update(update, {
      where: { phone: req.params.phone, role: "cashier" },
    });
    if (!count) return res.status(404).json({ message: "Cashier not found" });
    const cashier = await User.findOne({ where: { phone: req.params.phone, role: "cashier" }, ...WITHOUT_PASSWORD });
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
    const cashier = await User.findOne({ where: { _id: req.params.id } });
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

    const duplicate = await User.findOne({ where: { phone, _id: { [Op.ne]: req.user.id } } });
    if (duplicate) return res.status(400).json({ message: "Phone number already in use" });

    const [count] = await User.update({ phone }, { where: { _id: req.user.id } });
    if (!count) return res.status(404).json({ message: "Admin user not found" });

    const user = await User.findOne({ where: { _id: req.user.id }, ...WITHOUT_PASSWORD });
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

    const user = await User.findOne({ where: { _id: req.user.id } });
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