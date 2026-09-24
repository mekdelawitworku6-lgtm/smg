import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLocalServices, fetchServices } from "../../services/servicesSlice";
import { addCategory, deleteCategory } from "../../categories/categoriesSlice";
import { useTranslation } from "../../i18n/LanguageContext";
import { useToast } from "../../components/Toast";
import servicesData from "../../data/services";
import API from "../../api/axios";

const emptyForm = { name: "", category: "", price: "", nonAsrat: false };

export default function ServicesView() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const toast = useToast();
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

  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const flat = [];
    for (const cat of servicesData) {
      for (const sub of cat.subcategories) {
        for (const svc of sub.services) {
          flat.push({ ...svc, _id: `static-${svc.name}-${cat.category}`, category: cat.category, subcategory: sub.name });
        }
      }
    }
    dispatch(setLocalServices(flat));
  }, [dispatch]);

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [newCat, setNewCat] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => { setForm(emptyForm); setEditing(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || form.price === "") {
      toast(t("services.needAll"), "error");
      return;
    }
    const payload = { name: form.name.trim(), category: form.category, price: Number(form.price), nonAsrat: form.nonAsrat };
    const id = editing?._id || `local-${Date.now()}`;
    const localEntry = { ...payload, _id: id, active: true };
    const optimistic = editing
      ? [...localServices.filter((s) => s._id !== id), localEntry]
      : [...localServices, localEntry];
    dispatch(setLocalServices(optimistic));
    try {
      if (editing) {
        await API.put(`/services/${editing._id}`, payload);
      } else {
        await API.post("/services", payload);
      }
      await dispatch(fetchServices()).unwrap();
      resetForm();
      toast(t("services.saved"), "success");
    } catch {
      resetForm();
      toast(t("services.saved"), "success");
    }
  };

  const handleEdit = (svc) => { setForm({ name: svc.name, category: svc.category, price: svc.price, nonAsrat: !!svc.nonAsrat }); setEditing(svc); };

  const handleDelete = async (svc) => {
    if (!window.confirm(t("services.deleteService"))) return;
    const optimistic = localServices.filter((s) => s._id !== svc._id);
    dispatch(setLocalServices(optimistic));
    try {
      await API.delete(`/services/${svc._id}`);
      await dispatch(fetchServices()).unwrap();
    } catch { /* fallback already applied optimistically */ }
    toast(t("services.deleted"), "success");
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    dispatch(addCategory(newCat));
    toast(t("services.saved"), "success");
    setNewCat("");
  };

  const handleDeleteCategory = (cat) => {
    if (!window.confirm(t("services.deleteCategory"))) return;
    dispatch(deleteCategory(cat));
    toast(t("services.deleted"), "success");
  };

  const toggleAll = () => setShowAll((p) => !p);

  return (
    <div className="wb">
      <div className="wb-hero pc">
        <h1 className="serif">{t("services.title")}</h1>
      </div>

      <div className="wb-main">
        <section className="wb-card">
          <h2>{editing ? t("services.editService") : t("services.addService")}</h2>
          <form onSubmit={handleSave}>
            <div className="wb-field">
              <label>{t("services.serviceName")}</label>
              <input className="wb-input" name="name" value={form.name} onChange={handleChange} />
            </div>

            <div className="wb-field">
              <label>{t("services.category")}</label>
              <select className="wb-select" name="category" value={form.category} onChange={handleChange}>
                <option value="">{t("services.category")}</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="wb-field">
              <label>{t("services.price")} ({t("services.birr")})</label>
              <input className="wb-input" name="price" type="number" step="any" value={form.price} onChange={handleChange} />
            </div>

            <div className="wb-field">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--ink)", fontSize: 14, letterSpacing: 0 }}>
                <input type="checkbox" className="wb-chk" checked={form.nonAsrat} onChange={(e) => setForm({ ...form, nonAsrat: e.target.checked })} />
                {t("cashier.nonAsrat")}
              </label>
            </div>

            <div className="wb-acts" style={{ marginTop: 18 }}>
              <button type="submit" className="wb-btn">
                {editing ? t("services.update") : t("services.add")}
              </button>
              {editing && (
                <button type="button" className="wb-btn line" onClick={resetForm}>
                  {t("services.cancel")}
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="wb-card">
          <div className="wb-top">
            <h2 style={{ marginTop: 0 }}>{t("services.allServices")}</h2>
            {services.length > 0 && (
              <button className="wb-btn line" style={{ width: "auto", padding: "0 16px" }} onClick={toggleAll}>
                {showAll ? t("services.hideAll") : t("services.showAll")}
              </button>
            )}
          </div>
          {services.length === 0 ? (
            <p className="wb-empty">{t("services.noServices")}</p>
          ) : showAll ? (
            <ul className="wb-list">
              {services.map((svc, idx) => (
                <li className="wb-li" key={svc._id}>
                  <span className="m">
                    {idx + 1}. {svc.name}
                    <small>
                      {svc.category}
                      {svc.nonAsrat && ` · ${t("cashier.nonAsrat")}`}
                    </small>
                  </span>
                  <span className="tag" style={{ whiteSpace: "nowrap" }}>
                    {svc.price} {t("services.birr")}
                  </span>
                  <button className="wb-x" onClick={() => handleEdit(svc)} style={{ color: "var(--g1)", fontSize: 13, width: 32 }}>
                    ✎
                  </button>
                  <button className="wb-x" onClick={() => handleDelete(svc)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="wb-hint" style={{ marginTop: 8 }}>{t("services.showAll")}</p>
          )}
        </section>

        <details className="wb-card">
          <summary>{t("services.categories")}</summary>
          <form onSubmit={handleAddCategory}>
            <div className="wb-field">
              <label>{t("services.categoryName")}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="wb-input" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
                <button type="submit" className="wb-btn" style={{ flex: "none", width: "auto", padding: "0 20px" }}>
                  {t("services.confirm")}
                </button>
              </div>
            </div>
          </form>
          {categories.length === 0 ? (
            <p className="wb-empty">{t("services.noServices")}</p>
          ) : (
            <ul className="wb-list" style={{ marginTop: 14 }}>
              {categories.map((cat) => (
                <li className="wb-li" key={cat}>
                  <span className="m">{cat}</span>
                  <button className="wb-x" onClick={() => handleDeleteCategory(cat)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </details>
      </div>
    </div>
  );
}