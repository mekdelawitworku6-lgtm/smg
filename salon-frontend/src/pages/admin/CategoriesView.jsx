import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addCategory, renameCategory, deleteCategory } from "../../categories/categoriesSlice";
import { setLocalServices, fetchServices } from "../../services/servicesSlice";
import { useTranslation } from "../../i18n/LanguageContext";
import servicesData from "../../data/services";
import { sortCategories } from "../../data/categoryOrder";

const styles = {
  panel: { background: "var(--bg-card)", borderRadius: 10, padding: 20, border: "1px solid var(--border-color)", marginBottom: 20 },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "var(--color-primary)" },
  info: { fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 },
  catCard: { background: "var(--bg-card)", borderRadius: 8, padding: "16px 20px", border: "1px solid var(--border-color)" },
  catName: { fontSize: 18, fontWeight: 700, color: "var(--color-primary)", marginBottom: 8, cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 8 },
  subCatHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px 8px 24px", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", cursor: "pointer", userSelect: "none", borderBottom: "1px solid var(--border-color)" },
  subCatActions: { display: "flex", gap: 4 },
  formRow: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13, flex: 1, minWidth: 160 },
  btn: { padding: "8px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnSmall: { padding: "4px 10px", borderRadius: 4, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" },
  btnPrimary: { background: "var(--color-primary)", color: "#fff" },
  btnDanger: { background: "var(--color-danger)", color: "#fff" },
  btnSecondary: { background: "var(--border-color)", color: "var(--text-primary)" },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 10px 36px", borderBottom: "1px solid var(--border-color)", fontSize: 13 },
  subItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0 6px 48px", fontSize: 13, borderBottom: "1px dashed var(--border-color)" },
};

function loadSubcatMap() {
  try { return JSON.parse(localStorage.getItem("subcatMap")) || {}; } catch { return {}; }
}
function saveSubcatMap(map) {
  localStorage.setItem("subcatMap", JSON.stringify(map));
}

