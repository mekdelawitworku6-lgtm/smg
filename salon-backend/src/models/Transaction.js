import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    services: [
      {
        name: String,
        staff: String,
        price: Number,
        nonAsrat: Boolean,
      },
    ],
    total: Number,
    amount: Number,
    paymentType: { type: String, default: "cash" },
    paymentMethod: String,
    staff: String,
    tips: [
      {
        staff: String,
        amount: Number,
      },
    ],
  },
  { timestamps: true, strict: false }
);

export default mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
