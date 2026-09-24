import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "../../i18n/LanguageContext";

export default function TransactionsView({ transactions }) {
  const { t } = useTranslation();
  const services = useSelector((s) => s.services.apiList);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  const staffNames = useMemo(() => {
    const names = new Set();
    for (const tx of transactions) {
      for (const svc of tx.services || []) {
        if (svc.staff) names.add(svc.staff);
      }
    }
    return [...names].sort();
  }, [transactions]);

  const categories = useMemo(() => {
    const cats = new Set();
    for (const svc of services) {
      if (svc.category) cats.add(svc.category);
    }
    return [...cats].sort();
  }, [services]);

  const filteredServiceNames = useMemo(() => {
    let source = services;
    if (categoryFilter) {
      source = source.filter((s) => s.category === categoryFilter);
    }
    return source.map((s) => s.name).sort();
  }, [services, categoryFilter]);

  const canSearch = Boolean(
    search || dateFrom || dateTo || staffFilter || categoryFilter || serviceFilter || paymentFilter
  );

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.createdAt).toISOString().split("T")[0];
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      if (staffFilter) {
        const has = tx.services?.some((s) => s.staff === staffFilter);
        if (!has) return false;
      }
      if (serviceFilter) {
        const has = tx.services?.some((s) => s.name === serviceFilter);
        if (!has) return false;
      }
      if (categoryFilter) {
        const svcNames = tx.services?.map((s) => s.name) || [];
        const catSvcNames = services.filter((s) => s.category === categoryFilter).map((s) => s.name);
        const has = svcNames.some((n) => catSvcNames.includes(n));
        if (!has) return false;
      }
      if (paymentFilter && tx.paymentType !== paymentFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchService = tx.services?.some((s) => s.name.toLowerCase().includes(q));
        const matchStaff = tx.services?.some((s) => s.staff?.toLowerCase().includes(q));
        if (!matchService && !matchStaff && !(tx.uuid || "").toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [transactions, dateFrom, dateTo, staffFilter, categoryFilter, serviceFilter, paymentFilter, search, services]);

  const totals = useMemo(() => {
    const cash = filtered.filter((t) => t.paymentType === "cash").reduce((s, t) => s + (t.total || 0), 0);
    const telebirr = filtered.filter((t) => t.paymentType === "telebirr").reduce((s, t) => s + (t.total || 0), 0);
    const abysinya = filtered.filter((t) => t.paymentType === "abysinya").reduce((s, t) => s + (t.total || 0), 0);
    const cbe = filtered.filter((t) => t.paymentType === "cbe").reduce((s, t) => s + (t.total || 0), 0);
    const total = filtered.reduce((s, t) => s + (t.total || 0), 0);
    const asrat = total > 5500 ? (total - 5500) * 0.1 : 0;
    return { cash, telebirr, abysinya, cbe, total, asrat };
  }, [filtered]);

  const paymentLabel = (p) => {
    const map = {
      cash: t("tx.cash"),
      telebirr: t("tx.telebirr"),
      abysinya: t("tx.abysinya"),
      cbe: t("tx.cbe"),
    };
    return map[p] || p || "—";
  };

  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const showAll = () => {
    setDateFrom("");
    setDateTo("");
    setStaffFilter("");
    setCategoryFilter("");
    setServiceFilter("");
    setPaymentFilter("");
    setSearch("");
    setShowResults(true);
  };

  return (
    <div className="wb">
      <div className="wb-hero pc">
        <h1 className="serif">{t("tx.title")}</h1>
      </div>

      <div className="wb-main">
        {showResults && filtered.length > 0 && (
          <section className="wb-sum">
            <div className="wb-tile">
              <i>{t("tx.cash")}</i>
              <b>{totals.cash.toLocaleString()}</b>
            </div>
            <div className="wb-tile">
              <i>{t("tx.telebirr")}</i>
              <b>{totals.telebirr.toLocaleString()}</b>
            </div>
            <div className="wb-tile">
              <i>{t("tx.abysinya")}</i>
              <b>{totals.abysinya.toLocaleString()}</b>
            </div>
            <div className="wb-tile">
              <i>{t("tx.cbe")}</i>
              <b>{totals.cbe.toLocaleString()}</b>
            </div>
            <div className="wb-tile">
              <i>Asrat</i>
              <b>{totals.asrat.toLocaleString()}</b>
            </div>
            <div className="wb-tile total">
              <i>{t("tx.total")}</i>
              <b>{totals.total.toLocaleString()} {t("tx.birr")}</b>
            </div>
          </section>
        )}

        <section className="wb-card">
          <h2 style={{ marginTop: 0 }}>{t("tx.filters")}</h2>

          <div className="wb-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <div className="wb-field">
              <label>{t("tx.from")}</label>
              <input type="date" className="wb-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="wb-field">
              <label>{t("tx.to")}</label>
              <input type="date" className="wb-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="wb-field">
            <label>{t("tx.staff")}</label>
            <select className="wb-select" value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
              <option value="">{t("tx.allStaff")}</option>
              {staffNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="wb-field">
            <label>{t("tx.category")}</label>
            <select className="wb-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setServiceFilter(""); }}>
              <option value="">{t("tx.allCategories")}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="wb-field">
            <label>{t("tx.service")}</label>
            <select className="wb-select" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
              <option value="">{t("tx.allServices")}</option>
              {filteredServiceNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="wb-field">
            <label>{t("tx.payment")}</label>
            <select className="wb-select" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="">{t("tx.all")}</option>
              <option value="cash">{t("tx.cash")}</option>
              <option value="telebirr">{t("tx.telebirr")}</option>
              <option value="abysinya">{t("tx.abysinya")}</option>
              <option value="cbe">{t("tx.cbe")}</option>
            </select>
          </div>

          <div className="wb-field">
            <label>{t("tx.search")}</label>
            <input className="wb-input" type="search" placeholder={t("tx.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="wb-acts" style={{ marginTop: 18 }}>
            <button type="button" className="wb-btn line" onClick={showAll}>
              {t("tx.showAll")}
            </button>
            <button type="button" className="wb-btn" disabled={!canSearch} onClick={() => setShowResults(true)}>
              {t("tx.search")}
            </button>
          </div>
        </section>

        {showResults && filtered.length === 0 && (
          <div className="wb-card" style={{ textAlign: "center", padding: "26px 20px" }}>
            <p style={{ margin: 0, color: "var(--mut)" }}>{t("tx.noFound")}</p>
          </div>
        )}

        {showResults && filtered.length > 0 && (
          <section className="wb-card" style={{ padding: "16px 20px" }}>
            <div className="wb-top" style={{ marginBottom: 4 }}>
              <b className="serif" style={{ fontSize: 20, fontWeight: 600 }}>
                {filtered.length}
              </b>
              {showResults && (
                <button type="button" className="wb-btn line" style={{ width: "auto", padding: "0 14px" }} onClick={() => setShowResults(false)}>
                  {t("tx.hideResults")}
                </button>
              )}
            </div>
            <ul className="wb-tx">
              {filtered.map((tx) => {
                const svcs = tx.services || [];
                return (
                  <li className="wb-tx-item" key={tx._id || tx.uuid}>
                    <div className="grow">
                      <div className="ser">{svcs.length ? svcs.map((s) => s.name).join(", ") : "—"}</div>
                      <div className="sub">
                        {svcs.map((s) => s.staff).filter(Boolean).join(", ") || "—"} · {fmtTime(tx.createdAt)}
                      </div>
                    </div>
                    <span className="wb-tag">{paymentLabel(tx.paymentType)}</span>
                    <b>{tx.total} {t("tx.birr")}</b>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {!showResults && (
          <div className="wb-card" style={{ textAlign: "center", padding: "26px 20px" }}>
            <p style={{ margin: 0, color: "var(--mut)", lineHeight: 1.6 }}>{t("tx.hint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}