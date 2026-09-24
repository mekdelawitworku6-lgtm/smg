import Staff from "../models/staff.js";

export const getStaff = async (req, res) => {
  try {
    const staff = await Staff.findAll({ order: [["name", "ASC"]] });
    res.status(200).json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createStaff = async (req, res) => {
  try {
    const { name, role, photo, phone, accountNumber, salary } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    const staff = await Staff.create({ name, role, photo, phone, accountNumber, salary });
    res.status(201).json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const [count] = await Staff.update(req.body, { where: { _id: req.params.id } });
    if (!count) {
      return res.status(404).json({ message: "Staff not found" });
    }
    const staff = await Staff.findOne({ where: { _id: req.params.id } });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    await Staff.destroy({ where: { _id: req.params.id } });
    res.json({ message: "Staff deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};