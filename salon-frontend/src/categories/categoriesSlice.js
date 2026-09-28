import { createSlice } from "@reduxjs/toolkit";

const DEFAULT_CATEGORIES = [
  "የፀጉር አሰራር እና ዊግ",
  "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ",
  "የፀጉር ቀለም እና ሃይላይት",
  "ሜካፕ፣ ቅንድብ እና የፊት እንክብካቤ",
  "ጥፍር እና የእጅ/እግር እንክብካቤ",
  "ወይባ ጢስ",
];

const CATEGORIES_VERSION = "v2";
const STORAGE_KEY = "adminCategories";
const VERSION_KEY = "adminCategoriesVersion";

const load = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (localStorage.getItem(VERSION_KEY) === CATEGORIES_VERSION && Array.isArray(stored)) {
      return stored;
    }
  } catch { /* fall through to defaults */ }

  // Stale cache from the previous price list: drop it so the old
  // categories do not linger in the admin dropdown.
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(VERSION_KEY, CATEGORIES_VERSION);
  } catch { /* private mode */ }

  return DEFAULT_CATEGORIES;
};

const persist = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem(VERSION_KEY, CATEGORIES_VERSION);
  } catch { /* private mode */ }
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState: { list: load() },
  reducers: {
    setCategories(state, action) {
      state.list = action.payload;
      persist(state.list);
    },
    addCategory(state, action) {
      const name = action.payload.trim();
      if (!name || state.list.includes(name)) return;
      state.list.push(name);
      persist(state.list);
    },
    renameCategory(state, action) {
      const { oldName, newName } = action.payload;
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;
      state.list = state.list.map((c) => (c === oldName ? trimmed : c));
      persist(state.list);
    },
    deleteCategory(state, action) {
      state.list = state.list.filter((c) => c !== action.payload);
      persist(state.list);
    },
    resetCategories(state) {
      state.list = [...DEFAULT_CATEGORIES];
      persist(state.list);
    },
  },
});

export { DEFAULT_CATEGORIES };
export const { setCategories, addCategory, renameCategory, deleteCategory, resetCategories } = categoriesSlice.actions;
export default categoriesSlice.reducer;
