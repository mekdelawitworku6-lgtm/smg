import { useState } from "react";
import API from "../../api/axios";

export default function SettingsView() {
  const [phone, setPhone] = useState(localStorage.getItem("phone") || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);

  const handleClearCache = () => {
    if (!window.confirm("Clear all cached data? This will reset offline services, staff, and categories.")) return;
    localStorage.removeItem("adminLocalServices");
    localStorage.removeItem("adminStaffList");
    localStorage.removeItem("adminCategories");
    localStorage.removeItem("dailySummaries");
    showMsg("Cache cleared. Reloading...");
    setTimeout(() => window.location.reload(), 1000);
  };

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return showMsg("Phone number is required", "error");
    if (currentPassword && newPassword.length < 6)
      return showMsg("New password must be at least 6 characters", "error");
    setSaving(true);
    try {
      if (phone !== localStorage.getItem("phone")) {
        const phoneRes = await API.put("/auth/me", { phone });
        localStorage.setItem("phone", phone);
      }
      if (currentPassword && newPassword) {
        await API.put("/auth/me/password", {
          currentPassword,
          newPassword,
        });
        setCurrentPassword("");
        setNewPassword("");
      }
      showMsg("Settings saved successfully");
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const card = {
    background: "var(--bg-card)",
    borderRadius: 12,
    padding: 28,
    maxWidth: 480,
    margin: "0 auto",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    border: "1px solid var(--border-color)",
  };

  const label = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const input = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 15,
    border: "1px solid var(--border-color)",
    borderRadius: 8,
    background: "var(--bg-body)",
    color: "var(--text-primary)",
    outline: "none",
    boxSizing: "border-box",
  };

  const btn = {
    width: "100%",
    marginTop: 24,
    padding: "12px 28px",
    fontSize: 15,
    fontWeight: 600,
    border: "none",
    borderRadius: 8,
    background: "var(--color-primary)",
    color: "#fff",
    cursor: "pointer",
  };

  const divider = {
    height: 1,
    background: "var(--border-color)",
    margin: "24px 0",
  };

  return (
    <div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 6,
          textAlign: "center",
        }}
      >
        Settings
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          marginBottom: 28,
          textAlign: "center",
        }}
      >
        Update your phone number or password
      </p>

      {message.text && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 20,
            maxWidth: 480,
            marginLeft: "auto",
            marginRight: "auto",
            fontSize: 14,
            fontWeight: 500,
            textAlign: "center",
            background:
              message.type === "error"
                ? "rgba(239,68,68,0.1)"
                : "rgba(16,185,129,0.1)",
            color:
              message.type === "error"
                ? "var(--red-danger)"
                : "var(--teal-success)",
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} style={card}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          Account
        </h3>

        <label style={label}>Phone Number</label>
        <input
          style={input}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div style={divider} />

        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          Password
        </h3>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>Current Password</label>
          <input
            type="password"
            style={input}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label style={label}>New Password</label>
          <input
            type="password"
            style={input}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            ...btn,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Updating..." : "Update"}
        </button>
      </form>

      <div style={{ ...card, marginTop: 24, textAlign: "center" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--color-danger)" }}>
          Danger Zone
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          Clear locally cached services, staff, and categories data
        </p>
        <button
          onClick={handleClearCache}
          style={{
            padding: "12px 28px",
            fontSize: 15,
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            background: "var(--color-danger)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
}
