import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import  LoginPage
from "../pages/Login";

import CashierDashboard
from "../pages/CashireDashboard";

import AdminDashboard
from "../pages/AdminDashboard";

import ProtectedRoute
from "../components/ProtectedRoute";

export default function AppRoutes() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<LoginPage />}
        />

        {/* CASHIER */}

        <Route
          path="/cashier"

          element={
            <ProtectedRoute role="cashier">

              <CashierDashboard />

            </ProtectedRoute>
          }
        />

        {/* ADMIN */}

        <Route
          path="/admin"

          element={
            <ProtectedRoute role="admin">

              <AdminDashboard />

            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}

        <Route
          path="*"
          element={<Navigate to="/" />}
        />

      </Routes>

    </BrowserRouter>
  );
}