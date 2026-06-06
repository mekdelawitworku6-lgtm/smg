import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setStaffList, fetchStaff } from "../../staff/staffSlice";
import { useTranslation } from "../../i18n/LanguageContext";

const ROLE_OPTIONS = [
  "Hairdresser",
  "Cashier",
  "Nail Tech",
  "Massage",
  "Makeup",
  "Other",
];

const styles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 },
  card: { background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border-color)", cursor: "pointer", transition: "0.15s" },
  avatar: { width: 48, height: 48, borderRadius: "50%", background: "var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "var(--color-primary)", flexShrink: 0 },
  cardBody: { display: "flex", gap: 12, alignItems: "center" },
  name: { fontSize: 15, fontWeight: 600, color: "var(--text-primary)" },
  role: { fontSize: 12, color: "var(--text-secondary)" },
  badge: { display: "inlineBlock", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", borderRadius: 12, padding: 28, maxWidth: 500, width: "90%", border: "1px solid var(--border-color)", maxHeight: "80vh", overflowY: "auto", color: "var(--text-primary)" },
  modalHeader: { display: "flex", gap: 16, alignItems: "center", marginBottom: 20 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  fieldValue: { fontSize: 14, fontWeight: 500 },
  panel: { background: "var(--bg-card)", borderRadius: 10, padding: 20, border: "1px solid var(--border-color)", marginBottom: 20 },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "var(--color-primary)" },
  formRow: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-primary)", fontSize: 13 },
  select: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-primary)", fontSize: 13 },
  btn: { padding: "8px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnPrimary: { background: "var(--color-primary)", color: "#fff" },
  btnDanger: { background: "var(--color-danger)", color: "#fff" },
  btnSecondary: { background: "var(--border-color)", color: "var(--text-primary)" },
  row: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-color)", fontSize: 13 },
};

const defaultPhoto = (name) => name?.charAt(0).toUpperCase() || "?";

