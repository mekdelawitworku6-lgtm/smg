import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

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

export default router;