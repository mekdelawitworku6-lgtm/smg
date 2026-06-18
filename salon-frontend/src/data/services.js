const servicesData = [
  {
    category: "HAIR",
    subcategories: [
      {
        name: "ፒያስትራ",
        services: [
          { name: "ፒያስትራ ፀጉር", price: 400 },
          { name: "ፒያስትራ ቡዊግ", price: 400 },
        ],
      },
      {
        name: "ዌቭ",
        services: [
          { name: "ዌቭ ፒቤሊስ ክሊፕ", price: 400 },
          { name: "ሲንተቲክ ዌቭ ፒቤሊስ", price: 600 },
        ],
      },
      {
        name: "ቁርጥ",
        services: [
          { name: "ፀጉር ቁርጥ", price: 300 },
          { name: "ጫፍ ቁርጥ", price: 100 },
          { name: "ፀጉር ትሪትመንት", price: 350 },
        ],
      },
      {
        name: "ሌሎች",
        services: [
          { name: "ካከስ", price: 250 },
          { name: "ቤቤ ሄር", price: 200 },
          { name: "የፀጉር ጄል (ፖኒቴል)", price: 700 },
        ],
      },
    ],
  },
  {
    category: "ቀለም",
    subcategories: [
      {
        name: "ቀለም",
        services: [
          { name: "ቀለም መቀቢያ ከራሶ", price: 500 },
          { name: "ቀለም ስርስሩን", price: 500 },
          { name: "ቀለም ፊት ፊቱን", price: 300 },
          { name: "ፀጉር ቀለም", price: 5000 },
          { name: "ፀጉር ሃይላይት", price: 5500 },
          { name: "ሁማን ቀለም", price: 5500 },
        ],
      },
    ],
  },
  {
    category: "ሹሩባ",
    subcategories: [
      {
        name: "ሹሩባ",
        services: [
          { name: "ሹሩባ ቡዊግ", price: 350 },
          { name: "የልጆች ሹሩባ በፀጉር", price: 300 },
        ],
      },
      {
        name: "ትዊስት",
        services: [
          { name: "ትዊስት በፀጉር", price: 300 },
          { name: "ትዊስት ቡዊግ", price: 400 },
        ],
      },
    ],
  },
  {
    category: "ስፌት",
    subcategories: [
      {
        name: "ስፌት",
        services: [
          { name: "ስፌት ኖርማል", price: 450 },
          { name: "ስፌት ስግስግ", price: 500 },
          { name: "ስፌት መፍቻ", price: 100 },
          { name: "ዊግ መፍቻ በ1 ዊግ", price: 10 },
        ],
      },
    ],
  },
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
