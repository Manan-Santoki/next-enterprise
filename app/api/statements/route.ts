import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveFile } from "@/lib/storage";
import { parseStatement } from "@/lib/pdf";
import { categorizeTransaction } from "@/lib/categorization/engine";

// GET /api/statements - List statements for user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    const where: any = { userId: user.id };
    if (accountId) {
      where.accountId = accountId;
    }

    const statements = await prisma.statementFile.findMany({
      where,
      include: {
        account: {
          include: {
            institution: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ statements });
  } catch (error) {
    console.error("Error fetching statements:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch statements" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// POST /api/statements - Upload and parse statement
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const formData = await request.formData();

    const file = formData.get("file") as File;
    const accountId = formData.get("accountId") as string;

    if (!file || !accountId) {
      return NextResponse.json(
        { error: "File and accountId are required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Check if account belongs to user
    const account = await prisma.financeAccount.findFirst({
      where: {
        id: accountId,
        userId: user.id,
      },
      include: {
        institution: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Save file to storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = await saveFile(buffer, file.name, "statements");

    // Create statement file record
    const statement = await prisma.statementFile.create({
      data: {
        userId: user.id,
        accountId: account.id,
        originalFilename: file.name,
        storagePath,
        mimeType: file.type,
        status: "processing",
      },
    });

    // Parse statement immediately (in production, this would be a background job)
    try {
      const parseResult = await parseStatement(buffer, account.institution.name);

      if (parseResult.errors.length > 0) {
        await prisma.statementFile.update({
          where: { id: statement.id },
          data: {
            status: "failed",
            errorMessage: parseResult.errors.join("; "),
          },
        });

        return NextResponse.json(
          {
            statement,
            error: "Parsing failed",
            details: parseResult.errors,
          },
          { status: 422 }
        );
      }

      // Update statement with period info
      await prisma.statementFile.update({
        where: { id: statement.id },
        data: {
          periodStart: parseResult.periodStart,
          periodEnd: parseResult.periodEnd,
          status: "parsed",
        },
      });

      // Insert transactions
      const transactionData = parseResult.transactions.map((txn) => ({
        userId: user.id,
        accountId: account.id,
        statementFileId: statement.id,
        postedAt: new Date(txn.date),
        rawDateString: txn.date,
        amount: txn.type === "credit" ? txn.amount : -txn.amount,
        currency: account.currency,
        rawDescription: txn.description,
        normalizedDescription: txn.description,
        transactionType: "other",
        direction: txn.type,
        balance: txn.balance || 0,
      }));

      await prisma.transaction.createMany({
        data: transactionData,
        skipDuplicates: true,
      });

      // Auto-categorize new transactions
      const createdTransactions = await prisma.transaction.findMany({
        where: {
          statementFileId: statement.id,
        },
        select: {
          id: true,
        },
      });

      // Categorize each transaction
      for (const txn of createdTransactions) {
        await categorizeTransaction(txn.id);
      }

      // Update account balance if we have closing balance
      if (parseResult.closingBalance !== undefined) {
        await prisma.financeAccount.update({
          where: { id: account.id },
          data: {
            currentBalance: parseResult.closingBalance,
          },
        });
      }

      return NextResponse.json(
        {
          statement,
          transactionsCreated: transactionData.length,
          success: true,
        },
        { status: 201 }
      );
    } catch (parseError) {
      console.error("Error parsing statement:", parseError);

      await prisma.statementFile.update({
        where: { id: statement.id },
        data: {
          status: "failed",
          errorMessage:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parsing error",
        },
      });

      return NextResponse.json(
        {
          statement,
          error: "Parsing failed",
          details: [
            parseError instanceof Error
              ? parseError.message
              : "Unknown error",
          ],
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("Error uploading statement:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload statement" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
