import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getTransactions } from "../transactions/transactionSlice";

export default function TransactionHistory() {
  const dispatch = useDispatch();

  const { list, loading, error } = useSelector(
    (state) => state.transactions
  );

  useEffect(() => {
    dispatch(getTransactions());
  }, [dispatch]);

  if (loading) {
    return <p>Loading transactions...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  const validTransactions = list.filter(
    (tx) =>
      tx &&
      Array.isArray(tx.services) &&
      tx.services.length > 0 &&
      Number(tx.total) > 0 &&
      tx.createdAt &&
      !Number.isNaN(new Date(tx.createdAt).getTime())
  );

  if (validTransactions.length === 0) {
    return <p>No transactions yet</p>;
  }

  return (
    <div>
      {validTransactions.map((tx) => (
        <div
          key={tx._id}
          style={{
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "15px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          <div>
            <h3>Services</h3>
            {tx.services.map((service, index) => (
              <div key={index}>
                {service.name} ({service.staff}) -{" "}
                {service.price} Birr
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <p>
              <b>Payment:</b> {tx.paymentType}
            </p>

            <div style={{ textAlign: "right" }}>
              <h3>{tx.total} Birr</h3>
              <small>
                {new Date(tx.createdAt).toLocaleString()}
              </small>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
