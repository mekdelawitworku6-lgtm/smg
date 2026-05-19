import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../auth/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin") navigate("/admin");
    if (role === "cashier") navigate("/cashier");
  }, [navigate]);

  useEffect(() => {
    if (error) setLocalError(error);
  }, [error]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!phone.trim() || !password.trim()) {
      setLocalError("Please enter phone and password");
      return;
    }

    const result = await dispatch(loginUser({ phone, password }));

    if (loginUser.fulfilled.match(result)) {
      const role = result.payload?.role;
      if (role === "admin") navigate("/admin");
      else if (role === "cashier") navigate("/cashier");
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logo}>SMG</div>
          <h1 style={styles.title}>Salon Management</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Phone</label>
            <input
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          {localError && (
            <div style={styles.error}>{localError}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={styles.footer}>
          Salon Management System v1.0
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#101010",
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
  },
  card: {
    width: "380px",
    background: "#1b1b1b",
    border: "1px solid #333333",
    borderRadius: "12px",
    padding: "40px 32px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  brand: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logo: {
    width: "64px",
    height: "64px",
    margin: "0 auto 16px",
    background: "#d4af37",
    color: "#111",
    fontSize: "22px",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "16px",
    letterSpacing: 1,
  },
  title: {
    margin: 0,
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: 0,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#a3a3a3",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    color: "#cfcfcf",
    fontSize: "13px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    width: "100%",
    minHeight: "44px",
    padding: "0 14px",
    boxSizing: "border-box",
    background: "#111111",
    color: "#f5f5f5",
    border: "1px solid #3f3f3f",
    borderRadius: "8px",
    outline: "none",
    fontSize: "15px",
    transition: "border-color 0.2s",
  },
  button: {
    width: "100%",
    minHeight: "46px",
    background: "#d4af37",
    color: "#111111",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "4px",
  },
  buttonDisabled: {
    background: "#665522",
    color: "#999",
    cursor: "not-allowed",
  },
  error: {
    padding: "10px 14px",
    background: "#2b1414",
    border: "1px solid #6b2020",
    borderRadius: "8px",
    color: "#f5a0a0",
    fontSize: "13px",
    textAlign: "center",
  },
  footer: {
    textAlign: "center",
    color: "#555",
    fontSize: "12px",
    margin: "28px 0 0",
  },
};
