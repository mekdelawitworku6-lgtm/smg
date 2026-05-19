import express from "express";
const router = express.Router();

// Sample route
router.post("/register", (req, res) => {
  res.status(201).json({ message: "Registration route working" });
});

export default router;