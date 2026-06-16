import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import API from "../../api/axios";

export default function AdminCashierView() {
  const [todayTransactions, setTodayTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const day = useSelector((state) => state.day);
  const cart = useSelector((state) => state.cart);

  const currentDay = day.currentDay;
  const today = day.today;

  useEffect(() => {
    let cancelled = false;
    const fetchToday = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await API.get("/transactions/today");
        if (!cancelled) setTodayTransactions(res.data || []);
      } catch {
        if (!cancelled) setError("Failed to load today's transactions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchToday();
    const interval = setInterval(fetchToday, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const totalIncome = useMemo(
    () => todayTransactions.reduce((s, t) => s + (t.total || 0), 0),
    [todayTransactions]
  );

  const cashPayments = useMemo(
    () => todayTransactions.filter((t) => t.paymentType === "cash").reduce((s, t) => s + t.total, 0),
    [todayTransactions]
  );

  const transferPayments = useMemo(
    () => todayTransactions.filter((t) => t.paymentType !== "cash").reduce((s, t) => s + t.total, 0),
    [todayTransactions]
  );

  const totalTips = useMemo(
    () => todayTransactions.reduce((s, t) => s + (t.tip || 0), 0),
    [todayTransactions]
  );

  const staffTips = useMemo(() => {
    const map = new Map();
    for (const tx of todayTransactions) {
      const txTips = tx.tips || [];
      for (const tip of txTips) {
        if (tip.staff && Number(tip.amount) > 0) {
          map.set(tip.staff, (map.get(tip.staff) || 0) + Number(tip.amount));
        }
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [todayTransactions]);

  const totalExpenses = currentDay?.expenses?.reduce((s, e) => s + e.amount, 0) || 0;

  const serviceCount = useMemo(
    () => todayTransactions.reduce((s, tx) => s + (tx.services?.length || 0), 0),
    [todayTransactions]
  );

  const serviceNames = useMemo(() => {
    const names = new Set();
    for (const tx of todayTransactions) {
      for (const svc of tx.services || []) {
        names.add(svc.name);
      }
    }
    return Array.from(names);
  }, [todayTransactions]);

  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      {loading && (
        <div style={{ textAlign: "center", padding: 20, color: "var(--text-secondary)", fontSize: 13 }}>
          Loading today's transactions...
        </div>
      )}

      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {/* Day Status Banner */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Today</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{today || new Date().toLocaleDateString()}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            {currentDay ? (
              <span style={{ color: "var(--color-success)", fontWeight: 600 }}>Open — Started {formatTime(currentDay.startedAt)}</span>
            ) : (
              <span style={{ color: "var(--text-muted)" }}>Closed</span>
            )}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200, background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Transactions</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{todayTransactions.length}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{serviceCount} Services</div>
        </div>
        <div style={{ flex: 1, minWidth: 200, background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Income</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-success)" }}>{totalIncome} Birr</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Expenses {totalExpenses} Birr</div>
        </div>
      </div>

      {/* Cart (live - from Redux, only works on same device) */}
      <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border-color)", marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "var(--text-primary)" }}>
          Live Cart {cart.items?.length > 0 ? `(${cart.items.length})` : ""}
        </h3>
        {cart.items?.length > 0 ? (
          <div style={{ fontSize: 13 }}>
            {cart.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < cart.items.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                <span style={{ flex: 1 }}>{item.name} <small style={{ color: "var(--text-secondary)" }}>({item.staff})</small></span>
                <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{item.price} Birr</span>
              </div>
            ))}
            <div style={{ paddingTop: 8, fontWeight: 700, textAlign: "right" }}>
              Total {cart.total} Birr
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>No items in cart</p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Cash Flow */}
        <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border-color)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "var(--text-primary)" }}>Session Summary</h3>
          {todayTransactions.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>No transactions yet today</p>
          ) : (
            <div style={{ fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span>Cash</span>
                <span style={{ fontWeight: 600 }}>{cashPayments} Birr</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span>Transfer Payments</span>
                <span style={{ fontWeight: 600 }}>{transferPayments} Birr</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span>Expenses</span>
                <span style={{ fontWeight: 600, color: "var(--color-danger)" }}>{totalExpenses} Birr</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span>Tips</span>
                <span style={{ fontWeight: 600 }}>{totalTips} Birr</span>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: 700 }}>
                <span>Grand Total</span>
                <span>{totalIncome} Birr</span>
              </div>
            </div>
          )}
        </div>

        {/* Tips by staff */}
        <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border-color)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "var(--text-primary)" }}>Tips by Staff</h3>
          {staffTips.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>No tips yet today</p>
          ) : (
            <div style={{ fontSize: 13 }}>
              {staffTips.map(([name, amount]) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>{name}</span>
                  <span style={{ fontWeight: 600 }}>{Math.round(amount)} Birr</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expenses */}
      {currentDay?.expenses?.length > 0 && (
        <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border-color)", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "var(--text-primary)" }}>Expenses</h3>
          <div style={{ fontSize: 13 }}>
            {currentDay.expenses.map((exp, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: i < currentDay.expenses.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                <span style={{ flex: 1 }}>{exp.name}</span>
                <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{exp.amount} Birr</span>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", background: "var(--border-color)", padding: "2px 6px", borderRadius: 4 }}>{exp.paymentType}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services used today */}
      {serviceNames.length > 0 && (
        <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border-color)", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "var(--text-primary)" }}>Services Used Today</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {serviceNames.map((name) => (
              <span key={name} style={{ padding: "4px 12px", background: "var(--color-primary-light)", color: "var(--color-primary)", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: 16, border: "1px solid var(--border-color)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "var(--text-primary)" }}>
          Today's Transactions ({todayTransactions.length})
        </h3>
        {todayTransactions.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>No transactions yet</p>
        ) : (
          <div style={{ maxHeight: 400, overflowY: "auto", fontSize: 13 }}>
            {todayTransactions.map((tx, idx) => (
              <div key={tx._id || tx.uuid || idx} style={{ padding: "8px 0", borderBottom: idx < todayTransactions.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>#{todayTransactions.length - idx}</span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{tx.createdAt ? formatTime(tx.createdAt) : ""}</span>
                </div>
                <div style={{ color: "var(--text-secondary)" }}>
                  {(tx.services || []).map((svc, si) => (
                    <div key={si}>{svc.name} — {svc.staff} — {svc.price} Birr</div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontWeight: 600 }}>
                  <span style={{ fontSize: 11, background: "var(--border-color)", padding: "2px 8px", borderRadius: 4 }}>{tx.paymentType}</span>
                  <span>{tx.total} Birr</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
