function CategorySelector({
  categories,
  selected,
  onSelect,
}) {
  return (
    <div>
      <h3>Category</h3>

      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">
          Select Category
        </option>

        {categories.map((category) => (
          <option key={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CategorySelector;