import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const User = sequelize.define(
  "User",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
    },
    name: DataTypes.STRING,
    phone: { type: DataTypes.STRING, unique: true },
    password: DataTypes.STRING,
    role: {
      type: DataTypes.ENUM("admin", "cashier"),
      defaultValue: "cashier",
    },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { timestamps: true }
);

export default User;