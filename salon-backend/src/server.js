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

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/staff", staffRoutes);

// Debugging Catch-all for 404s
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found on this server.`,
  });
});

const PORT = process.env.PORT || 4000;

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