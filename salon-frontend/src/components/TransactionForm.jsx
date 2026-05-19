import { useState } from "react";
import { useDispatch } from "react-redux";
import { addTransaction, getTransactions } from "../transactions/transactionSlice";
import servicesData from "../data/services";
import staff from "../data/staff";

const generateUuid = () =>
  window.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;

// Flatten services from nested structure
const flattenServices = () => {
  const flattened = [];
  servicesData.forEach((category) => {
    category.subcategories?.forEach((subcat) => {
      subcat.services?.forEach((service) => {
        flattened.push({
          name: service.name,
          price: service.price,
          category: category.category,
          subcategory: subcat.name,
        });
      });
    });
  });
  return flattened;
};

const allServices = flattenServices();

export default function TransactionForm() {
  const dispatch = useDispatch();

  const [serviceName, setServiceName] = useState("");
  const [staffName, setStaffName] = useState("");
  const [paymentType, setPaymentType] = useState("Cash");
  const [loading, setLoading] = useState(false);

  const selectedService = allServices.find(
    (s) => s.name === serviceName
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedService || !staffName) {
      alert("Please select service and staff");
      return;
    }

    setLoading(true);

    const result = await dispatch(
      addTransaction({
        uuid: generateUuid(),
        serviceName: selectedService.name,
        category: selectedService.category,
        subcategory: selectedService.subcategory,
        price: selectedService.price,
        staffName,
        paymentType,
        cashierName: "Reception-1",
      })
    );

    if (result.payload) {
      // Refresh the transaction list
      await dispatch(getTransactions());
    }

    setLoading(false);
    setServiceName("");
    setStaffName("");
    setPaymentType("Cash");
    alert("Transaction completed!");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "15px",
      }}
    >
      <div>
        <label>Service:</label>
        <select
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
          required
        >
          <option value="">-- Select Service --</option>
          {allServices.map((s, idx) => (
            <option key={idx} value={s.name}>
              {s.name} - {s.price} ETB ({s.category})
            </option>
          ))}
        </select>
      </div>

      {selectedService && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
          }}
        >
          <p>
            <strong>Price:</strong> {selectedService.price} ETB
          </p>
          <p>
            <strong>Category:</strong> {selectedService.category}
          </p>
          <p>
            <strong>Type:</strong> {selectedService.subcategory}
          </p>
        </div>
      )}

      <div>
        <label>Staff:</label>
        <select
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
          required
        >
          <option value="">-- Select Staff --</option>
          {staff.map((person) => (
            <option key={person} value={person}>
              {person}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Payment Method:</label>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          <option>Cash</option>
          <option>CBE</option>
          <option>Telebirr</option>
          <option>Aisinya</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "10px",
          backgroundColor: loading ? "#ccc" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Processing..." : "Complete Transaction"}
      </button>
    </form>
  );
}