import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../auth/authSlice";
import { useTranslation } from "../i18n/LanguageContext";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const { t, toggleLang, lang } = useTranslation();

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

  useEffect(() => {
    setLocalError("");
  }, [phone, password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!phone.trim() || !password.trim()) {
      setLocalError(t("login.errorEmpty"));
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
        <button onClick={toggleLang} style={styles.langBtn}>
          {t("lang.switch")}
        </button>
        <div style={styles.brand}>
          <div style={styles.logo}>WBS</div>
          <h1 style={styles.title}>{t("login.title")}</h1>
          <p style={styles.subtitle}>{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>{t("login.phoneLabel")}</label>
            <input
              placeholder={t("login.phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
              autoComplete="tel"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>{t("login.passwordLabel")}</label>
            <input
              type="password"
              placeholder={t("login.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoComplete="current-password"
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
            {loading ? t("login.signingIn") : t("login.signIn")}
          </button>
        </form>

        <p style={styles.footer}>
          {t("login.footer")}
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
    background: "var(--bg-body)",
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
  },
  card: {
    width: "380px",
    background: "var(--bg-card)",
    border: "1px solid var(--color-primary-light)",
    borderRadius: "12px",
    padding: "40px 32px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
    position: "relative",
  },
  brand: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logo: {
    width: "64px",
    height: "64px",
    margin: "0 auto 16px",
    background: "var(--color-primary-light)",
    color: "var(--color-primary)",
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
    color: "var(--text-primary)",
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: 0,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "var(--text-secondary)",
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
    color: "var(--text-primary)",
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
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    border: "1px solid var(--color-primary-light)",
    borderRadius: "8px",
    outline: "none",
    fontSize: "15px",
    transition: "border-color 0.2s",
  },
  button: {
    width: "100%",
    minHeight: "46px",
    background: "var(--color-primary)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "4px",
  },
  buttonDisabled: {
    background: "var(--color-primary-light)",
    color: "var(--text-muted)",
    cursor: "not-allowed",
  },
  error: {
    padding: "10px 14px",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "8px",
    color: "var(--color-danger)",
    fontSize: "13px",
    textAlign: "center",
  },
  footer: {
    textAlign: "center",
    color: "var(--text-secondary)",
    fontSize: "12px",
    margin: "28px 0 0",
  },
  langBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    background: "none",
    border: "1px solid var(--color-primary-light)",
    color: "var(--color-primary)",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
};
