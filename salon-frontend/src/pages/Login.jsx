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
  const [showPw, setShowPw] = useState(false);
  const [focus, setFocus] = useState("");
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

  useEffect(() => {
    document.documentElement.lang = lang === "am" ? "am" : "en";
  }, [lang]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!phone.trim()) {
      setLocalError(t("login.errorPhone"));
      return;
    }
    if (!password) {
      setLocalError(t("login.errorPassword"));
      return;
    }

    const result = await dispatch(loginUser({ phone, password }));

    if (loginUser.fulfilled.match(result)) {
      const role = result.payload?.role;
      if (role === "admin") navigate("/admin");
      else if (role === "cashier") navigate("/cashier");
    }
  };

  const inputStyle = (which) => ({
    ...styles.input,
    ...(focus === which ? styles.inputFocus : {}),
    ...(which === "password" ? { paddingRight: "70px" } : {}),
  });

  return (
    <div style={styles.wrapper}>
      <header style={styles.brand}>
        <svg
          viewBox="0 0 224 204"
          role="img"
          aria-label="WBS logo"
          style={styles.logo}
        >
          <defs>
            <linearGradient id="wbsGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#9a6b16" />
              <stop offset="0.4" stopColor="#e6c25f" />
              <stop offset="0.6" stopColor="#f3df95" />
              <stop offset="1" stopColor="#a97a22" />
            </linearGradient>
          </defs>
          <circle
            cx="112"
            cy="100"
            r="94"
            fill="none"
            stroke="url(#wbsGold)"
            strokeWidth="1.2"
          />
          <g transform="translate(0 6)">
            <path
              fill="url(#wbsGold)"
              opacity="0.9"
              d="M62 34C92 32 104 66 98 100C94 124 80 136 84 152C74 138 84 120 88 104C92 76 84 52 62 34Z"
            />
            <path
              fill="url(#wbsGold)"
              opacity="0.6"
              d="M68 32C100 36 110 68 104 100C100 122 92 134 96 146C86 136 90 124 94 108C98 80 90 54 68 32Z"
            />
            <g transform="translate(34 28) scale(0.85)">
              <path
                fill="url(#wbsGold)"
                stroke="#fff"
                strokeWidth="1.5"
                d="M40 4C30 6 24 14 22 26C22 29 23 31 22.5 33C20 37 16 41 16 43C16 45 19 45.5 22 45.5C21 47 20 49 20 50C21 51 23 51.5 23 52C21 52.5 20 54 20.5 55.5C21.5 57 24 57.5 24 59C24 62 22 65 23.5 67C25 70 30 71 33 70L36 90L50 94C48 84 50 72 53 62C58 42 54 14 40 4Z"
              />
              <path
                d="M27 35Q31 38 36 35"
                stroke="#fff"
                strokeWidth="1.4"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M28 36.5l-3 2M31 37.5l-1 3M34 37l.5 3"
                stroke="#fff"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </g>
            <path
              fill="url(#wbsGold)"
              stroke="#fff"
              strokeWidth="1.2"
              d="M56 92C74 96 82 120 84 152C68 142 58 120 52 102Z"
            />
            <path fill="url(#wbsGold)" d="M84 152L88 148L116 74L110 70Z" />
            <path fill="#141010" d="M108 72H126L142 146L134 152Z" />
            <path fill="url(#wbsGold)" d="M134 152L139 148L174 50L168 50Z" />
            <path fill="url(#wbsGold)" d="M158 46H186V50H158Z" />
          </g>
        </svg>
        <h1 style={styles.brandTitle}>{t("login.brand")}</h1>
        <p style={styles.brandTag}>{t("login.tag")}</p>
      </header>

      <section style={styles.card}>
        <button onClick={toggleLang} style={styles.langBtn} type="button">
          {t("lang.switch")}
        </button>
        <h2 style={styles.cardTitle}>{t("login.title")}</h2>
        <p style={styles.cardSub}>{t("login.subtitle")}</p>

        <form onSubmit={handleLogin}>
          <label style={styles.label}>{t("login.phoneLabel")}</label>
          <input
            placeholder={t("login.phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onFocus={() => setFocus("phone")}
            onBlur={() => setFocus("")}
            style={inputStyle("phone")}
            autoComplete="tel"
          />

          <label style={styles.label}>{t("login.passwordLabel")}</label>
          <div style={styles.field}>
            <input
              type={showPw ? "text" : "password"}
              placeholder={t("login.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocus("password")}
              onBlur={() => setFocus("")}
              style={inputStyle("password")}
              autoComplete="current-password"
            />
            <button
              type="button"
              style={styles.eye}
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? t("login.hidePw") : t("login.showPw")}
            >
              {showPw ? t("login.hidePw") : t("login.showPw")}
            </button>
          </div>

          <p
            style={{
              ...styles.msg,
              ...(localError ? styles.msgError : {}),
            }}
            role="status"
          >
            {localError}
          </p>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.cta,
              ...(loading ? styles.ctaDisabled : {}),
            }}
          >
            {loading ? t("login.signingIn") : t("login.signIn")}
          </button>
        </form>

        <p style={styles.footer}>{t("login.footer")}</p>
      </section>
    </div>
  );
}

