import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema(
  {
    uuid: { type: String, default: uuidv4, unique: true },
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

export default mongoose.models.User || mongoose.model("User", userSchema);