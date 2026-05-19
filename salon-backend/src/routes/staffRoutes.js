import express from "express";
import { getStaff } from "../controllers/staffController.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =========================
   GET ALL STAFF
   (Requires authentication)
========================= */
router.get(
  "/",
  authMiddleware, // Protect this route
  getStaff
);

export default router;