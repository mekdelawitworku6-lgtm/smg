import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Expense = sequelize.define(
  "Expense",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    amount: DataTypes.DOUBLE,
    paymentType: DataTypes.STRING,
    createdBy: DataTypes.STRING,
  },
  { timestamps: true }
);

export default Expense;