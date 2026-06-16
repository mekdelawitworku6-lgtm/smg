import { useState } from "react";
import API from "../../api/axios";

export default function SettingsView() {
  const [phone, setPhone] = useState(localStorage.getItem("phone") || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);

  const [delDatetime, setDelDatetime] = useState("");
  const [delPassword, setDelPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [foundTransactions, setFoundTransactions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearchTransactions = async () => {
    if (!delDatetime) return showMsg("Select a date and time first", "error");
    setSearching(true);
    setSearched(true);
    setFoundTransactions([]);
    setSelectedIds([]);
    try {
      const res = await API.get(`/transactions/by-datetime?datetime=${encodeURIComponent(delDatetime)}`);
      setFoundTransactions(res.data || []);
      if (!res.data || res.data.length === 0) {
        showMsg("No transactions found at this time", "error");
      }
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed to search transactions", "error");
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === foundTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(foundTransactions.map((t) => t._id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return showMsg("Select at least one transaction", "error");
    if (!delPassword) return showMsg("Enter your password to confirm", "error");
    const msg = `Delete ${selectedIds.length} selected transaction(s)?\n\nThis action cannot be undone!`;
    if (!window.confirm(msg)) return;
    setDeleting(true);
    try {
      const res = await API.post("/transactions/delete-multiple", {
        ids: selectedIds,
        password: delPassword,
      });
      showMsg(res.data.message || "Deleted successfully");
      setDelPassword("");
      setFoundTransactions([]);
      setSelectedIds([]);
      setSearched(false);
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed to delete transactions", "error");
    } finally {
      setDeleting(false);
    }
  };

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
        await API.put("/auth/me", { phone });
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

  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, textAlign: "center" }}>
        Settings
      </h2>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28, textAlign: "center" }}>
        Update your phone number or password
      </p>

      {message.text && (
        <div style={{
          padding: "10px 16px", borderRadius: 8, marginBottom: 20, maxWidth: 480,
          marginLeft: "auto", marginRight: "auto", fontSize: 14, fontWeight: 500, textAlign: "center",
          background: message.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
          color: message.type === "error" ? "var(--red-danger)" : "var(--teal-success)",
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} style={card}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Account</h3>

        <label style={label}>Phone Number</label>
        <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} />

        <div style={divider} />

        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Password</h3>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>Current Password</label>
          <input type="password" style={input} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label style={label}>New Password</label>
          <input type="password" style={input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>

        <button type="submit" disabled={saving} style={{ ...btn, opacity: saving ? 0.6 : 1 }}>
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
        <button onClick={handleClearCache} style={{
          padding: "12px 28px", fontSize: 15, fontWeight: 600, border: "none", borderRadius: 8,
          background: "var(--color-danger)", color: "#fff", cursor: "pointer",
        }}>
          Clear Cache
        </button>
      </div>

      <div style={{ ...card, marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--color-danger)" }}>
          Delete Transactions
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          Search transactions by date & time, then select which ones to delete permanently.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>Date & Time</label>
          <input type="datetime-local" style={input} value={delDatetime} onChange={(e) => { setDelDatetime(e.target.value); setSearched(false); setFoundTransactions([]); setSelectedIds([]); }} />
        </div>

        <button onClick={handleSearchTransactions} disabled={searching || !delDatetime} style={{
          width: "100%", padding: "12px 28px", fontSize: 15, fontWeight: 600, border: "none", borderRadius: 8,
          background: !delDatetime ? "var(--border-color)" : "var(--color-primary)",
          color: !delDatetime ? "var(--text-muted)" : "#fff",
          cursor: !delDatetime ? "not-allowed" : "pointer",
          opacity: searching ? 0.6 : 1,
        }}>
          {searching ? "Searching..." : "Search Transactions"}
        </button>

        {foundTransactions.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                {foundTransactions.length} transaction(s) found
              </span>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--text-secondary)" }}>
                <input type="checkbox" checked={selectedIds.length === foundTransactions.length} onChange={toggleSelectAll} />
                Select All
              </label>
            </div>

            <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: 8, marginBottom: 16 }}>
              {foundTransactions.map((tx) => (
                <div key={tx._id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderBottom: "1px solid var(--border-color)", fontSize: 13,
                  background: selectedIds.includes(tx._id) ? "var(--color-primary-light)" : "transparent",
                  cursor: "pointer",
                }} onClick={() => toggleSelect(tx._id)}>
                  <input type="checkbox" checked={selectedIds.includes(tx._id)} onChange={() => toggleSelect(tx._id)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {tx.total} Birr — {tx.paymentType}
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                      {formatTime(tx.createdAt)}
                      {(tx.services || []).map((s) => s.name).join(", ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={label}>Confirm Password</label>
              <input type="password" style={input} value={delPassword} onChange={(e) => setDelPassword(e.target.value)} placeholder="Enter your login password" />
            </div>

            <button onClick={handleDeleteSelected} disabled={deleting || selectedIds.length === 0} style={{
              width: "100%", padding: "12px 28px", fontSize: 15, fontWeight: 600, border: "none", borderRadius: 8,
              background: selectedIds.length === 0 ? "var(--border-color)" : "var(--color-danger)",
              color: selectedIds.length === 0 ? "var(--text-muted)" : "#fff",
              cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
              opacity: deleting ? 0.6 : 1,
            }}>
              {deleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
            </button>
          </div>
        )}

        {searched && foundTransactions.length === 0 && !searching && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 16, textAlign: "center" }}>
            No transactions found at the specified date and time.
          </p>
        )}
      </div>
    </div>
  );
}
