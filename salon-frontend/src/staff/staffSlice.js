import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../api/axios";

export const fetchStaff = createAsyncThunk("staff/fetchStaff", async (_, thunkAPI) => {
  try {
    const res = await API.get("/staff");
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch staff");
  }
});

const loadStaff = () => {
  try {
    return JSON.parse(localStorage.getItem("adminStaffList")) || [];
  } catch { return []; }
};

const staffSlice = createSlice({
  name: "staff",
  initialState: { apiList: [], localList: loadStaff(), loading: false, error: null },
  reducers: {
    setStaffList(state, action) {
      state.localList = action.payload;
      localStorage.setItem("adminStaffList", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaff.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStaff.fulfilled, (state, action) => { state.loading = false; state.apiList = action.payload; })
      .addCase(fetchStaff.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { setStaffList } = staffSlice.actions;
export default staffSlice.reducer;
