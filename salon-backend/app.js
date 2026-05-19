import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./src/routes/auth.routes.js";
import transactionRoutes from "./src/routes/transaction.routes.js";
import syncRoutes from "./src/routes/sync.routes.js";
import serviceRoutes from "./src/routes/serviceRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.get("/", (req, res) => {
  res.json({
    message: "Salon Backend API is running 🚀",
  });
});

app.use("/api/transactions", transactionRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reports", reportRoutes);

export default app;
