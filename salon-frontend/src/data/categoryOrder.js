const categoryOrder = [
  "የፀጉር አሰራር እና ዊግ",
  "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ",
  "የፀጉር ቀለም እና ሃይላይት",
  "ሜካፕ፣ ቅንድብ እና የፊት እንክብካቤ",
  "ጥፍር እና የእጅ/እግር እንክብካቤ",
  "ወይባ ጢስ",
];

const HAIR = "ፀጉር";

const rank = (name) => {
  const exact = categoryOrder.indexOf(name);
  if (exact !== -1) return exact;
  // A renamed/older variant of a known category: match on the leading word.
  const partial = categoryOrder.findIndex(
    (c) => c.startsWith(name) || name.startsWith(c)
  );
  if (partial !== -1) return partial;
  // Hair always leads, even under a stale label such as "ፀጉር".
  if (name.includes(HAIR)) return 0;
  return categoryOrder.length;
};

export function sortCategories(a, b) {
  const ia = rank(a);
  const ib = rank(b);
  if (ia === ib) return a.localeCompare(b);
  return ia - ib;
}

export default categoryOrder;
