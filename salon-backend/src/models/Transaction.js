import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },

    // 🔥 IMPORTANT: staff per service
    staff: { type: String, required: true },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
    },

    services: [serviceSchema],

    total: {
      type: Number,
      required: true,
    },

    paymentType: {
      type: String,
      required: true,
      enum: ["cash", "card", "telebirr"],
    },

    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Safe pattern to prevent OverwriteModelError
export default mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);