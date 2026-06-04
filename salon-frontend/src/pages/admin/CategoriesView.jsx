import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addCategory, renameCategory, deleteCategory } from "../../categories/categoriesSlice";
import { useTranslation } from "../../i18n/LanguageContext";

const styles = {
  panel: { background: "var(--bg-card)", borderRadius: 10, padding: 20, border: "1px solid var(--border-color)", marginBottom: 20 },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "var(--color-primary)" },
  info: { fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 },
  catCard: { background: "var(--bg-card)", borderRadius: 8, padding: "16px 20px", border: "1px solid var(--border-color)", textAlign: "center" },
  catName: { fontSize: 18, fontWeight: 700, color: "var(--color-primary)" },
  catHint: { fontSize: 11, color: "var(--text-muted)", marginTop: 4 },
  formRow: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13, flex: 1, minWidth: 160 },
  btn: { padding: "8px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnPrimary: { background: "var(--color-primary)", color: "#fff" },
  btnDanger: { background: "var(--color-danger)", color: "#fff" },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-color)", fontSize: 13 },
};

export default function CategoriesView() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const categories = useSelector((state) => state.categories.list);
  const [newCat, setNewCat] = useState("");
  const [editCat, setEditCat] = useState("");
  const [editVal, setEditVal] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showActive, setShowActive] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    dispatch(addCategory(newCat));
    setNewCat("");
  };

  const handleRename = (oldName) => {
    const next = editVal.trim();
    if (!next || next === oldName) { setEditCat(""); return; }
    dispatch(renameCategory({ oldName, newName: next }));
    setEditCat("");
  };

  const handleDelete = (name) => {
    if (!window.confirm(t("cat.deleteConfirm", { name }))) return;
    dispatch(deleteCategory(name));
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
        <h3 style={{ ...styles.panelTitle, cursor: "pointer" }} onClick={() => setShowCategories(!showCategories)}>
          {showCategories ? "▼ " : "▶ "}{t("cat.categories")}
        </h3>
        {showCategories && (
          <div>
            <div style={styles.info}>{t("cat.info")}</div>
            {categories.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("cat.noCategories")}</div>
            ) : (
              categories.map((cat) => (
                <div key={cat} style={styles.listItem}>
                  {editCat === cat ? (
                    <div style={{ display: "flex", gap: 8, flex: 1 }}>
                      <input value={editVal} onChange={(e) => setEditVal(e.target.value)} style={{ ...styles.input, flex: 1 }} autoFocus />
                      <button onClick={() => handleRename(cat)} style={{ ...styles.btn, ...styles.btnPrimary, padding: "8px 12px", fontSize: 12 }}>{t("cat.save")}</button>
                      <button onClick={() => setEditCat("")} style={{ ...styles.btn, ...{ background: "var(--border-color)", color: "var(--text-primary)" }, padding: "8px 12px", fontSize: 12 }}>{t("cat.cancel")}</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontWeight: 600 }}>{cat}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditCat(cat); setEditVal(cat); }} style={{ ...styles.btn, background: "var(--border-color)", color: "var(--text-primary)", padding: "6px 12px", fontSize: 12 }}>{t("cat.edit")}</button>
                        <button onClick={() => handleDelete(cat)} style={{ ...styles.btn, ...styles.btnDanger, padding: "6px 12px", fontSize: 12 }}>{t("cat.delete")}</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div style={styles.panel}>
        <h3 style={{ ...styles.panelTitle, cursor: "pointer" }} onClick={() => setShowActive(!showActive)}>
          {showActive ? "▼ " : "▶ "}{t("cat.activeCategories")}
        </h3>
        {showActive && (
        <div style={styles.grid}>
          {categories.map((cat) => (
            <div key={cat} style={styles.catCard}>
              <div style={styles.catName}>{cat}</div>
              <div style={styles.catHint}>{t("cat.mainCategory")}</div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
