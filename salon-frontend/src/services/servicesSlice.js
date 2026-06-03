import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../api/axios";

export const fetchServices = createAsyncThunk("services/fetchServices", async (_, thunkAPI) => {
  try {
    const res = await API.get("/services");
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch services");
  }
});

const loadLocal = () => {
  try {
    const data = JSON.parse(localStorage.getItem("adminLocalServices"));
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

const servicesSlice = createSlice({
  name: "services",
  initialState: { apiList: [], localList: loadLocal(), loading: false, error: null },
  reducers: {
    setLocalServices(state, action) {
      state.localList = action.payload;
      localStorage.setItem("adminLocalServices", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchServices.fulfilled, (state, action) => { state.loading = false; state.apiList = action.payload; })
      .addCase(fetchServices.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { setLocalServices } = servicesSlice.actions;
export default servicesSlice.reducer;
