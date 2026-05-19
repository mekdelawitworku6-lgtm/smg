import express from "express";

import {
  syncTransactions,
} from "../controllers/sync.controller.js";

const router = express.Router();

router.post("/transactions", syncTransactions);

export default router;