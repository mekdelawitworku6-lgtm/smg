import Service from "../models/service.js";

/* =========================
   CREATE SERVICE
========================= */

export const createService = async (req, res) => {
  try {
    const { name, category, price, nonAsrat } = req.body;

    if (!name || !category || price === "") {
      return res.status(400).json({
        message: "Name, category, and price are required",
      });
    }

    const service = await Service.create({
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      nonAsrat: Boolean(nonAsrat),
    });

    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET SERVICES
========================= */

export const getServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { active: true },
      order: [["category", "ASC"]],
    });

    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   UPDATE SERVICE
========================= */

export const updateService = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.name) {
      updates.name = updates.name.trim();
    }

    if (updates.category) {
      updates.category = updates.category.trim();
    }

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }

    const [count] = await Service.update(updates, { where: { _id: req.params.id } });

    if (!count) {
      return res.status(404).json({ message: "Service not found" });
    }

    const service = await Service.findOne({ where: { _id: req.params.id } });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   DELETE SERVICE
========================= */

export const deleteService = async (req, res) => {
  try {
    await Service.destroy({ where: { _id: req.params.id } });
    res.json({ message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};