import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: String,
    role: String,
  },
  { timestamps: true }
);

// Safe pattern to prevent OverwriteModelError
export default mongoose.models.Staff || mongoose.model("Staff", staffSchema);