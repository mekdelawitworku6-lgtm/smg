const servicesData = [
  {
    category: "የፀጉር አሰራር እና ዊግ",
    subcategories: [
      {
        name: "የፀጉር አሰራር እና ዊግ",
        services: [
          { name: "ፓይስትራ በፀጉር", price: 300 },
          { name: "ፓይስትራ በዊግ", price: 400 },
          { name: "ካከስ", price: 250 },
          { name: "ዊግ ፕሊስ ከሌፕ", price: 600 },
          { name: "ሴንቱሬክ ስትሬትነር ፕሊስና ዊግ", price: 600 },
          { name: "ትዊስት በፀጉር", price: 300 },
          { name: "ትዊስት በዊግ", price: 400 },
          { name: "ሹሩባ በፀጉር", price: 300 },
          { name: "ሹሩባ በዊግ", price: 350 },
          { name: "ስፌት በኖርማል", price: 500 },
          { name: "ስፌት ስግስግ", price: 600 },
          { name: "ቢ.ቢ. ዜር", price: 200 },
        ],
      },
    ],
  },
  {
    category: "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ",
    subcategories: [
      {
        name: "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ",
        services: [
          { name: "ፀጉር መታጠቢያ", price: 200 },
          { name: "ቄቢ መታጠቢያ", price: 200 },
          { name: "ቄቢ ስቲም", price: 300 },
          { name: "ፀጉር ትሬትመንት", price: 350 },
          { name: "ቁርጥ ፀጉር", price: 300 },
          { name: "ጫፍ ቁርጥ", price: 100 },
          { name: "ሻምፖ እና ኮንዲሽነር", price: 100 },
          { name: "ኮንዲት", price: 500 },
          { name: "ስፌት መፍቻ", price: 100 },
          { name: "ዊግ መፍቻ (1 ዊግ)", price: 100 },
        ],
      },
    ],
  },
  {
    category: "የፀጉር ቀለም እና ሃይላይት",
    subcategories: [
      {
        name: "የፀጉር ቀለም እና ሃይላይት",
        services: [
          { name: "ቀለም ሙሉ ኩራሶም", price: 500 },
          { name: "ቀለም ስር ሰሩን", price: 500 },
          { name: "ቀለም ፊትፊትን", price: 300 },
          { name: "የፀጉር ቀለም ከእኛ", price: 5000 },
          { name: "ፀጉር በሃይላይት", price: 5500 },
          { name: "የፀጉር ጀል", price: 700 },
        ],
      },
    ],
  },
  {
    category: "ሜካፕ፣ ቅንድብ እና የፊት እንክብካቤ",
    subcategories: [
      {
        name: "ሜካፕ፣ ቅንድብ እና የፊት እንክብካቤ",
        services: [
          { name: "ፍርግል ሜካፕ", price: 3000 },
          { name: "የሙሽራ ሜካፕ", price: 5000 },
          { name: "ቅንድብ ዳክስ", price: 200 },
          { name: "ቅንድብ ክር", price: 100 },
          { name: "ቅንድብ ምላጭ", price: 100 },
          { name: "የፊት ስክራብ", price: 150 },
        ],
      },
    ],
  },
  {
    category: "ጥፍር እና የእጅ/እግር እንክብካቤ",
    subcategories: [
      {
        name: "ጥፍር እና የእጅ/እግር እንክብካቤ",
        services: [
          { name: "እጅና እግር ተሞርዶ መቀባት", price: 400 },
          { name: "እጅ ተዘፍዝፎ መቀባት", price: 300 },
          { name: "እግር ተዘፍዝፎ መቀባት", price: 700 },
          { name: "ጥፍር መስጠፍ", price: 600 },
          { name: "ጀል ሪፊል", price: 900 },
          { name: "ጀል አንድ ጣት", price: 150 },
          { name: "ልጥፍ አንድ ጣት", price: 100 },
          { name: "አክሲሊክ", price: 1300 },
          { name: "ፔላክ መቀባት", price: 400 },
        ],
      },
    ],
  },
  {
    category: "ወይባ ጢስ",
    subcategories: [
      {
        name: "ወይባ ጢስ",
        services: [
          { name: "ወይባ ስፔሻል 1 (ወይባ በምርጥ)", price: 4000 },
          { name: "ወይባ ስፔሻል 2 (ፀጉር መስራት ከእግር መዘፍዘፍ ጋር)", price: 3000 },
          { name: "ወይባ ስፔሻል 3 (ከስዲ ስቲም ጋር)", price: 2600 },
          { name: "ወይባ ስፔሻል 4 (አሽሽ፣ ሸንበራ፣ ቡና በቅቤ)", price: 2300 },
          { name: "ስፔሻል ፓኬጅ ቁጥር 1 (የፀጉር ትሬትመንት ሙሉ፣ የማሳጅ ሕክምና፣ የምርጥ ሳሙና፣ የፊት ትሬትመንት፣ የእጅ ትሬትመንት አጃ በውት፣ ጂስ 1/2 ሊትር ወሃ)", price: 3500 },
          { name: "ስፔሻል ፓኬጅ ቁጥር 2 (ዓውሎ ፀጉር ትሬትመንት፣ የማሳጅ ሕክምና፣ ሕርት፣ የሰው መጠጥ፣ የምርጥ ሳሙና፣ የእጅ ትሬትመንት በና በግር)", price: 3000 },
          { name: "ስፔሻል ፓኬጅ ቁጥር 3 (የምርጥ ሳሙና፣ የሬት ትሬትመንት፣ የሳሙና ስክራብ፣ ትልቅ ጂስ፣ 1/2 ሊትር ወሃ)", price: 2600 },
        ],
      },
    ],
  },
];

export default servicesData;
