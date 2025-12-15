import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create user
    // NOTE: In production, hash the password with bcrypt!
    // For demo purposes, we're storing plain passwords
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        emailVerified: new Date(), // Auto-verify for demo
        // In production: hash password with bcrypt
        // password: await bcrypt.hash(data.password, 10)
      },
    });

    // Create default categories for the user
    await createDefaultCategories(user.id);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

async function createDefaultCategories(userId: string) {
  // Create some default categories for new users
  const categories = [
    { name: "Income", icon: "💰", color: "#10b981" },
    { name: "Food & Dining", icon: "🍔", color: "#f59e0b" },
    { name: "Transportation", icon: "🚗", color: "#3b82f6" },
    { name: "Shopping", icon: "🛍️", color: "#ec4899" },
    { name: "Entertainment", icon: "🎬", color: "#8b5cf6" },
    { name: "Bills & Utilities", icon: "💡", color: "#ef4444" },
    { name: "Healthcare", icon: "🏥", color: "#06b6d4" },
    { name: "Other", icon: "📦", color: "#6b7280" },
  ];

  await prisma.category.createMany({
    data: categories.map((cat) => ({
      userId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      isSystem: false,
    })),
  });
}
