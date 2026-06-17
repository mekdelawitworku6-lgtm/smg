const servicesData = [
  {
    category: "SPA",
    subcategories: [
      {
        name: "Special Packages",
        services: [
          { name: "ወይባ ስፔሻል 1", price: 3000 },
          { name: "ወይባ ስፔሻል 2", price: 2600 },
          { name: "ወይባ ስፔሻል 3", price: 2300 },
        ],
      },
      {
        name: "Moroccan Packages",
        services: [
          { name: "ስፔሻል ሞሮኮ የቤቱ", price: 3000 },
          { name: "ስፔሻል ሞሮኮ", price: 2600 },
          { name: "ሞሮኮ የጥንዶች", price: 5000 },
        ],
      },
      {
        name: "Massage & Steam",
        services: [
          { name: "ማሳጅ", price: 1000 },
          { name: "ስቲም ኖርማል", price: 600 },
          { name: "ስቲም ስፔሻል", price: 700 },
          { name: "ስቲም የጥንዶች ኖርማል", price: 1400 },
        ],
      },
    ],
  },
  {
    category: "NAILS",
    subcategories: [
      {
        name: "Gel Nails",
        services: [
          { name: "ጥፍር ለመለጠፍ", price: 600 },
          { name: "ጄል ሪፊል", price: 900 },
          { name: "ጄል ሙሌት", price: 1300 },
          { name: "ጄል አንድ ጣት", price: 150 },
        ],
      },
      {
        name: "Others",
        services: [
          { name: "ልጥፍ አንድ ጣት", price: 100 },
          { name: "ሽላክ መቀባት", price: 400 },
        ],
      },
      {
        name: "Hands & Feet",
        services: [
          { name: "እጅ እና እግር ትሞርዶ መቀባት", price: 200 },
          { name: "እጅ ተዘፍዝፎ መቀባት", price: 350 },
          { name: "እግር ተዘፍዝፎ መቀባት", price: 700 },
        ],
      },
    ],
  },
  {
    category: "MAKEUP",
    subcategories: [
      {
        name: "Makeup Services",
        services: [
          { name: "ኖርማል ሜክአፕ", price: 3000 },
          { name: "የሙሽራ ሜክአፕ", price: 500 },
        ],
      },
    ],
  },
  {
    category: "EYEBROW",
    subcategories: [
      {
        name: "Eyebrow Services",
        services: [
          { name: "ቅንድብ ዋክስ", price: 200 },
          { name: "ቅንድብ ክር", price: 100 },
          { name: "ቅንድብ በምላጭ", price: 100 },
          { name: "ቅንድብ በሂና", price: 300 },
        ],
      },
    ],
  },
  {
    category: "OTHERS",
    subcategories: [
      {
        name: "Facial & Extras",
        services: [
          { name: "የፊት ስክራብ", price: 150 },
          { name: "ካንዲሽነር", price: 500 },
          { name: "ፕላሴንታ", price: 100, nonAsrat: true },
          { name: "ቅቤ", price: 250, nonAsrat: true },
        ],
      },
    ],
  },
];

export default servicesData;
