import Service from "../models/service.js";

/* =========================
   CREATE SERVICE
========================= */

export const createService =
  async (req, res) => {

    try {

      const {
        name,
        category,
        price,
        nonAsrat,
      } = req.body;

      if (!name || !category || price === "") {
        return res.status(400).json({
          message:
            "Name, category, and price are required",
        });
      }

      const service =
        await Service.create({
          name: name.trim(),
          category: category.trim(),
          price: Number(price),
          nonAsrat: Boolean(nonAsrat),
        });

      res.status(201).json(service);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  };

/* =========================
   GET SERVICES
========================= */

export const getServices =
  async (req, res) => {

    try {

      const services =
        await Service.find({
          active: true,
        }).sort({
          category: 1,
        });

      res.json(services);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  };

/* =========================
   UPDATE SERVICE
========================= */

export const updateService =
  async (req, res) => {

    try {
      const updates = {
        ...req.body,
      };

      if (updates.name) {
        updates.name = updates.name.trim();
      }

      if (updates.category) {
        updates.category = updates.category.trim();
      }

      if (updates.price !== undefined) {
        updates.price = Number(updates.price);
      }

      const service =
        await Service.findByIdAndUpdate(
          req.params.id,
          updates,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!service) {
        return res.status(404).json({
          message: "Service not found",
        });
      }

      res.json(service);

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  };

/* =========================
   DELETE SERVICE
========================= */

export const deleteService =
  async (req, res) => {

    try {

      await Service.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message:
          "Service deleted",
      });

    } catch (err) {

      res.status(500).json({
        message: err.message,
      });
    }
  };
