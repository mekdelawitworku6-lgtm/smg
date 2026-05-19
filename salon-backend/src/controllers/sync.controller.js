import asyncHandler from "express-async-handler";
import Transaction from "../models/Transaction.model.js";


// SYNC TRANSACTIONS
export const syncTransactions = asyncHandler(
  async (req, res) => {
    const { transactions } = req.body;

    if (!Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: "transactions must be an array",
      });
    }

    let saved = 0;
    let ignored = 0;

    for (const item of transactions) {

      const exists = await Transaction.findOne({
        uuid: item.uuid,
      });

      if (exists) {
        ignored++;
        continue;
      }

      const payload = {
        ...item,
        isSynced: true,
        synced: true,
      };

      if (payload.amount == null && payload.price != null) {
        payload.amount = payload.price;
      }

      if (payload.price == null && payload.amount != null) {
        payload.price = payload.amount;
      }

      await Transaction.create(payload);

      saved++;
    }

    res.status(200).json({
      success: true,
      saved,
      ignored,
    });
  }
);
