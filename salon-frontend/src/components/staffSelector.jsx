import staff from "../data/staff";

function StaffSelector({ selected, onSelect }) {
  return (
    <div>
      <h3>Select Staff</h3>

      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">Choose Staff</option>

        {staff.map((person) => (
          <option key={person}>
            {person}
          </option>
        ))}
      </select>
    </div>
  );
}

export default StaffSelector;