export default function CategoriesView() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const categories = useSelector((state) => state.categories.list);
  const apiServices = useSelector((state) => state.services.apiList);
  const localServices = useSelector((state) => state.services.localList);
  const services = useMemo(() => {
    const merged = [...apiServices, ...localServices];
    if (merged.length > 0) return merged;
    const flat = [];
    for (const cat of servicesData) {
      for (const sub of cat.subcategories) {
        for (const svc of sub.services) {
          flat.push({ ...svc, _id: svc.name, category: cat.category });
        }
      }
    }
    return flat;
  }, [apiServices, localServices]);

  const activeCategories = useMemo(() => {
    const map = new Map();
    for (const cat of categories) {
      map.set(cat.toLowerCase(), cat);
    }
    for (const svc of services) {
      if (svc.category) map.set(svc.category.toLowerCase(), svc.category);
    }
    for (const cat of servicesData) {
      map.set(cat.category.toLowerCase(), cat.category);
    }
    return Array.from(map.values());
  }, [categories, services]);

  const staticSubcats = useMemo(() => {
    const map = {};
    for (const cat of servicesData) {
      map[cat.category] = cat.subcategories.map((s) => s.name);
    }
    return map;
  }, []);

  const [newCat, setNewCat] = useState("");
  const [editCat, setEditCat] = useState("");
  const [editVal, setEditVal] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showActive, setShowActive] = useState(false);
  const [openCats, setOpenCats] = useState({});
  const [openSubcats, setOpenSubcats] = useState({});
  const [editingSubcat, setEditingSubcat] = useState(null);
  const [editSubcatVal, setEditSubcatVal] = useState("");
  const [moveSubcat, setMoveSubcat] = useState(null);
  const [subcatMap, setSubcatMap] = useState(loadSubcatMap);

  const persistSubcatMap = (map) => { setSubcatMap(map); saveSubcatMap(map); };

  const getSubcats = (cat) => {
    if (subcatMap[cat]) return subcatMap[cat];
    return staticSubcats[cat] || ["Other"];
  };

  const getSvcSubcat = (svc) => {
    const cat = svc.category;
    const subs = getSubcats(cat);
    const name = svc.name;
    for (const sub of subs) {
      if (name.includes(sub)) return sub;
    }
    return subs[0] || "Other";
  };

  const groupedBySubcat = useMemo(() => {
    const result = {};
    for (const svc of services) {
      const cat = svc.category;
      if (!result[cat]) result[cat] = {};
      const sub = getSvcSubcat(svc);
      if (!result[cat][sub]) result[cat][sub] = [];
      result[cat][sub].push(svc);
    }
    return result;
  }, [services, subcatMap, staticSubcats]);

  const handleAdd = (e) => {
    e.preventDefault();
    dispatch(addCategory(newCat));
    setNewCat("");
  };

  const handleRename = (oldName) => {
    const next = editVal.trim();
    if (!next || next === oldName) { setEditCat(""); return; }
    dispatch(renameCategory({ oldName, newName: next }));
    if (subcatMap[oldName]) {
      const m = { ...subcatMap, [next]: subcatMap[oldName] };
      delete m[oldName];
      persistSubcatMap(m);
    }
    setEditCat("");
  };

  const handleDelete = (name) => {
    if (!window.confirm(t("cat.deleteConfirm", { name }))) return;
    dispatch(deleteCategory(name));
    const m = { ...subcatMap };
    delete m[name];
    persistSubcatMap(m);
  };

  const handleEditSubcat = (cat, sub) => {
    setEditingSubcat({ cat, sub });
    setEditSubcatVal(sub);
  };

  const handleSaveSubcat = () => {
    if (!editingSubcat || !editSubcatVal.trim()) return;
    const { cat, sub } = editingSubcat;
    const subs = [...getSubcats(cat)];
    const idx = subs.indexOf(sub);
    if (idx !== -1) subs[idx] = editSubcatVal.trim();
    persistSubcatMap({ ...subcatMap, [cat]: subs });
    setEditingSubcat(null);
    setEditSubcatVal("");
  };

  const handleDeleteSubcat = (cat, sub) => {
    if (!window.confirm(t("cat.deleteSubcatConfirm", { name: sub }))) return;
    const subs = getSubcats(cat).filter((s) => s !== sub);
    const remaining = services.filter((svc) => {
      const svcSub = getSvcSubcat(svc);
      return !(svc.category === cat && svcSub === sub);
    });
    persistSubcatMap({ ...subcatMap, [cat]: subs });
    dispatch(setLocalServices(remaining));
  };

  const handleMoveSubcat = (cat, sub, targetCat) => {
    if (!targetCat || targetCat === cat) { setMoveSubcat(null); return; }
    const updated = services.map((svc) => {
      const svcSub = getSvcSubcat(svc);
      if (svc.category === cat && svcSub === sub) {
        return { ...svc, category: targetCat };
      }
      return svc;
    });
    dispatch(setLocalServices(updated));
    setMoveSubcat(null);
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
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {activeCategories.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("cat.noCategories")}</div>
            ) : (
              activeCategories.sort((a, b) => sortCategories(a, b)).map((cat) => {
                const catGroup = groupedBySubcat[cat] || {};
                const subcatNames = Object.keys(catGroup);
                const totalServices = Object.values(catGroup).reduce((s, svcs) => s + svcs.length, 0);
                return (
                  <div key={cat} style={{ ...styles.catCard, cursor: "pointer" }} onClick={() => setOpenCats((p) => ({ ...p, [cat]: !p[cat] }))}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-primary)" }}>{cat}</div>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>{totalServices} {t("services.count")}</span>
                    </div>
                    {openCats[cat] && (
                      <div style={{ marginTop: 12, borderTop: "1px solid var(--border-color)", paddingTop: 8 }}>
                        {subcatNames.length === 0 ? (
                          <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0" }}>{t("services.noServices")}</div>
                        ) : (
                          subcatNames.map((sub) => {
                            const svcs = catGroup[sub] || [];
                            return (
                              <div key={sub}>
                                <div style={styles.subCatHeader} onClick={(e) => { e.stopPropagation(); setOpenSubcats((p) => ({ ...p, [`${cat}|${sub}`]: !p[`${cat}|${sub}`] })); }}>
                                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 11 }}>{openSubcats[`${cat}|${sub}`] ? "▼" : "▶"}</span>
                                    {editingSubcat?.cat === cat && editingSubcat?.sub === sub ? (
                                      <input value={editSubcatVal} onChange={(e) => setEditSubcatVal(e.target.value)} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid var(--border-color)", fontSize: 13, width: 150 }} autoFocus onClick={(e) => e.stopPropagation()} />
                                    ) : (
                                      sub
                                    )}
                                  </span>
                                  <div style={styles.subCatActions}>
                                    {editingSubcat?.cat === cat && editingSubcat?.sub === sub ? (
                                      <>
                                        <button onClick={(e) => { e.stopPropagation(); handleSaveSubcat(); }} style={{ ...styles.btnSmall, ...styles.btnPrimary }}>{t("cat.save")}</button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingSubcat(null); }} style={{ ...styles.btnSmall, ...styles.btnSecondary }}>{t("cat.cancel")}</button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={(e) => { e.stopPropagation(); handleEditSubcat(cat, sub); }} style={{ ...styles.btnSmall, ...styles.btnSecondary }}>{t("cat.edit")}</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSubcat(cat, sub); }} style={{ ...styles.btnSmall, ...styles.btnDanger }}>{t("cat.delete")}</button>
                                        <button onClick={(e) => { e.stopPropagation(); setMoveSubcat({ cat, sub }); }} style={{ ...styles.btnSmall, background: "var(--color-primary)", color: "#fff" }}>{t("cat.move")}</button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {openSubcats[`${cat}|${sub}`] && (
                                  <div>
                                    {svcs.map((svc, i) => (
                                      <div key={svc._id} style={styles.subItem}>
                                        <div>
                                          <span style={{ fontWeight: 500 }}>{i + 1}. {svc.name}</span>
                                          <span style={{ color: "var(--color-primary)", marginLeft: 8, fontWeight: 600 }}>{svc.price} ETB</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {moveSubcat && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 12, minWidth: 300, color: "var(--text-primary)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>{t("cat.moveSubcat", { name: moveSubcat.sub })}</h3>
            <select
              style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid var(--border-color)", fontSize: 14, marginBottom: 16 }}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleMoveSubcat(moveSubcat.cat, moveSubcat.sub, e.target.value);
                }
              }}
            >
              <option value="" disabled>{t("cat.selectCategory")}</option>
              {activeCategories.filter((c) => c !== moveSubcat.cat).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button onClick={() => setMoveSubcat(null)} style={{ padding: "8px 16px", background: "var(--border-color)", color: "var(--text-primary)", border: "none", borderRadius: 6, cursor: "pointer" }}>{t("cat.cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
