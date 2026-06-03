import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/* =======================
   CONNECT TO DATABASE
======================= */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected for Seeding");
    } catch (error) {
        console.error("DB Connection Failed:", error.message);
        process.exit(1);
    }
};

/* =======================
   SCHEMAS (simple version for seeding)
   (You can replace with real models later)
======================= */

const serviceSchema = new mongoose.Schema({}, { strict: false });
const staffSchema = new mongoose.Schema({}, { strict: false });
const expenseSchema = new mongoose.Schema({}, { strict: false });

const Service = mongoose.model("Service", serviceSchema);
const Staff = mongoose.model("Staff", staffSchema);
const Expense = mongoose.model("Expense", expenseSchema);

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
    {
        title: "Towels",
        amount: 500,
        paymentType: "Cash"
    },
    {
        title: "Hair Products",
        amount: 1500,
        paymentType: "Transfer"
    }
];

/* =======================
   SEED FUNCTION
======================= */

const seedData = async () => {
    try {
        await connectDB();

        // Clear old data
        await Service.deleteMany();
        await Staff.deleteMany();
        await Expense.deleteMany();

        // Insert new data
        await Service.insertMany(services);
        await Staff.insertMany(staff);
        await Expense.insertMany(expenses);

        console.log("Seed Data Inserted Successfully 🚀");

        process.exit();
    } catch (error) {
        console.error("Seeding Error:", error);
        process.exit(1);
    }
};

seedData();