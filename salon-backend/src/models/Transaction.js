import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Transaction = sequelize.define(
  "Transaction",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    uuid: { type: DataTypes.STRING },
    offlineId: { type: DataTypes.STRING },
    services: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    total: { type: DataTypes.DOUBLE },
    amount: { type: DataTypes.DOUBLE },
    tip: { type: DataTypes.DOUBLE, defaultValue: 0 },
    tips: { type: DataTypes.JSONB, defaultValue: [] },
    paymentType: { type: DataTypes.STRING, defaultValue: "cash" },
    paymentMethod: { type: DataTypes.STRING },
    staff: { type: DataTypes.STRING },
  },
  { timestamps: true }
);

export default Transaction;