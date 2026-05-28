import { useState } from "react";
import { useTranslation } from "../../i18n/LanguageContext";

const DEFAULT_CATEGORIES = ["ፀጉር", "ስቲም", "ቅንድብ", "እጅ እና እግር", "ጥፍር", "ቀለም", "ሹሩባ", "ስፌት", "ሜክአፕ", "ሌሎች"];

const styles = {
  panel: { background: "#f5eedd", borderRadius: 10, padding: 20, border: "1px solid #e8dcc8", marginBottom: 20 },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "#8B5E3C" },
  info: { fontSize: 13, color: "#8b7355", marginBottom: 16 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 },
  catCard: { background: "#fefcf8", borderRadius: 8, padding: "16px 20px", border: "1px solid #e8dcc8", textAlign: "center" },
  catName: { fontSize: 18, fontWeight: 700, color: "#8B5E3C" },
  catHint: { fontSize: 11, color: "#a09070", marginTop: 4 },
  formRow: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid #e8dcc8", background: "#fefcf8", color: "#3d2e1e", fontSize: 13, flex: 1, minWidth: 160 },
  btn: { padding: "8px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnPrimary: { background: "#8B5E3C", color: "#fff" },
  btnDanger: { background: "#b91c1c", color: "#fff" },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #e8dcc8", fontSize: 13 },
};

export default function CategoriesView() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("adminCategories")) || DEFAULT_CATEGORIES;
    } catch { return DEFAULT_CATEGORIES; }
  });
  const [newCat, setNewCat] = useState("");
  const [editCat, setEditCat] = useState("");
  const [editVal, setEditVal] = useState("");

  const persist = (next) => {
    setCategories(next);
    localStorage.setItem("adminCategories", JSON.stringify(next));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const name = newCat.trim();
    if (!name || categories.includes(name)) return;
    persist([...categories, name]);
    setNewCat("");
  };

  const handleRename = (oldName) => {
    const next = editVal.trim();
    if (!next || next === oldName) { setEditCat(""); return; }
    persist(categories.map((c) => (c === oldName ? next : c)));
    setEditCat("");
  };

  const handleDelete = (name) => {
    if (!window.confirm(t("cat.deleteConfirm", { name }))) return;
    persist(categories.filter((c) => c !== name));
  };

  return (
    <div>
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{t("cat.addCategory")}</h3>
        <form onSubmit={handleAdd}>
          <div style={styles.formRow}>
            <input placeholder={t("cat.categoryName")} value={newCat} onChange={(e) => setNewCat(e.target.value)} style={styles.input} />
            <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>{t("cat.add")}</button>
          </div>
        </form>
      </div>

      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{t("cat.categories")}</h3>
        <div style={styles.info}>{t("cat.info")}</div>
        {categories.length === 0 ? (
          <div style={{ fontSize: 13, color: "#a09070" }}>{t("cat.noCategories")}</div>
        ) : (
          categories.map((cat) => (
            <div key={cat} style={styles.listItem}>
              {editCat === cat ? (
                <div style={{ display: "flex", gap: 8, flex: 1 }}>
                  <input value={editVal} onChange={(e) => setEditVal(e.target.value)} style={{ ...styles.input, flex: 1 }} autoFocus />
                  <button onClick={() => handleRename(cat)} style={{ ...styles.btn, ...styles.btnPrimary, padding: "8px 12px", fontSize: 12 }}>{t("cat.save")}</button>
                  <button onClick={() => setEditCat("")} style={{ ...styles.btn, ...{ background: "#e8dcc8", color: "#5c4a32" }, padding: "8px 12px", fontSize: 12 }}>{t("cat.cancel")}</button>
                </div>
              ) : (
                <>
                  <span style={{ fontWeight: 600 }}>{cat}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { setEditCat(cat); setEditVal(cat); }} style={{ ...styles.btn, background: "#e8dcc8", color: "#5c4a32", padding: "6px 12px", fontSize: 12 }}>{t("cat.edit")}</button>
                    <button onClick={() => handleDelete(cat)} style={{ ...styles.btn, ...styles.btnDanger, padding: "6px 12px", fontSize: 12 }}>{t("cat.delete")}</button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>{t("cat.activeCategories")}</h3>
        <div style={styles.grid}>
          {categories.map((cat) => (
            <div key={cat} style={styles.catCard}>
              <div style={styles.catName}>{cat}</div>
              <div style={styles.catHint}>{t("cat.mainCategory")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
