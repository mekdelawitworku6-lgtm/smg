import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLocalServices, fetchServices } from "../../services/servicesSlice";
import { useTranslation } from "../../i18n/LanguageContext";
import servicesData from "../../data/services";

const emptyForm = { name: "", category: "", price: "", nonAsrat: false };

const styles = {
  panel: { background: "var(--bg-card)", borderRadius: 10, padding: 20, border: "1px solid var(--border-color)", marginBottom: 20 },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "var(--color-primary)" },
  formRow: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13 },
  select: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13 },
  btn: { padding: "8px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnPrimary: { background: "var(--color-primary)", color: "#fff" },
  btnDanger: { background: "var(--color-danger)", color: "#fff" },
  btnSecondary: { background: "var(--border-color)", color: "var(--text-primary)" },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-color)", fontSize: 13 },
  actions: { display: "flex", gap: 6 },
};

export default function ServicesView() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const apiServices = useSelector((state) => state.services.apiList);
  const localServices = useSelector((state) => state.services.localList);
  const categories = useSelector((state) => state.categories.list);
  const services = useMemo(() => {
    const merged = [...apiServices, ...localServices];
    if (merged.length > 0) return merged;
    const flat = [];
    for (const cat of servicesData) {
      for (const sub of cat.subcategories) {
        for (const svc of sub.services) {
          flat.push({ ...svc, _id: svc.name, category: cat.category, subcategory: sub.name });
        }
      }
    }
    return flat;
  }, [apiServices, localServices]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => { setForm(emptyForm); setEditing(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || form.price === "") return;
    const payload = { name: form.name.trim(), category: form.category, price: Number(form.price), nonAsrat: form.nonAsrat };
    try {
      const API = (await import("../../api/axios")).default;
      if (editing) {
        await API.put(`/services/${editing._id}`, payload);
      } else {
        await API.post("/services", payload);
      }
      await dispatch(fetchServices());
      resetForm();
    } catch {
      const id = editing?._id || `local-${Date.now()}`;
      const entry = { ...payload, _id: id, active: true };
      const updated = editing ? localServices.map((s) => (s._id === id ? entry : s)) : [...localServices, entry];
      dispatch(setLocalServices(updated));
      resetForm();
    }
  };

  const handleEdit = (svc) => { setForm({ name: svc.name, category: svc.category, price: svc.price, nonAsrat: !!svc.nonAsrat }); setEditing(svc); };

  const handleDelete = async (svc) => {
    if (!window.confirm(t("services.deleteConfirm", { name: svc.name }))) return;
    try {
      const API = (await import("../../api/axios")).default;
      await API.delete(`/services/${svc._id}`);
      dispatch(fetchServices());
    } catch {
      const filtered = localServices.filter((s) => s._id !== svc._id);
      dispatch(setLocalServices(filtered));
    }
  };

  const toggleAll = () => setShowAll((p) => !p);

  return (
    <div>
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{editing ? t("services.editService") : t("services.addService")}</h3>
        <form onSubmit={handleSave}>
          <div style={styles.formRow}>
            <input name="name" placeholder={t("services.serviceName")} value={form.name} onChange={handleChange} style={{ ...styles.input, flex: 1, minWidth: 160 }} />
            <select name="category" value={form.category} onChange={handleChange} style={styles.select}>
              <option value="">{t("services.category")}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input name="price" type="number" placeholder={t("services.price")} value={form.price} onChange={handleChange} style={{ ...styles.input, width: 100 }} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
              <input type="checkbox" checked={form.nonAsrat} onChange={(e) => setForm({ ...form, nonAsrat: e.target.checked })} />
              {t("cashier.nonAsrat")}
            </label>
            <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>{editing ? t("services.update") : t("services.add")}</button>
            {editing && <button type="button" onClick={resetForm} style={{ ...styles.btn, ...styles.btnSecondary }}>{t("services.cancel")}</button>}
          </div>
        </form>
      </div>

      <div style={styles.panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ ...styles.panelTitle, margin: 0 }}>{t("services.allServices")}</h3>
          {services.length > 0 && (
            <button onClick={toggleAll} style={{ padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: "var(--color-primary)", color: "#fff" }}>
              {showAll ? t("services.hideAll") : t("services.showAll")}
            </button>
          )}
        </div>
        {services.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("services.noServices")}</div>
        ) : showAll ? (
          services.map((svc, idx) => (
            <div key={svc._id} style={styles.listItem}>
              <div>
                <span style={{ fontWeight: 600 }}>{idx + 1}. {svc.name}</span>
                {svc.nonAsrat && <span style={{ background: "var(--color-primary-light)", color: "var(--color-primary)", fontSize: 10, padding: "1px 6px", borderRadius: 8, marginLeft: 6, fontWeight: 600 }}>{t("cashier.nonAsrat")}</span>}
                <span style={{ color: "var(--color-primary)", marginLeft: 8, fontWeight: 600 }}>{svc.price} ETB</span>
              </div>
            </div>
          ))
        ) : null}
      </div>
    </div>
  );
}
