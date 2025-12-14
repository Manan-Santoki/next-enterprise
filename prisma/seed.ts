import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create default institutions
  const institutions = await Promise.all([
    prisma.institution.upsert({
      where: { name: "HDFC Bank" },
      update: {},
      create: {
        name: "HDFC Bank",
        country: "IN",
        isSystem: true,
        metadata: {
          logo: "/institutions/hdfc.png",
          website: "https://www.hdfcbank.com",
        },
      },
    }),
    prisma.institution.upsert({
      where: { name: "DCB Bank" },
      update: {},
      create: {
        name: "DCB Bank",
        country: "IN",
        isSystem: true,
        metadata: {
          logo: "/institutions/dcb.png",
          website: "https://www.dcbbank.com",
        },
      },
    }),
    prisma.institution.upsert({
      where: { name: "Zolve" },
      update: {},
      create: {
        name: "Zolve",
        country: "US",
        isSystem: true,
        metadata: {
          logo: "/institutions/zolve.png",
          website: "https://www.zolve.com",
        },
      },
    }),
    prisma.institution.upsert({
      where: { name: "Chase" },
      update: {},
      create: {
        name: "Chase",
        country: "US",
        isSystem: true,
        metadata: {
          logo: "/institutions/chase.png",
          website: "https://www.chase.com",
        },
      },
    }),
  ]);

  console.log(`✅ Created ${institutions.length} institutions`);

  // Create default system categories
  const categories = [
    {
      name: "Food & Dining",
      icon: "🍔",
      color: "#FF6B6B",
      subcategories: ["Restaurants", "Groceries", "Coffee & Cafes", "Fast Food"],
    },
    {
      name: "Transportation",
      icon: "🚗",
      color: "#4ECDC4",
      subcategories: ["Uber/Lyft", "Gas", "Parking", "Public Transit", "Auto Insurance"],
    },
    {
      name: "Shopping",
      icon: "🛍️",
      color: "#95E1D3",
      subcategories: ["Clothing", "Electronics", "Home & Garden", "Personal Care"],
    },
    {
      name: "Housing",
      icon: "🏠",
      color: "#F38181",
      subcategories: ["Rent", "Utilities", "Internet", "Home Insurance", "Maintenance"],
    },
    {
      name: "Healthcare",
      icon: "🏥",
      color: "#AA96DA",
      subcategories: ["Doctor Visits", "Pharmacy", "Health Insurance", "Dental"],
    },
    {
      name: "Entertainment",
      icon: "🎮",
      color: "#FCBAD3",
      subcategories: ["Streaming Services", "Movies", "Games", "Hobbies"],
    },
    {
      name: "Education",
      icon: "📚",
      color: "#A8D8EA",
      subcategories: ["Tuition", "Books", "Courses", "Supplies"],
    },
    {
      name: "Subscriptions",
      icon: "📱",
      color: "#FFD93D",
      subcategories: ["Netflix", "Spotify", "Software", "Memberships"],
    },
    {
      name: "Travel",
      icon: "✈️",
      color: "#6BCB77",
      subcategories: ["Flights", "Hotels", "Activities", "Travel Insurance"],
    },
    {
      name: "Fees & Charges",
      icon: "💳",
      color: "#FF6464",
      subcategories: ["Bank Fees", "ATM Fees", "Late Fees", "Service Charges"],
    },
    {
      name: "Income",
      icon: "💰",
      color: "#4CAF50",
      subcategories: ["Salary", "Family Support", "Refunds", "Interest", "Other Income"],
    },
    {
      name: "Transfers",
      icon: "🔄",
      color: "#9E9E9E",
      subcategories: ["Internal Transfer", "Account Transfer"],
    },
    {
      name: "Miscellaneous",
      icon: "📦",
      color: "#B0B0B0",
      subcategories: ["Other", "Uncategorized"],
    },
  ];

  for (const category of categories) {
    const parent = await prisma.category.upsert({
      where: { id: `system-${category.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `system-${category.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: category.name,
        icon: category.icon,
        color: category.color,
        isSystem: true,
        order: categories.indexOf(category),
      },
    });

    // Create subcategories
    for (const subcatName of category.subcategories) {
      await prisma.category.upsert({
        where: {
          id: `system-${category.name.toLowerCase().replace(/\s+/g, "-")}-${subcatName.toLowerCase().replace(/\s+/g, "-")}`,
        },
        update: {},
        create: {
          id: `system-${category.name.toLowerCase().replace(/\s+/g, "-")}-${subcatName.toLowerCase().replace(/\s+/g, "-")}`,
          name: subcatName,
          parentId: parent.id,
          isSystem: true,
        },
      });
    }
  }

  console.log(`✅ Created ${categories.length} categories with subcategories`);

  // Create a demo user (optional)
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@financeco.app" },
    update: {},
    create: {
      email: "demo@financeco.app",
      name: "Demo User",
      baseCurrency: "USD",
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);

  // Create some default flow rules for the demo user
  const hdfc = institutions.find((i) => i.name === "HDFC Bank");
  const dcb = institutions.find((i) => i.name === "DCB Bank");
  const chase = institutions.find((i) => i.name === "Chase");
  const zolve = institutions.find((i) => i.name === "Zolve");

  console.log("🌱 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
