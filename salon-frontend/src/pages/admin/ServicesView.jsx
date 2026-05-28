import { useState } from "react";
import API from "../../api/axios";
import { useTranslation } from "../../i18n/LanguageContext";

const emptyForm = { name: "", category: "", price: "", nonAsrat: false };
const CATEGORIES = ["ፀጉር", "ስቲም", "ቅንድብ", "እጅ እና እግር", "ጥፍር", "ቀለም", "ሹሩባ", "ስፌት", "ሜክአፕ", "ሌሎች"];

const styles = {
  panel: { background: "#f5eedd", borderRadius: 10, padding: 20, border: "1px solid #e8dcc8", marginBottom: 20 },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "#8B5E3C" },
  formRow: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid #e8dcc8", background: "#fefcf8", color: "#3d2e1e", fontSize: 13 },
  select: { padding: "8px 12px", borderRadius: 6, border: "1px solid #e8dcc8", background: "#fefcf8", color: "#3d2e1e", fontSize: 13 },
  btn: { padding: "8px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnPrimary: { background: "#8B5E3C", color: "#fff" },
  btnDanger: { background: "#b91c1c", color: "#fff" },
  btnSecondary: { background: "#e8dcc8", color: "#5c4a32" },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #e8dcc8", fontSize: 13 },
  actions: { display: "flex", gap: 6 },
};

export default function ServicesView({ services, setServices }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => { setForm(emptyForm); setEditing(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || form.price === "") return;
    const payload = { name: form.name.trim(), category: form.category, price: Number(form.price), nonAsrat: form.nonAsrat };
    try {
      let updated;
      if (editing) {
        const res = await API.put(`/services/${editing._id}`, payload);
        updated = services.map((s) => (s._id === editing._id ? res.data : s));
      } else {
        const res = await API.post("/services", payload);
        updated = [...services, res.data];
      }
      setServices(updated);
      resetForm();
    } catch {
      const id = editing?._id || `local-${Date.now()}`;
      const entry = { ...payload, _id: id };
      const updated = editing ? services.map((s) => (s._id === id ? entry : s)) : [...services, entry];
      setServices(updated);
      resetForm();
    }
  };

  const handleEdit = (svc) => { setForm({ name: svc.name, category: svc.category, price: svc.price, nonAsrat: !!svc.nonAsrat }); setEditing(svc); };

  const handleDelete = async (svc) => {
    if (!window.confirm(t("services.deleteConfirm", { name: svc.name }))) return;
    try {
      await API.delete(`/services/${svc._id}`);
    } catch { /* online delete failed, remove locally */ }
    setServices(services.filter((s) => s._id !== svc._id));
  };

  return (
    <div>
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{editing ? t("services.editService") : t("services.addService")}</h3>
        <form onSubmit={handleSave}>
          <div style={styles.formRow}>
            <input name="name" placeholder={t("services.serviceName")} value={form.name} onChange={handleChange} style={{ ...styles.input, flex: 1, minWidth: 160 }} />
            <select name="category" value={form.category} onChange={handleChange} style={styles.select}>
              <option value="">{t("services.category")}</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input name="price" type="number" placeholder={t("services.price")} value={form.price} onChange={handleChange} style={{ ...styles.input, width: 100 }} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8b7355", cursor: "pointer" }}>
              <input type="checkbox" checked={form.nonAsrat} onChange={(e) => setForm({ ...form, nonAsrat: e.target.checked })} />
              Non-Asrat
            </label>
            <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>{editing ? t("services.update") : t("services.add")}</button>
            {editing && <button type="button" onClick={resetForm} style={{ ...styles.btn, ...styles.btnSecondary }}>{t("services.cancel")}</button>}
          </div>
        </form>
      </div>

      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{t("services.allServices")}</h3>
        {services.length === 0 ? (
          <div style={{ fontSize: 13, color: "#a09070" }}>{t("services.noServices")}</div>
        ) : (
          services.map((svc) => (
            <div key={svc._id} style={styles.listItem}>
              <div>
                <span style={{ fontWeight: 600 }}>{svc.name}</span>
                {svc.nonAsrat && <span style={{ background: "#f5eedd", color: "#8B5E3C", fontSize: 10, padding: "1px 6px", borderRadius: 8, marginLeft: 6, fontWeight: 600 }}>Non-Asrat</span>}
                <span style={{ color: "#8b7355", marginLeft: 8 }}>{svc.category}</span>
                <span style={{ color: "#8B5E3C", marginLeft: 8, fontWeight: 600 }}>{svc.price} {t("services.birr")}</span>
              </div>
              <div style={styles.actions}>
                <button onClick={() => handleEdit(svc)} style={{ ...styles.btn, ...styles.btnSecondary }}>{t("services.edit")}</button>
                <button onClick={() => handleDelete(svc)} style={{ ...styles.btn, ...styles.btnDanger }}>{t("services.delete")}</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
