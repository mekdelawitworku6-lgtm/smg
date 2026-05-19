function SubcategorySelector({
  subcategories,
  selected,
  onSelect,
}) {
  return (
    <div>
      <h3>Subcategory</h3>

      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">
          Select Subcategory
        </option>

        {subcategories.map((subcategory) => (
          <option key={subcategory}>
            {subcategory}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SubcategorySelector;