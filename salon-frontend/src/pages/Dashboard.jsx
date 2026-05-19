export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div style={{ padding: 20 }}>
      
      <div className="card">
        <h2>Welcome, {user?.name} ✨</h2>
        <p>Role: {user?.role}</p>
      </div>

      <div style={grid}>

        <div className="card">
          💳 New Sale
        </div>

        <div className="card">
          📊 Reports
        </div>

        <div className="card">
          💇 Services
        </div>

        <div className="card">
          👥 Staff
        </div>

      </div>

    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 15,
  marginTop: 20,
};