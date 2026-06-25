const categoryOrder = ["Hair", "Spa", "Nails", "Makeup", "Others"];

export function sortCategories(a, b) {
  const ia = categoryOrder.indexOf(a);
  const ib = categoryOrder.indexOf(b);
  if (ia === -1 && ib === -1) return a.localeCompare(b);
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}

export default categoryOrder;
