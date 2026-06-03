import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    phone: { type: String, unique: true },
    password: String,
    role: {
      type: String,
      enum: ["admin", "cashier"],
      default: "cashier",
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Safe pattern to prevent OverwriteModelError
export default mongoose.models.User || mongoose.model("User", userSchema);