const serif = '"Cormorant Garamond","Noto Sans Ethiopic",Georgia,serif';
const body = '"Jost","Noto Sans Ethiopic",system-ui,sans-serif';

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#fcf1f5",
    color: "#2a1a20",
    fontFamily: body,
    boxSizing: "border-box",
  },
  brand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    background: "linear-gradient(150deg,#d81b78,#ec4899 50%,#e0a94f)",
    borderRadius: "0 0 42px 42px",
    padding: "30px 16px 92px",
  },
  logo: {
    width: "130px",
    height: "130px",
    padding: "20px",
    background: "#fff",
    borderRadius: "50%",
    boxShadow: "0 12px 30px rgba(80,0,40,.3)",
    boxSizing: "border-box",
  },
  brandTitle: {
    margin: "12px 0 0",
    fontFamily: serif,
    color: "#fff",
    fontSize: "36px",
    lineHeight: "1.05",
    letterSpacing: ".04em",
    fontWeight: 600,
  },
  brandTag: {
    margin: "6px 0 0",
    color: "#fff",
    opacity: 0.92,
    fontSize: "13px",
    letterSpacing: ".32em",
  },
  card: {
    position: "relative",
    width: "calc(100% - 32px)",
    maxWidth: "420px",
    margin: "-58px auto 28px",
    background: "#fff",
    borderRadius: "28px",
    boxShadow: "0 18px 44px rgba(216,27,120,.14)",
    padding: "28px 24px 22px",
    boxSizing: "border-box",
  },
  langBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    border: "1px solid #d81b78",
    background: "none",
    color: "#d81b78",
    borderRadius: 99,
    padding: "5px 12px",
    fontSize: 13,
    cursor: "pointer",
    opacity: 0.85,
  },
  cardTitle: {
    margin: "0 0 4px",
    fontFamily: serif,
    fontSize: "22px",
    fontWeight: 600,
  },
  cardSub: {
    margin: "0 0 20px",
    fontSize: "14px",
    opacity: 0.7,
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    margin: "14px 0 6px",
  },
  field: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  input: {
    width: "100%",
    height: "50px",
    padding: "0 22px",
    boxSizing: "border-box",
    borderRadius: 99,
    border: "1px solid transparent",
    background: "#fdf1f5",
    color: "inherit",
    fontFamily: body,
    fontSize: "16px",
    outline: "none",
    transition: "border-color .2s, background .2s",
  },
  inputFocus: {
    borderColor: "#d81b78",
    background: "#fff",
  },
  eye: {
    position: "absolute",
    right: 12,
    height: 40,
    padding: "0 10px",
    border: 0,
    background: "none",
    color: "inherit",
    opacity: 0.65,
    cursor: "pointer",
    fontSize: 13,
  },
  cta: {
    width: "100%",
    height: "52px",
    marginTop: "4px",
    border: 0,
    borderRadius: 99,
    background: "linear-gradient(120deg,#d81b78,#ec4899)",
    color: "#fff",
    fontFamily: body,
    fontWeight: 600,
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(216,27,120,.3)",
    transition: "transform .15s, box-shadow .2s",
  },
  ctaDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  msg: {
    minHeight: "20px",
    margin: "12px 0 0",
    fontSize: "13px",
    textAlign: "center",
  },
  msgError: {
    color: "#d81b78",
    background: "rgba(216,27,120,.08)",
    borderRadius: 99,
    padding: "8px 14px",
  },
  footer: {
    marginTop: "16px",
    textAlign: "center",
    fontSize: 12,
    opacity: 0.55,
  },
};