import bcrypt from "bcryptjs";
import { pathToFileURL } from "url";
import { sequelize } from "./src/config/db.js";
import User from "./src/models/User.model.js";
import Service from "./src/models/service.js";
import Staff from "./src/models/staff.js";
import Expense from "./src/models/expense.js";
import Transaction from "./src/models/Transaction.js";

/* =======================
   SEED DATA
======================= */

export const services = [
    /* የፀጉር አሰራር እና ዊግ */
    { name: "ፓይስትራ በፀጉር", category: "የፀጉር አሰራር እና ዊግ", price: 300 },
    { name: "ፓይስትራ በዊግ", category: "የፀጉር አሰራር እና ዊግ", price: 400 },
    { name: "ካከስ", category: "የፀጉር አሰራር እና ዊግ", price: 250 },
    { name: "ዊግ ፕሊስ ከሌፕ", category: "የፀጉር አሰራር እና ዊግ", price: 600 },
    { name: "ሴንቱሬክ ስትሬትነር ፕሊስና ዊግ", category: "የፀጉር አሰራር እና ዊግ", price: 600 },
    { name: "ትዊስት በፀጉር", category: "የፀጉር አሰራር እና ዊግ", price: 300 },
    { name: "ትዊስት በዊግ", category: "የፀጉር አሰራር እና ዊግ", price: 400 },
    { name: "ሹሩባ በፀጉር", category: "የፀጉር አሰራር እና ዊግ", price: 300 },
    { name: "ሹሩባ በዊግ", category: "የፀጉር አሰራር እና ዊግ", price: 350 },
    { name: "ስፌት በኖርማል", category: "የፀጉር አሰራር እና ዊግ", price: 500 },
    { name: "ስፌት ስግስግ", category: "የፀጉር አሰራር እና ዊግ", price: 600 },
    { name: "ቢ.ቢ. ዜር", category: "የፀጉር አሰራር እና ዊግ", price: 200 },

    /* የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ */
    { name: "ፀጉር መታጠቢያ", category: "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ", price: 200 },
    { name: "ቄቢ መታጠቢያ", category: "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ", price: 200 },
    { name: "ቄቢ ስቲም", category: "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ", price: 300 },
    { name: "ፀጉር ትሬትመንት", category: "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ", price: 350 },
    { name: "ቁርጥ ፀጉር", category: "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ", price: 300 },
    { name: "ጫፍ ቁርጥ", category: "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ", price: 100 },
    { name: "ሻምፖ እና ኮንዲሽነር", category: "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ", price: 100 },
    { name: "ኮንዲት", category: "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ", price: 500 },
    { name: "ስፌት መፍቻ", category: "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ", price: 100 },
    { name: "ዊግ መፍቻ (1 ዊግ)", category: "የፀጉር እንክብካቤ፣ እጥበት እና ቁርጥ", price: 100 },

    /* የፀጉር ቀለም እና ሃይላይት */
    { name: "ቀለም ሙሉ ኩራሶም", category: "የፀጉር ቀለም እና ሃይላይት", price: 500 },
    { name: "ቀለም ስር ሰሩን", category: "የፀጉር ቀለም እና ሃይላይት", price: 500 },
    { name: "ቀለም ፊትፊትን", category: "የፀጉር ቀለም እና ሃይላይት", price: 300 },
    { name: "የፀጉር ቀለም ከእኛ", category: "የፀጉር ቀለም እና ሃይላይት", price: 5000 },
    { name: "ፀጉር በሃይላይት", category: "የፀጉር ቀለም እና ሃይላይት", price: 5500 },
    { name: "የፀጉር ጀል", category: "የፀጉር ቀለም እና ሃይላይት", price: 700 },

    /* ሜካፕ፣ ቅንድብ እና የፊት እንክብካቤ */
    { name: "ፍርግል ሜካፕ", category: "ሜካፕ፣ ቅንድብ እና የፊት እንክብካቤ", price: 3000 },
    { name: "የሙሽራ ሜካፕ", category: "ሜካፕ፣ ቅንድብ እና የፊት እንክብካቤ", price: 5000 },
    { name: "ቅንድብ ዳክስ", category: "ሜካፕ፣ ቅንድብ እና የፊት እንክብካቤ", price: 200 },
    { name: "ቅንድብ ክር", category: "ሜካፕ፣ ቅንድብ እና የፊት እንክብካቤ", price: 100 },
    { name: "ቅንድብ ምላጭ", category: "ሜካፕ፣ ቅንድብ እና የፊት እንክብካቤ", price: 100 },
    { name: "የፊት ስክራብ", category: "ሜካፕ፣ ቅንድብ እና የፊት እንክብካቤ", price: 150 },

    /* ጥፍር እና የእጅ/እግር እንክብካቤ */
    { name: "እጅና እግር ተሞርዶ መቀባት", category: "ጥፍር እና የእጅ/እግር እንክብካቤ", price: 400 },
    { name: "እጅ ተዘፍዝፎ መቀባት", category: "ጥፍር እና የእጅ/እግር እንክብካቤ", price: 300 },
    { name: "እግር ተዘፍዝፎ መቀባት", category: "ጥፍር እና የእጅ/እግር እንክብካቤ", price: 700 },
    { name: "ጥፍር መስጠፍ", category: "ጥፍር እና የእጅ/እግር እንክብካቤ", price: 600 },
    { name: "ጀል ሪፊል", category: "ጥፍር እና የእጅ/እግር እንክብካቤ", price: 900 },
    { name: "ጀል አንድ ጣት", category: "ጥፍር እና የእጅ/እግር እንክብካቤ", price: 150 },
    { name: "ልጥፍ አንድ ጣት", category: "ጥፍር እና የእጅ/እግር እንክብካቤ", price: 100 },
    { name: "አክሲሊክ", category: "ጥፍር እና የእጅ/እግር እንክብካቤ", price: 1300 },
    { name: "ፔላክ መቀባት", category: "ጥፍር እና የእጅ/እግር እንክብካቤ", price: 400 },

    /* ወይባ ጢስ */
    { name: "ወይባ ስፔሻል 1 (ወይባ በምርጥ)", category: "ወይባ ጢስ", price: 4000 },
    { name: "ወይባ ስፔሻል 2 (ፀጉር መስራት ከእግር መዘፍዘፍ ጋር)", category: "ወይባ ጢስ", price: 3000 },
    { name: "ወይባ ስፔሻል 3 (ከስዲ ስቲም ጋር)", category: "ወይባ ጢስ", price: 2600 },
    { name: "ወይባ ስፔሻል 4 (አሽሽ፣ ሸንበራ፣ ቡና በቅቤ)", category: "ወይባ ጢስ", price: 2300 },
    {
        name: "ስፔሻል ፓኬጅ ቁጥር 1 (የፀጉር ትሬትመንት ሙሉ፣ የማሳጅ ሕክምና፣ የምርጥ ሳሙና፣ የፊት ትሬትመንት፣ የእጅ ትሬትመንት አጃ በውት፣ ጂስ 1/2 ሊትር ወሃ)",
        category: "ወይባ ጢስ",
        price: 3500,
    },
    {
        name: "ስፔሻል ፓኬጅ ቁጥር 2 (ዓውሎ ፀጉር ትሬትመንት፣ የማሳጅ ሕክምና፣ ሕርት፣ የሰው መጠጥ፣ የምርጥ ሳሙና፣ የእጅ ትሬትመንት በና በግር)",
        category: "ወይባ ጢስ",
        price: 3000,
    },
    {
        name: "ስፔሻል ፓኬጅ ቁጥር 3 (የምርጥ ሳሙና፣ የሬት ትሬትመንት፣ የሳሙና ስክራብ፣ ትልቅ ጂስ፣ 1/2 ሊትር ወሃ)",
        category: "ወይባ ጢስ",
        price: 2600,
    },
];

