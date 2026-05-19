import Staff from "../models/staff.js";

/* =========================
   GET ALL STAFF
========================= */

export const getStaff = async (req, res) => {
  try {
    // Fetch all staff members from the database
    const staff = await Staff.find();

    res.status(200).json(staff);
  } catch (err) {
    console.error("Error fetching staff:", err.message);
    res.status(500).json({
      message: "Failed to fetch staff members",
      error: err.message,
    });
  }
};