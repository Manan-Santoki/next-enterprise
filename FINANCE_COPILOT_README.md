# 💸 Finance Copilot

> **AI-Powered Personal Finance Tracker** - Intelligent financial management with PDF statement parsing, multi-bank support, internal transfer detection, and conversational AI.

## 🌟 Features

### ✅ Currently Implemented
- **Multi-Bank Support**: HDFC, DCB, Zolve, Chase (+ custom bank templates)
- **Secure Authentication**: NextAuth with database sessions
- **Comprehensive Data Model**: 20+ models covering all aspects of personal finance
- **Beautiful Dashboard**: Modern UI with shadcn-inspired components
- **Smart Categorization**: 13 main categories with 50+ subcategories

### 🚧 In Development
- **PDF Statement Parsing**: Text extraction + OCR for scanned documents
- **Internal Transfer Detection**: Automatically identifies money movement between your accounts
- **AI Categorization**: Uses LLMs to intelligently categorize transactions
- **Flow Rules Engine**: Define custom rules for transaction handling
- **Budgeting**: Set limits and track spending by category
- **Analytics & Visualizations**: Sankey diagrams, trend charts, spending breakdowns
- **Plaid Integration**: Connect US bank accounts for live transaction sync
- **AI Chat Copilot**: Ask questions about your finances in natural language

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  Next.js 15 • React 19 • Tailwind • shadcn/ui • Recharts  │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                    │
│  Route Handlers • Server Actions • Middleware               │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌───────────────┬──────────────┬──────────────┬──────────────┐
│   Database    │  Background  │      AI      │    Storage   │
│  PostgreSQL   │    BullMQ    │  OpenRouter  │   S3/Local   │
│    Prisma     │    Redis     │   Qdrant     │              │
└───────────────┴──────────────┴──────────────┴──────────────┘
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.0 or higher
- **PostgreSQL** 14 or higher
- **pnpm** 10.0 or higher
- **Redis** (optional, for background jobs)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd next-enterprise
   git checkout claude/finance-copilot-implementation-S0s3h
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```env
   # Required
   DATABASE_URL="postgresql://user:password@localhost:5432/finance_copilot"
   NEXTAUTH_SECRET="your-secret-key-min-32-chars"
   NEXTAUTH_URL="http://localhost:3000"

   # Optional (for full functionality)
   OPENAI_API_KEY="sk-..."
   OPENROUTER_API_KEY="sk-or-..."
   QDRANT_URL="http://localhost:6333"
   PLAID_CLIENT_ID=""
   PLAID_SECRET=""
   REDIS_URL="redis://localhost:6379"
   ```

4. **Initialize the database**
   ```bash
   # Push schema to database
   pnpm db:push

   # Seed with default data
   pnpm db:seed
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Dashboard: http://localhost:3000/dashboard
   - API Health: http://localhost:3000/api/health

### Demo User

After seeding, you can use:
- Email: `demo@financeco.app`
- Password: *(set up your own authentication)*

## 📁 Project Structure

```
next-enterprise/
├── app/                          # Next.js app directory
│   ├── (dashboard)/             # Dashboard routes (protected)
│   │   ├── dashboard/           # Main dashboard
│   │   ├── transactions/        # Transaction list & filters
│   │   ├── accounts/            # Account management
│   │   ├── budgets/             # Budget tracking
│   │   ├── analytics/           # Charts & insights
│   │   ├── imports/             # Statement uploads
│   │   ├── ai/                  # AI chat interface
│   │   └── settings/            # User settings
│   ├── api/                     # API routes
│   │   ├── auth/                # NextAuth endpoints
│   │   ├── accounts/            # Account CRUD
│   │   ├── transactions/        # Transaction queries
│   │   ├── statements/          # File uploads
│   │   └── ai/                  # AI chat endpoint
│   └── layout.tsx               # Root layout
├── components/
│   ├── dashboard/               # Dashboard-specific components
│   ├── ui/                      # Reusable UI components
│   └── providers/               # React context providers
├── lib/
│   ├── db/                      # Database client
│   ├── auth/                    # Authentication logic
│   ├── pdf/                     # PDF parsing engines
│   ├── ai/                      # AI/ML utilities
│   ├── analytics/               # Analytics queries
│   ├── storage/                 # File storage
│   ├── jobs/                    # Background jobs
│   ├── types/                   # TypeScript types
│   └── utils/                   # Helper functions
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Seed data
└── styles/
    └── tailwind.css             # Global styles
