import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  total: 0,
};

const cartSlice = createSlice({
  name: "cart",

  initialState,

  reducers: {

    addToCart: (state, action) => {

      state.items.push(action.payload);

      state.total = state.items.reduce(
        (acc, item) => acc + item.price,
        0
      );
    },

    removeFromCart: (state, action) => {

      state.items = state.items.filter(
        (_, index) => index !== action.payload
      );

      state.total = state.items.reduce(
        (acc, item) => acc + item.price,
        0
      );
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;