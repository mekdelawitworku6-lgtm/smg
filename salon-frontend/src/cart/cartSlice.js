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
      const item = { ...action.payload, nonAsrat: false };
      state.items.push(item);

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

    toggleItemNonAsrat: (state, action) => {
      const index = action.payload;
      if (state.items[index]) {
        state.items[index].nonAsrat = !state.items[index].nonAsrat;
      }
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
  toggleItemNonAsrat,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;