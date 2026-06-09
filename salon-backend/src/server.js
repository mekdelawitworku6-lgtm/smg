import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import connectDB from "./config/db.js";
import User from "./models/User.model.js";

import authRoutes from "./routes/auth.routes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get("/api", (req, res) => {
  res.json({ message: "API is running", status: "ok" });
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/transactions", transactionRoutes);

// Debugging Catch-all for 404s
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found on this server.`,
  });
});

const PORT = process.env.PORT || 10000;

// Start server only after DB is connected
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Critical: Database connection failed", err.message);
    process.exit(1);
  });