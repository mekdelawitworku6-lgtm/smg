import express from "express";

import {
  createService,
  getServices,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";

// FIX: Must use named import to match the 'export const authMiddleware' in the middleware file
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =========================
   CREATE
========================= */

router.post(
  "/",
  authMiddleware,
  createService
);

/* =========================
   GET ALL
========================= */

router.get(
  "/",
  getServices
);

/* =========================
   UPDATE
========================= */

router.put(
  "/:id",
  authMiddleware,
  updateService
);

/* =========================
   DELETE
========================= */

router.delete(
  "/:id",
  authMiddleware,
  deleteService
);

export default router;
