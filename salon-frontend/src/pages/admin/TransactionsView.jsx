import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

const styles = {
  filterRow: { display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" },
  filterGroup: { display: "flex", flexDirection: "column", gap: 4 },
  filterLabel: { fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-primary)", fontSize: 13 },
  select: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-primary)", fontSize: 13, minWidth: 120 },
  panel: { background: "var(--bg-card)", borderRadius: 10, padding: 20, border: "1px solid var(--border-color)" },
  panelTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "var(--color-primary)" },
};

export default function TransactionsView({ transactions }) {
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
    return { cash, telebirr, abysinya, cbe, total };
  }, [filtered]);

  return (
    <div>
      <div style={styles.filterRow}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>From</label>
          <input type="date" style={styles.input} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>To</label>
          <input type="date" style={styles.input} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Staff</label>
          <select style={styles.select} value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
            <option value="">All Staff</option>
            {staffNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Category</label>
          <select style={styles.select} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setServiceFilter(""); }}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Service</label>
          <select style={styles.select} value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
            <option value="">All Services</option>
            {filteredServiceNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Payment</label>
          <select style={styles.select} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option value="">All</option>
            <option value="cash">Cash</option>
            <option value="telebirr">Telebirr</option>
            <option value="abysinya">Abysinya</option>
            <option value="cbe">CBE</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Search</label>
          <input type="text" placeholder="Search..." style={styles.input} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button type="button" onClick={() => { setDateFrom(""); setDateTo(""); setStaffFilter(""); setCategoryFilter(""); setServiceFilter(""); setPaymentFilter(""); setSearch(""); setShowResults(true); }} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-primary)", cursor: "pointer" }}>
          Show All
        </button>
        <button type="button" disabled={!canSearch} onClick={() => setShowResults(true)} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-color)", background: canSearch ? "var(--color-primary)" : "var(--border-color)", color: canSearch ? "#fff" : "var(--text-muted)", cursor: canSearch ? "pointer" : "not-allowed" }}>
          Search
        </button>
        {showResults && (
          <button type="button" onClick={() => setShowResults(false)} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--border-color)", color: "var(--text-primary)", cursor: "pointer" }}>
            Hide Results
          </button>
        )}
      </div>

      {showResults && (
        <div>
          {filtered.length === 0 ? (
            <div style={{ fontSize: 14, color: "var(--text-muted)", padding: 20, textAlign: "center", background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border-color)" }}>
              No transactions found
            </div>
          ) : (
            <>
              <div style={styles.panel}>
                <h3 style={styles.panelTitle}>Filtered Totals</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                  <div style={{ padding: "10px 14px", background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase" }}>Cash</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{totals.cash.toLocaleString()} Birr</div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase" }}>Telebirr</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{totals.telebirr.toLocaleString()} Birr</div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase" }}>Abysinya</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{totals.abysinya.toLocaleString()} Birr</div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase" }}>CBE</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{totals.cbe.toLocaleString()} Birr</div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "var(--color-primary)", borderRadius: 8, border: "none", color: "#fff" }}>
                    <div style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.8 }}>Total</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{totals.total.toLocaleString()} Birr</div>
                  </div>
                </div>
              </div>

              <div style={{ overflowX: "auto", marginTop: 16 }}>
                <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse", fontSize: 13, background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border-color)" }}>
                  <thead>
                    <tr style={{ background: "var(--border-color)", color: "var(--text-primary)" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>Date</th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>Service</th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>Staff</th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>Payment</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Total</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Tip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx) => {
                      const svcs = tx.services || [];
                      return svcs.length === 0 ? (
                        <tr key={tx._id || tx.uuid} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>{new Date(tx.createdAt).toLocaleString()}</td>
                          <td style={{ padding: "8px 12px" }}>—</td>
                          <td style={{ padding: "8px 12px" }}>—</td>
                          <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}><span style={{ background: "var(--border-color)", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{tx.paymentType}</span></td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{tx.total} Birr</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap" }}>{tx.tip > 0 ? `${tx.tip} Birr` : "—"}</td>
                        </tr>
                      ) : svcs.map((svc, i) => (
                        <tr key={`${tx._id || tx.uuid}-${i}`} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          {i === 0 && <td rowSpan={svcs.length} style={{ padding: "8px 12px", whiteSpace: "nowrap", verticalAlign: "top" }}>{new Date(tx.createdAt).toLocaleString()}</td>}
                          <td style={{ padding: "8px 12px" }}>{svc.name}</td>
                          <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{svc.staff}</td>
                          {i === 0 && <td rowSpan={svcs.length} style={{ padding: "8px 12px", whiteSpace: "nowrap", verticalAlign: "top" }}><span style={{ background: "var(--border-color)", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{tx.paymentType}</span></td>}
                          {i === 0 && <td rowSpan={svcs.length} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", verticalAlign: "top" }}>{tx.total} Birr</td>}
                          {i === 0 && <td rowSpan={svcs.length} style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap", verticalAlign: "top" }}>{tx.tip > 0 ? `${tx.tip} Birr` : "—"}</td>}
                        </tr>
                      ));
                    })}
                    <tr style={{ background: "var(--color-primary)", color: "#fff", fontWeight: 700 }}>
                      <td colSpan={4} style={{ padding: "10px 12px", textAlign: "right" }}>Total</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>{totals.total.toLocaleString()} Birr</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {!showResults && (
        <div style={{ fontSize: 14, color: "var(--text-muted)", padding: 20, background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border-color)" }}>
          Select filters above and click Search to find transactions. You can filter by date, staff, category, service, or payment method.
        </div>
      )}
    </div>
  );
}
