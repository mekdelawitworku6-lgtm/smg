import {
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";

import API from "../api/axios";

/* =========================
   GET TRANSACTIONS
========================= */

export const getTransactions =
  createAsyncThunk(

    "transactions/getTransactions",

    async (_, thunkAPI) => {

      try {

        const res =
          await API.get("/transactions");

        return res.data;

      } catch (err) {

        return thunkAPI.rejectWithValue(
          err.response?.data?.message ||
          "Failed to fetch transactions"
        );
      }
    }
  );

/* =========================
   CREATE TRANSACTION
========================= */

export const createTransaction =
  createAsyncThunk(

    "transactions/createTransaction",

    async (data, thunkAPI) => {

      try {

        const res =
          await API.post(
            "/transactions",
            data
          );

        return res.data;

      } catch (err) {

        return thunkAPI.rejectWithValue(
          err.response?.data?.message ||
          "Failed to create transaction"
        );
      }
    }
  );

/* =========================
   UPDATE TRANSACTION
========================= */

export const updateTransaction =
  createAsyncThunk(

    "transactions/updateTransaction",

    async ({ id, data }, thunkAPI) => {

      try {

        const res =
          await API.put(
            `/transactions/${id}`,
            data
          );

        return res.data;

      } catch (err) {

        return thunkAPI.rejectWithValue(
          err.response?.data?.message ||
          "Failed to update transaction"
        );
      }
    }
  );

/* =========================
   TRANSACTION SLICE
========================= */

const transactionSlice = createSlice({
  name: "transactions",

  initialState: {
    list: [],
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {

    builder

      /* =========================
         GET
      ========================= */

      .addCase(
        getTransactions.pending,
        (state) => {

          state.loading = true;

          state.error = null;
        }
      )

      .addCase(
        getTransactions.fulfilled,
        (state, action) => {

          state.loading = false;

          state.list = Array.isArray(action.payload) 
            ? action.payload 
            : (action.payload.transactions || []);
        }
      )

      .addCase(
        getTransactions.rejected,
        (state, action) => {

          state.loading = false;

          state.error = action.payload;
        }
      )

      /* =========================
         CREATE
      ========================= */

      .addCase(
        createTransaction.pending,
        (state) => {

          state.loading = true;

          state.error = null;
        }
      )

      .addCase(
        createTransaction.fulfilled,
        (state, action) => {

          state.loading = false;

          state.list.unshift(
            action.payload.transaction ||
            action.payload
          );
        }
      )

      .addCase(
        createTransaction.rejected,
        (state, action) => {

          state.loading = false;

          state.error = action.payload;
        }
      )

      /* =========================
         UPDATE
      ========================= */

      .addCase(
        updateTransaction.pending,
        (state) => {

          state.loading = true;

          state.error = null;
        }
      )

      .addCase(
        updateTransaction.fulfilled,
        (state, action) => {

          state.loading = false;

          const updatedTransaction =
            action.payload.transaction ||
            action.payload;

          const index =
            state.list.findIndex(
              (t) =>
                t._id ===
                updatedTransaction._id
            );

          if (index !== -1) {

            state.list[index] =
              updatedTransaction;
          }
        }
      )

      .addCase(
        updateTransaction.rejected,
        (state, action) => {

          state.loading = false;

          state.error = action.payload;
        }
      );
  },
});

export default transactionSlice.reducer;