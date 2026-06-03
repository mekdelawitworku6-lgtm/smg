import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../api/axios";

/* =========================
   LOGIN
========================= */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (data, thunkAPI) => {
    try {
      const res = await API.post("/auth/login", data);

      const { token, role, name } = res.data;

      if (!token) {
        return thunkAPI.rejectWithValue("No token received");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("name", name);
      localStorage.setItem("phone", data.phone);
      localStorage.setItem("password", data.password);

      return res.data;

    } catch (err) {
      const savedPhone = localStorage.getItem("phone");
      const savedPassword = localStorage.getItem("password");
      const savedRole = localStorage.getItem("role");
      const savedName = localStorage.getItem("name");

      if (savedPhone === data.phone && savedPassword === data.password && savedRole) {
        return { token: localStorage.getItem("token"), role: savedRole, name: savedName, offline: true };
      }

      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Login failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.clear();
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;