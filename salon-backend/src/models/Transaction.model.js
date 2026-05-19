import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },

    serviceName: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      trim: true,
    },

    serviceSnapshot: {
      name: {
        type: String,
        trim: true,
      },

      price: {
        type: Number,
      },
    },

    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    cashierName: {
      type: String,
      trim: true,
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },

    staffName: {
      type: String,
      trim: true,
    },

    amount: {
      type: Number,
    },

    price: {
      type: Number,
    },

    paymentType: {
      type: String,
      enum: ["cash", "card", "mobile", "Cash", "CBE", "Telebirr", "Aisinya"],
      required: true,
    },

    status: {
      type: String,
      enum: ["created", "paid", "completed", "cancelled"],
      default: "paid",
    },

    cancelReason: {
      type: String,
    },

    isSynced: {
      type: Boolean,
      default: false,
    },

    synced: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Safe pattern to prevent OverwriteModelError
export default mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
