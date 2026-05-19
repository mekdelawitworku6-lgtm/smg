import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    name: String,
    amount: Number,
    paymentType: String,
    createdBy: String,
  },
  { timestamps: true }
);

// Safe pattern to prevent OverwriteModelError
export default mongoose.models.Expense || mongoose.model("Expense", expenseSchema);