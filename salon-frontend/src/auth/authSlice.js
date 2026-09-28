import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../api/axios";
import { storeLocalVerifier, verifyLocalCredentials } from "./localVerifier";

/* =========================
   LOGIN
========================= */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (data, thunkAPI) => {
    try {
      const res = await API.post("/auth/login", data);

      const { token, refreshToken, role, name } = res.data;

      if (!token) {
        console.error("[login] No token in response:", JSON.stringify(res.data));
        return thunkAPI.rejectWithValue("No token received");
      }

      localStorage.setItem("token", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("role", role);
      localStorage.setItem("name", name);

      await storeLocalVerifier(data.phone, data.password);

      return res.data;

    } catch (err) {
      const savedRole = localStorage.getItem("role");
      const savedName = localStorage.getItem("name");
      const token = localStorage.getItem("token");

      if (token && savedRole && (await verifyLocalCredentials(data.phone, data.password))) {
        return { token, role: savedRole, name: savedName, offline: true };
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