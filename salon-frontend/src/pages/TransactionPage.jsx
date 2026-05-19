import { useState } from "react";

import { useDispatch } from "react-redux";

import { createTransaction } from "../transactions/transactionSlice";

const generateUuid = () =>
  window.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;

import TransactionHistory from "../components/TransactionHistory";

function TransactionPage() {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    serviceName: "",
    category: "",
    price: "",
    staffName: "",
    paymentType: "Cash",
    cashierName: "Reception-1",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await dispatch(
      createTransaction({
        ...formData,
        uuid: generateUuid(),
      })
    );

    setFormData({
      serviceName: "",
      category: "",
      price: "",
      staffName: "",
      paymentType: "Cash",
      cashierName: "Reception-1",
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Salon Transaction System</h1>

      <form onSubmit={handleSubmit}>
        <input
          name="serviceName"
          placeholder="Service"
          value={formData.serviceName}
          onChange={handleChange}
        />

        <input
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
        />

        <input
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
        />

        <input
          name="staffName"
          placeholder="Staff"
          value={formData.staffName}
          onChange={handleChange}
        />

        <select
          name="paymentType"
          value={formData.paymentType}
          onChange={handleChange}
        >
          <option>Cash</option>
          <option>CBE</option>
          <option>Telebirr</option>
          <option>Aisinya</option>
        </select>

        <button type="submit">
          Complete Transaction
        </button>
      </form>

      <hr />

      <TransactionHistory />
    </div>
  );
}

export default TransactionPage;