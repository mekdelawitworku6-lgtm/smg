import { configureStore } from "@reduxjs/toolkit";

import cartReducer from "../cart/cartSlice";
import authReducer from "../auth/authSlice";
import transactionReducer from "../transactions/transactionSlice";
import servicesReducer from "../services/servicesSlice";
import staffReducer from "../staff/staffSlice";
import categoriesReducer from "../categories/categoriesSlice";
import sessionReducer from "../session/sessionSlice";
import dayReducer from "../day/daySlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer,
    transactions: transactionReducer,
    services: servicesReducer,
    staff: staffReducer,
    categories: categoriesReducer,
    session: sessionReducer,
    day: dayReducer,
  },
});