export default function StaffView({ transactions }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const staffList = useSelector((state) => state.staff.apiList);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAccount, setFormAccount] = useState("");
  const [formSalary, setFormSalary] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [editingId, setEditingId] = useState(null);

  const isCashier = formRole === "Cashier";

  const staffMeta = useMemo(() => {
    const map = {};
    for (const tx of transactions) {
      for (const svc of tx.services || []) {
        if (svc.staff) {
          if (!map[svc.staff]) map[svc.staff] = { services: 0, days: new Set() };
          map[svc.staff].services++;
          map[svc.staff].days.add(new Date(tx.createdAt).toISOString().split("T")[0]);
        }
      }
    }
    return map;
  }, [transactions]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    const payload = { name: formName.trim(), role: formRole, phone: formPhone, accountNumber: formAccount.trim(), salary: Number(formSalary) || 0 };
    try {
      const API = (await import("../../api/axios")).default;
      if (editingId) {
        await API.put(`/staff/${editingId}`, payload);
      } else {
        await API.post("/staff", payload);
      }
      dispatch(fetchStaff());
      if (isCashier && formPhone.trim()) {
        if (!editingId && (!formPassword || formPassword.length < 4)) {
          return alert(t("cashiers.invalidPassword"));
        }
        if (editingId) {
          await API.put(`/auth/cashiers/by-phone/${formPhone.trim()}`, { name: formName.trim() });
        } else {
          await API.post("/auth/cashiers", {
            name: formName.trim(),
            phone: formPhone.trim(),
            password: formPassword,
          });
        }
      }
    } catch {
      const id = editingId || `local-${Date.now()}`;
      const entry = { ...payload, _id: id };
      dispatch(setStaffList(editingId ? staffList.map((s) => (s._id === id ? entry : s)) : [...staffList, entry]));
    }
    setFormName(""); setFormRole(""); setFormPhone(""); setFormAccount(""); setFormSalary(""); setFormPassword(""); setEditingId(null);
  };

  const handleEdit = (s) => {
    setFormName(s.name);
    setFormRole(s.role || "");
    setFormPhone(s.phone || "");
    setFormAccount(s.accountNumber || "");
    setFormSalary(s.salary || "");
    setFormPassword("");
    setEditingId(s._id);
  };

  const handleDelete = async (s) => {
    if (!window.confirm(t("staff.deleteConfirm", { name: s.name }))) return;
    try {
      const API = (await import("../../api/axios")).default;
      await API.delete(`/staff/${s._id}`);
    } catch { /* offline delete, remove locally */ }
    dispatch(setStaffList(staffList.filter((x) => x._id !== s._id)));
    if (selectedStaff?._id === s._id) setSelectedStaff(null);
  };

  return (
    <div>
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{editingId ? t("staff.editStaff") : t("staff.addStaff")}</h3>
        <form onSubmit={handleSave}>
          <div style={styles.formRow}>
            <input placeholder={t("staff.name")} value={formName} onChange={(e) => setFormName(e.target.value)} style={{ ...styles.input, flex: 1, minWidth: 140 }} />
            <select value={formRole} onChange={(e) => setFormRole(e.target.value)} style={{ ...styles.select, width: 140 }}>
              <option value="">{t("staff.role")}</option>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input placeholder={t("staff.phone")} value={formPhone} onChange={(e) => setFormPhone(e.target.value)} style={{ ...styles.input, width: 130 }} />
            <input placeholder="Account No" value={formAccount} onChange={(e) => setFormAccount(e.target.value)} style={{ ...styles.input, width: 110 }} />
            <input placeholder={t("staff.salary")} type="number" value={formSalary} onChange={(e) => setFormSalary(e.target.value)} style={{ ...styles.input, width: 100 }} />
            {isCashier && !editingId && (
              <input placeholder={t("cashiers.password")} type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} style={{ ...styles.input, width: 120 }} />
            )}
            <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>{editingId ? t("staff.update") : t("staff.add")}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormName(""); setFormRole(""); setFormPhone(""); setFormSalary(""); setFormPassword(""); }} style={{ ...styles.btn, ...styles.btnSecondary }}>{t("staff.cancel")}</button>}
          </div>
        </form>
      </div>

      <div style={styles.grid}>
        {staffList.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("staff.noStaff")}</div>
        ) : (
          staffList.map((s) => {
            const meta = staffMeta[s.name] || { services: 0, days: new Set() };
            return (
              <div key={s._id} style={styles.card} onClick={() => setSelectedStaff(s)}>
                <div style={styles.cardBody}>
                  <div style={styles.avatar}>{defaultPhoto(s.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.name}>{s.name}</div>
                    <div style={styles.role}>{s.role || t("staff.defaultRole")}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{meta.services} {t("staff.services")} · {meta.days.size} {t("staff.days")}</div>
                  </div>
                  <span style={{ ...styles.badge, background: s.active !== false ? "#059669" : "var(--text-secondary)", color: s.active !== false ? "#fff" : "var(--text-muted)" }}>
                    {s.active !== false ? t("staff.active") : t("staff.inactive")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedStaff && (
        <div style={styles.modalOverlay} onClick={() => setSelectedStaff(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ ...styles.avatar, width: 56, height: 56, fontSize: 24 }}>{defaultPhoto(selectedStaff.name)}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{selectedStaff.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selectedStaff.role || "Staff"}</div>
              </div>
            </div>

            <div style={styles.field}>
                <div style={styles.fieldLabel}>{t("staff.phone")}</div>
                <div style={styles.fieldValue}>{selectedStaff.phone || "—"}</div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Account No</div>
                <div style={styles.fieldValue}>{selectedStaff.accountNumber || "—"}</div>
              </div>
              <div style={styles.field}>
                <div style={styles.fieldLabel}>{t("staff.salary")}</div>
                <div style={styles.fieldValue}>{selectedStaff.salary ? `${selectedStaff.salary} ${t("staff.birr")}` : "—"}</div>
            </div>
            <div style={styles.field}>
              <div style={styles.fieldLabel}>{t("staff.joined")}</div>
              <div style={styles.fieldValue}>{selectedStaff.createdAt ? new Date(selectedStaff.createdAt).toLocaleDateString() : "—"}</div>
            </div>

            <div style={{ ...styles.panel, marginTop: 16 }}>
              <h3 style={styles.panelTitle}>{t("staff.activity")}</h3>
              <div style={styles.row}>
                <span>{t("staff.servicesCompleted")}</span>
                <span style={{ fontWeight: 600 }}>{(staffMeta[selectedStaff.name]?.services || 0)}</span>
              </div>
              <div style={styles.row}>
                <span>{t("staff.activeDays")}</span>
                <span style={{ fontWeight: 600 }}>{(staffMeta[selectedStaff.name]?.days.size || 0)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => { handleEdit(selectedStaff); setSelectedStaff(null); }} style={{ ...styles.btn, ...styles.btnSecondary }}>{t("staff.edit")}</button>
              <button onClick={() => { handleDelete(selectedStaff); }} style={{ ...styles.btn, ...styles.btnDanger }}>{t("staff.delete")}</button>
              <button onClick={() => setSelectedStaff(null)} style={{ ...styles.btn, ...styles.btnPrimary }}>{t("staff.close")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