```

## 🗄️ Database Schema

### Core Entities

**User** → **FinanceAccount** → **Transaction**
- Users have multiple accounts
- Accounts belong to institutions
- Transactions link to accounts

**Key Models:**
- `Institution`: Banks (HDFC, Chase, etc.)
- `FinanceAccount`: User's bank accounts
- `Transaction`: Individual transactions
- `Category`: Hierarchical categorization
- `Budget`: Spending limits
- `FlowRule`: Transfer detection rules
- `StatementFile`: Uploaded PDFs
- `BankParsingTemplate`: Bank-specific parsers

See [schema.prisma](./prisma/schema.prisma) for complete details.

## 🔧 Available Scripts

```bash
# Development
pnpm dev                  # Start dev server
pnpm build                # Build for production
pnpm start                # Start production server

# Database
pnpm db:generate          # Generate Prisma client
pnpm db:push              # Push schema to database
pnpm db:migrate           # Create migration
pnpm db:seed              # Seed database
pnpm db:studio            # Open Prisma Studio
pnpm db:reset             # Reset database

# Code Quality
pnpm lint                 # Run ESLint
pnpm lint:fix             # Fix linting issues
pnpm prettier             # Check formatting
pnpm prettier:fix         # Fix formatting

# Testing
pnpm test                 # Run unit tests
pnpm test:watch           # Watch mode
pnpm test:ui              # Test UI
pnpm e2e:ui               # E2E tests with UI
```

## 📊 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 | React framework with App Router |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI Components** | Radix UI + shadcn/ui | Accessible primitives |
| **Database** | PostgreSQL + Prisma | Relational data store |
| **Authentication** | NextAuth.js | Session management |
| **State Management** | TanStack Query | Server state |
| **Charts** | Recharts + d3-sankey | Data visualization |
| **PDF Parsing** | pdf-parse + Tesseract | Document processing |
| **Background Jobs** | BullMQ + Redis | Async processing |
| **AI/LLM** | OpenRouter | Chat & categorization |
| **Embeddings** | OpenAI | Vector representations |
| **Vector DB** | Qdrant | Semantic search |
| **Bank API** | Plaid | Live account sync |
| **File Storage** | Local / S3 | Statement storage |

## 🎯 Key Workflows

### 1. Statement Upload & Processing
```
User uploads PDF →
  Stored to disk/S3 →
    Background job queued →
      PDF parsed (text/OCR) →
        Transactions extracted →
          FlowRules applied →
            Categorization (rules/AI) →
              Saved to database →
                Analytics updated
```

### 2. Internal Transfer Detection
```
Transaction ingested →
  Check FlowRules for patterns →
    Search for matching transaction in other account →
      If found: Link with transferGroupId →
        Exclude from expense/income →
          Include in Sankey flow visualization
```

### 3. AI Chat Query
```
User asks question →
  Embeddings searched in Qdrant →
    Relevant transactions retrieved →
      LLM called with context + tools →
        Tool calls executed (analytics queries) →
          Response formatted →
            Charts rendered if applicable
```

## 🔐 Security Considerations

- [x] Environment variables for secrets
- [x] NextAuth for secure sessions
- [ ] Encrypt Plaid tokens at rest
- [ ] Rate limiting on API endpoints
- [ ] File upload validation (size, type, virus scan)
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention (React)
- [ ] CSRF protection (NextAuth)

## 🧪 Testing

```bash
# Unit Tests
pnpm test

# Integration Tests
pnpm test:watch

# E2E Tests
pnpm e2e:ui
```

### Test Coverage Goals
- [ ] Parsing engines: 90%+
- [ ] FlowRule logic: 95%+
- [ ] API endpoints: 80%+
- [ ] UI components: 70%+

## 📈 Roadmap

### Phase 1: Foundation ✅
- [x] Database schema
- [x] Authentication
- [x] Basic UI layout

### Phase 2: Core Features 🚧
- [ ] Account management
- [ ] Statement parsing
- [ ] Transaction list
- [ ] Basic categorization

### Phase 3: Intelligence
- [ ] FlowRule engine
- [ ] AI categorization
- [ ] Internal transfers

### Phase 4: Analytics
- [ ] Charts & graphs
- [ ] Sankey diagrams
- [ ] Spending insights

### Phase 5: AI Copilot
- [ ] Embeddings pipeline
- [ ] Chat interface
- [ ] Tool calling

### Phase 6: Advanced
- [ ] Plaid integration
- [ ] Budgeting
- [ ] Reports
- [ ] Mobile optimization

## 🤝 Contributing

This is currently a personal project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- **shadcn/ui**: For beautiful component patterns
- **Radix UI**: For accessible primitives
- **Prisma**: For excellent database tooling
- **Next.js**: For the amazing framework

## 📞 Support

For questions or issues:
- Open a GitHub issue
- Check the [PROGRESS.md](./PROGRESS.md) for implementation status

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies**
