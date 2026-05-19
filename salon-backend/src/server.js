import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import syncRoutes from "./routes/sync.routes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import staffRoutes from "./routes/staffRoutes.js"; // FIX: Import staff routes

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// DB connect
connectDB().then(() => {
  console.log("Database initialized for routes");
}).catch((err) => {
  console.error("Critical: Database connection failed", err.message);
  process.exit(1);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/staff", staffRoutes); // FIX: Register staff routes

// Debugging Catch-all for 404s
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found on this server.`,
  });
});

const PORT = process.env.PORT || 3000;

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