const staff = [
    { name: "Sara", role: "Stylist" },
    { name: "Helen", role: "Nails" },
    { name: "Mimi", role: "Skin Care" }
];

const expenses = [
    { name: "Towels", amount: 500, paymentType: "Cash" },
    { name: "Hair Products", amount: 1500, paymentType: "Transfer" }
];

/* =======================
   USERS: DEFAULT LOGIN ACCOUNTS
======================= */

const users = [
    {
        name: "Admin",
        phone: "0911000000",
        password: "admin123",
        role: "admin",
    },
    {
        name: "Sara",
        phone: "0911222333",
        password: "cashier123",
        role: "cashier",
    },
];

/* =======================
   REPLACE ALL SERVICES
   - Destructive for the Services table only. Transactions, staff,
     expenses and users are untouched.
   - Set RESEED_SERVICES=true for ONE deploy to apply a new price
     list to an existing database, then remove the env var.
     (Render's free plan has no shell, so this is the escape hatch.)
   - Also available as: npm run reseed:services
======================= */

export const replaceServices = async () => {
    const before = await Service.count();

    await sequelize.transaction(async (t) => {
        await Service.destroy({ where: {}, truncate: true, transaction: t });
        await Service.bulkCreate(services, { transaction: t, validate: true });
    });

    const after = await Service.count();
    console.log(`Services replaced: ${before} -> ${after}`);
    return { before, after };
};

/* =======================
   SEED FUNCTION (idempotent)
   - Exported so the server can auto-seed on boot (Render free
     plan cannot run preDeployCommand).
   - Does NOT close the connection or exit the process.
======================= */

export const seedData = async () => {
    await sequelize.authenticate();
    console.log("PostgreSQL Connected for seed");

    await sequelize.sync();
    console.log("Tables ensured");

    const [svcCount, staffCount, expCount, userCount] = await Promise.all([
        Service.count(),
        Staff.count(),
        Expense.count(),
        User.count(),
    ]);

    if (process.env.RESEED_SERVICES === "true") {
        await replaceServices();
        console.log("RESEED_SERVICES was true, so the price list was force-reloaded");
    } else if (svcCount === 0) {
        await Service.bulkCreate(services);
        console.log("Services seeded");
    } else {
        console.log("Services already present, skipped");
    }

    if (staffCount === 0) {
        await Staff.bulkCreate(staff);
        console.log("Staff seeded");
    } else {
        console.log("Staff already present, skipped");
    }

    if (expCount === 0) {
        await Expense.bulkCreate(expenses);
        console.log("Expenses seeded");
    } else {
        console.log("Expenses already present, skipped");
    }

    if (userCount === 0) {
        for (const u of users) {
            const hashed = await bcrypt.hash(u.password, 10);
            await User.create({ ...u, password: hashed });
        }
        console.log("Users seeded (admin + cashier)");
    } else {
        console.log("Users already present, skipped");
    }

    console.log("\n== DEFAULT LOGIN ==");
    console.log("Admin phone:    0911000000  password: admin123");
    console.log("Cashier phone:  0911222333  password: cashier123");
};

/* Run directly ONLY when executed as `node seed.js` */
const isMain = import.meta.url === pathToFileURL(process.argv[1] || "").href;
if (isMain) {
    seedData()
        .then(async () => {
            await sequelize.close();
            process.exit(0);
        })
        .catch(async (error) => {
            console.error("Seeding Error:", error);
            await sequelize.close().catch(() => {});
            process.exit(1);
        });
}