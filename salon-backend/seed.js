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

const services = [
    { name: "ፒያስትራ ፀጉር", category: "ፀጉር", price: 400 },
    { name: "ፒያስትራ ቡዊግ", category: "ፀጉር", price: 400 },
    { name: "ካከስ", category: "ፀጉር", price: 250 },
    { name: "ዌቭ ፒቤሊስ ክሊፕ", category: "ፀጉር", price: 400 },
    { name: "ሲንተቲክ ዌቭ ፒቤሊስ", category: "ፀጉር", price: 600 },
    { name: "ቅቤ ስቲም", category: "ስቲም", price: 300 },
    { name: "ቅቤ መታጠቢያ", category: "ስቲም", price: 200 },
    { name: "ስቲም መታጠቢያ (ሻምፖ እና ካንዲት)", category: "ስቲም", price: 300 },
    { name: "ቅንድብ ዋክስ", category: "ቅንድብ", price: 200 },
    { name: "ቅንድብ ክር", category: "ቅንድብ", price: 100 },
    { name: "ቅንድብ በምላጭ", category: "ቅንድብ", price: 100 },
    { name: "ቅንድብ በሂና", category: "ቅንድብ", price: 300 },
    { name: "እጅ እና እግር ትሞርዶ መቀባት", category: "እጅ እና እግር", price: 200 },
    { name: "እጅ ተዘፍዝፎ መቀባት", category: "እጅ እና እግር", price: 350 },
    { name: "እግር ተዘፍዝፎ መቀባት", category: "እጅ እና እግር", price: 700 },
    { name: "ጥፍር ለመለጠፍ", category: "ጥፍር", price: 600 },
    { name: "ጄል ሪፊል", category: "ጥፍር", price: 900 },
    { name: "ጄል ሙሌት", category: "ጥፍር", price: 1300 },
    { name: "ጄል አንድ ጣት", category: "ጥፍር", price: 150 },
    { name: "ልጥፍ አንድ ጣት", category: "ጥፍር", price: 100 },
    { name: "ሽላክ መቀባት", category: "ጥፍር", price: 400 },
    { name: "ፀጉር ቁርጥ", category: "ፀጉር", price: 300 },
    { name: "ጫፍ ቁርጥ", category: "ፀጉር", price: 100 },
    { name: "ቀለም መቀቢያ ከራሶ", category: "ቀለም", price: 500 },
    { name: "ቀለም ስርስሩን", category: "ቀለም", price: 500 },
    { name: "ቀለም ፊት ፊቱን", category: "ቀለም", price: 300 },
    { name: "ፀጉር ቀለም", category: "ቀለም", price: 5000 },
    { name: "ፀጉር ሃይላይት", category: "ቀለም", price: 5500 },
    { name: "ሁማን ቀለም", category: "ቀለም", price: 5500 },
    { name: "ፀጉር ትሪትመንት", category: "ፀጉር", price: 350 },
    { name: "ሹሩባ ቡዊግ", category: "ሹሩባ", price: 350 },
    { name: "ስፌት ኖርማል", category: "ስፌት", price: 450 },
    { name: "ስፌት ስግስግ", category: "ስፌት", price: 500 },
    { name: "ስፌት መፍቻ", category: "ስፌት", price: 100 },
    { name: "ዊግ መፍቻ በ1 ዊግ", category: "ስፌት", price: 10 },
    { name: "ሻምፖ እና ካንዲት", category: "ስቲም", price: 100 },
    { name: "ኖርማል ሜክአፕ", category: "ሜክአፕ", price: 3000 },
    { name: "የሙሽራ ሜክአፕ", category: "ሜክአፕ", price: 500 },
    { name: "ቤቤ ሄር", category: "ፀጉር", price: 200 },
    { name: "የልጆች ሹሩባ በፀጉር", category: "ሹሩባ", price: 300 },
    { name: "ትዊስት በፀጉር", category: "ሹሩባ", price: 300 },
    { name: "ትዊስት ቡዊግ", category: "ሹሩባ", price: 400 },
    { name: "የፀጉር ጄል (ፖኒቴል)", category: "ፀጉር", price: 700 },
    { name: "የፊት ስክራብ", category: "ሌሎች", price: 150 },
    { name: "ካንዲት", category: "ሌሎች", price: 500 },
    { name: "ፕላሴንታ", category: "ሌሎች", price: 100, nonAsrat: true },
    { name: "ቅቤ", category: "ሌሎች", price: 250, nonAsrat: true },
    { name: "ወይባ ስፔሻል 1 (ፀጉር መስራት ከእግር መዘፍዘፍ ጋር)", category: "ስፔሻል", price: 3000 },
    { name: "ወይባ ስፔሻል 2 (ከቦዲ ስቲም ጋር)", category: "ስፔሻል", price: 2600 },
    { name: "ወይባ ስፔሻል 3 (አብሽ፣ ሽንብራ፣ ቡና በቅቤ)", category: "ስፔሻል", price: 2300 },
    { name: "ስፔሻል ሞሮኮ የቤቱ (ሞሮኮ አፈርና ሳውና፣ የፊት እና የፀጉር ትሪትመንት፣ ቡና በማር ለገላ፣ ተልባ ጁስ፣ 1/2 ሊትር ውሃ)", category: "ስፔሻል", price: 3000 },
    { name: "ሞሮኮ የጥንዶች", category: "ስፔሻል", price: 5000 },
    { name: "ማሳጅ (የሴቶች ብቻ)", category: "ስፔሻል", price: 1000 },
    { name: "ስቲም የጥንዶች ኖርማል", category: "ስፔሻል", price: 1400 },
    { name: "ስፔሻል ሞሮኮ (ሞሮኮ አፈርና ሳውና፣ የፊት ትሪትመንት፣ ማሳጅ በኦይል፣ 1/2 ሊትር ውሃ)", category: "ስፔሻል", price: 2600 },
    { name: "ስቲም ኖርማል (አንድ የገላ ሳውና፣ 1/2 ሊትር ውሃ)", category: "ስፔሻል", price: 600 },
    { name: "ስቲም ስፔሻል (የፊት ትሪትመንት፣ የገላ ማሳጅ፣ አንድ የገላ ሳውና፣ 1/2 ሊትር ውሃ)", category: "ስፔሻል", price: 700 },
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
   SEED FUNCTION (idempotent)
   - Exported so the server can auto-seed on boot (Render free
     plan cannot run pre-deploy commands).
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

    if (svcCount === 0) {
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