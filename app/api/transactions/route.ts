import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/transactions - List transactions with filters
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    // Parse filters
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const search = searchParams.get("search");
    const isInternalTransfer = searchParams.get("isInternalTransfer");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    const where: any = {
      userId: user.id,
    };

    if (accountId) {
      where.accountId = accountId;
    }

    if (categoryId) {
      where.OR = [
        { categoryId },
        { subcategoryId: categoryId },
      ];
    }

    if (fromDate) {
      where.postedAt = {
        ...where.postedAt,
        gte: new Date(fromDate),
      };
    }

    if (toDate) {
      where.postedAt = {
        ...where.postedAt,
        lte: new Date(toDate),
      };
    }

    if (minAmount !== null && minAmount !== undefined) {
      where.amount = {
        ...where.amount,
        gte: parseFloat(minAmount),
      };
    }

    if (maxAmount !== null && maxAmount !== undefined) {
      where.amount = {
        ...where.amount,
        lte: parseFloat(maxAmount),
      };
    }

    if (search) {
      where.OR = [
        { rawDescription: { contains: search, mode: "insensitive" } },
        { normalizedDescription: { contains: search, mode: "insensitive" } },
        { merchant: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isInternalTransfer === "true") {
      where.isInternalTransfer = true;
    } else if (isInternalTransfer === "false") {
      where.isInternalTransfer = false;
    }

    // Get total count for pagination
    const total = await prisma.transaction.count({ where });

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            displayName: true,
            currency: true,
            institution: {
              select: {
                name: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          },
        },
        counterparty: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        postedAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch transactions" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// PATCH /api/transactions - Bulk update transactions
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { transactionIds, updates } = body;

    if (!transactionIds || !Array.isArray(transactionIds)) {
      return NextResponse.json(
        { error: "transactionIds array is required" },
        { status: 400 }
      );
    }

    // Verify all transactions belong to user
    const count = await prisma.transaction.count({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
    });

    if (count !== transactionIds.length) {
      return NextResponse.json(
        { error: "Some transactions not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update transactions
    await prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
      data: updates,
    });

    return NextResponse.json({ success: true, updated: count });
  } catch (error) {
    console.error("Error updating transactions:", error);
    return NextResponse.json(
      { error: "Failed to update transactions" },
      { status: 500 }
    );
  }
}
