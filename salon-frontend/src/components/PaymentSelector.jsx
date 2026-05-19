function PaymentSelector({ value, onChange }) {
  return (
    <div>
      <h3>Payment Method</h3>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option>Cash</option>
        <option>CBE</option>
        <option>Telebirr</option>
        <option>Aisinya</option>
      </select>
    </div>
  );
}

export default PaymentSelector;