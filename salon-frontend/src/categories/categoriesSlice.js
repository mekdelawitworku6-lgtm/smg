import { createSlice } from "@reduxjs/toolkit";

const DEFAULT_CATEGORIES = ["Spa", "Hair", "Nails", "Makeup"];

const load = () => {
  try {
    return JSON.parse(localStorage.getItem("adminCategories")) || DEFAULT_CATEGORIES;
  } catch { return DEFAULT_CATEGORIES; }
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState: { list: load() },
  reducers: {
    setCategories(state, action) {
      state.list = action.payload;
      localStorage.setItem("adminCategories", JSON.stringify(action.payload));
    },
    addCategory(state, action) {
      const name = action.payload.trim();
      if (!name || state.list.includes(name)) return;
      state.list.push(name);
      localStorage.setItem("adminCategories", JSON.stringify(state.list));
    },
    renameCategory(state, action) {
      const { oldName, newName } = action.payload;
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;
      state.list = state.list.map((c) => (c === oldName ? trimmed : c));
      localStorage.setItem("adminCategories", JSON.stringify(state.list));
    },
    deleteCategory(state, action) {
      state.list = state.list.filter((c) => c !== action.payload);
      localStorage.setItem("adminCategories", JSON.stringify(state.list));
    },
  },
});

export const { setCategories, addCategory, renameCategory, deleteCategory } = categoriesSlice.actions;
export default categoriesSlice.reducer;
