import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Staff = sequelize.define(
  "Staff",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: "" },
    photo: { type: DataTypes.STRING, defaultValue: "" },
    phone: { type: DataTypes.STRING, defaultValue: "" },
    accountNumber: { type: DataTypes.STRING, defaultValue: "" },
    salary: { type: DataTypes.DOUBLE, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { timestamps: true }
);

export default Staff;