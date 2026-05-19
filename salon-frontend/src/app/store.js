import { configureStore } from "@reduxjs/toolkit";

import cartReducer from "../cart/cartSlice";
import authReducer from "../auth/authSlice";
import transactionReducer from "../transactions/transactionSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer,
    transactions: transactionReducer,
  },
});