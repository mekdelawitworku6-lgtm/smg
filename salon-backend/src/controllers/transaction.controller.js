import asyncHandler from "express-async-handler";
import { v4 as uuidv4 } from "uuid";
import Transaction from "../models/Transaction.model.js";

export const createTransaction = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    uuid: req.body.uuid || uuidv4(),
  };

  if (!payload.paymentType) {
    return res.status(400).json({ message: "paymentType is required" });
  }

  if (payload.amount == null && payload.price == null) {
    return res.status(400).json({ message: "amount or price is required" });
  }

  if (payload.amount == null) {
    payload.amount = payload.price;
  }

  if (payload.price == null) {
    payload.price = payload.amount;
  }

  const transaction = await Transaction.create(payload);

  res.status(201).json({
    success: true,
    transaction,
  });
});

export const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: transactions.length,
    transactions,
  });
});
