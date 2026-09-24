import { useState } from "react";
import API from "../../api/axios";
import { useTranslation } from "../../i18n/LanguageContext";
import { useToast } from "../../components/Toast";
import WbsLogo from "../../components/WbsLogo";

export default function SettingsView() {
  const { t } = useTranslation();
  const toast = useToast();

  const [phone, setPhone] = useState(localStorage.getItem("phone") || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [seg, setSeg] = useState("acct");

  const [delDatetime, setDelDatetime] = useState("");
  const [delPassword, setDelPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [foundTransactions, setFoundTransactions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searched, setSearched] = useState(false);

  const [confirm, setConfirm] = useState(null);

  const fail = (text) => toast(text, "error");
  const ok = (text) => toast(text, "success");

  const handleSearchTransactions = async () => {
    if (!delDatetime) return setErr(t("settings.selectFirst"));
    setErr("");
    setSearching(true);
    setSearched(true);
    setFoundTransactions([]);
    setSelectedIds([]);
    try {
      const res = await API.get(`/transactions/by-datetime?datetime=${encodeURIComponent(delDatetime)}`);
      setFoundTransactions(res.data || []);
      if (!res.data || res.data.length === 0) {
        errCheck(t("settings.noTx"));
      }
    } catch (e) {
      setErr(e.response?.data?.message || t("settings.noTx"));
    } finally {
      setSearching(false);
    }
  };

  const errCheck = (text) => {
    setErr(text);
    setTimeout(() => setErr(""), 3500);
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
      setSelectedIds(foundTransactions.map((tr) => tr._id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return fail(t("settings.selectOne"));
    if (!delPassword) return fail(t("settings.pwConfirm"));
    setDeleting(true);
    try {
      const res = await API.post("/transactions/delete-multiple", {
        ids: selectedIds,
        password: delPassword,
      });
      ok(res.data.message || t("settings.deleted", { n: selectedIds.length }));
      setDelPassword("");
      setFoundTransactions([]);
      setSelectedIds([]);
      setSearched(false);
    } catch (e) {
      fail(e.response?.data?.message || t("settings.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem("adminLocalServices");
    localStorage.removeItem("adminStaffList");
    localStorage.removeItem("adminCategories");
    localStorage.removeItem("dailySummaries");
    ok(t("settings.cacheCleared"));
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleSave = async () => {
    setErr("");
    const ph = phone.replace(/\s/g, "");
    if (!/^(\+?251|0)?9\d{8}$/.test(ph)) return setErr(t("settings.errPhone"));
    if (newPassword && !currentPassword) return setErr(t("settings.errCurrentPw"));
    if (newPassword && newPassword.length < 6) return setErr(t("settings.errPassword"));
    setSaving(true);
    try {
      if (phone !== localStorage.getItem("phone")) {
        await API.put("/auth/me", { phone });
        localStorage.setItem("phone", phone);
      }
      if (currentPassword && newPassword) {
        await API.put("/auth/me/password", { currentPassword, newPassword });
        setCurrentPassword("");
        setNewPassword("");
      }
      setShowCur(false);
      setShowNew(false);
      ok(t("settings.updated"));
    } catch (e) {
      setErr(e.response?.data?.message || t("settings.updated"));
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const askConfirm = (msg, onYes) => setConfirm({ msg, onYes });

  return (
    <div className="wb">
      <div className="wb-hero sb">
        <i className="t serif">{t("settings.title")}</i>
        <div className="sb-av">
          <WbsLogo style={{ width: 84, height: 76 }} />
        </div>
        <b className="serif b">{t("settings.brandName")}</b>
        <span className="sub">{phone}</span>
      </div>

      <div className="wb-main">
        <div className="wb-seg" role="tablist">
          <button className={seg === "acct" ? "on" : ""} onClick={() => setSeg("acct")}>
            {t("settings.account")}
          </button>
          <button className={seg === "data" ? "on" : ""} onClick={() => setSeg("data")}>
            {t("settings.data")}
          </button>
        </div>

        {seg === "acct" && (
          <section className="wb-card">
            <h2>{t("settings.account")}</h2>
            <div className="wb-field">
              <label>{t("settings.phone")}</label>
              <input
                className="wb-input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <hr className="wb-hr" />

            <h2>{t("settings.password")}</h2>
            <div className="wb-field">
              <label>{t("settings.currentPw")}</label>
              <input
                className="wb-input"
                type={showCur ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ paddingRight: 70 }}
              />
              <button className="wb-eye" type="button" onClick={() => setShowCur((v) => !v)}>
                {showCur ? t("login.hidePw") : t("login.showPw")}
              </button>
            </div>
            <div className="wb-field">
              <label>{t("settings.newPw")}</label>
              <input
                className="wb-input"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ paddingRight: 70 }}
              />
              <button className="wb-eye" type="button" onClick={() => setShowNew((v) => !v)}>
                {showNew ? t("login.hidePw") : t("login.showPw")}
              </button>
            </div>

            <p className="wb-err" role="alert">{err}</p>

            <button className="wb-btn block" onClick={handleSave} disabled={saving}>
              {saving ? t("settings.updating") : t("settings.update")}
            </button>
          </section>
        )}

        {seg === "data" && (
          <>
            <section className="wb-card danger">
              <h2>{t("settings.dangerZone")}</h2>
              <p>{t("settings.clearDesc")}</p>
              <button
                className="wb-btn red"
                style={{ width: "auto", padding: "0 28px", marginTop: 4 }}
                onClick={() => askConfirm(t("settings.clearConfirm"), handleClearCache)}
              >
                {t("settings.clearCache")}
              </button>
            </section>

            <section className="wb-card">
              <h2 style={{ color: "var(--red)" }}>{t("settings.deleteTx")}</h2>
              <p>{t("settings.deleteDesc")}</p>

              <div className="wb-field">
                <label>{t("settings.datetime")}</label>
                <input
                  className="wb-input"
                  type="datetime-local"
                  value={delDatetime}
                  onChange={(e) => {
                    setDelDatetime(e.target.value);
                    setErr("");
                    setSearched(false);
                    setFoundTransactions([]);
                    setSelectedIds([]);
                  }}
                />
              </div>

              <button
                className="wb-btn block"
                onClick={handleSearchTransactions}
                disabled={searching || !delDatetime}
              >
                {searching ? t("settings.searchingTx") : t("settings.searchTx")}
              </button>

              {foundTransactions.length > 0 && (
                <>
                  <div className="wb-top" style={{ marginTop: 16 }}>
                    <span style={{ fontSize: 14, color: "var(--mut)" }}>
                      {foundTransactions.length} ·{" "}
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          className="wb-chk"
                          checked={selectedIds.length === foundTransactions.length}
                          onChange={toggleSelectAll}
                        />
                        <span style={{ color: "var(--ink)" }}>{t("settings.selectAll")}</span>
                      </label>
                    </span>
                  </div>

                  <ul className="wb-list">
                    {foundTransactions.map((tx) => {
                      const sel = selectedIds.includes(tx._id);
                      return (
                        <li className="wb-item" key={tx._id}>
                          <label style={{ background: sel ? "#fbeef1" : "transparent" }}>
                            <input
                              type="checkbox"
                              className="wb-chk"
                              checked={sel}
                              onChange={() => toggleSelect(tx._id)}
                            />
                            <span>
                              {tx.total} {t("tx.birr")} — {tx.paymentType}
                              <small style={{ display: "block", color: "var(--mut)", fontSize: 12 }}>
                                {formatTime(tx.createdAt)}
                                {(tx.services || []).map((s) => s.name).join(", ")}
                              </small>
                            </span>
                            <b>{formatTime(tx.createdAt)}</b>
                          </label>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="wb-field">
                    <label>{t("settings.pwConfirm")}</label>
                    <input
                      className="wb-input"
                      type="password"
                      autoComplete="off"
                      value={delPassword}
                      onChange={(e) => setDelPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    className="wb-btn red block"
                    onClick={() =>
                      askConfirm(
                        t("settings.deleteConfirm", { n: selectedIds.length }),
                        handleDeleteSelected
                      )
                    }
                    disabled={deleting || selectedIds.length === 0}
                  >
                    {deleting
                      ? t("settings.deleting")
                      : `${t("settings.deleteSelected")} (${selectedIds.length})`}
                  </button>
                </>
              )}

              {searched && foundTransactions.length === 0 && !searching && (
                <p className="wb-empty" style={{ textAlign: "center", marginTop: 16 }}>
                  {t("settings.noTx")}
                </p>
              )}
            </section>
          </>
        )}
      </div>

      {confirm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(30,15,20,.45)",
          }}
          onClick={() => setConfirm(null)}
        >
          <div className="wb-dialog" onClick={(e) => e.stopPropagation()}>
            <p>{confirm.msg}</p>
            <div className="wb-acts">
              <button className="wb-btn line" onClick={() => setConfirm(null)}>
                {t("settings.cancel")}
              </button>
              <button
                className="wb-btn red"
                onClick={() => {
                  const fn = confirm.onYes;
                  setConfirm(null);
                  if (fn) fn();
                }}
              >
                {t("settings.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}