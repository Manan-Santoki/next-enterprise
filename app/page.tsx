import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold text-blue-600">💰</div>
          <span className="text-xl font-bold text-gray-900">Finance Copilot</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/sign-in">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="mb-6 text-5xl font-bold text-gray-900">
          Your AI-Powered
          <span className="block text-blue-600">Personal Finance Assistant</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
          Track expenses, analyze spending patterns, and get intelligent insights
          with our AI copilot. Import bank statements from multiple banks and
          manage your finances effortlessly.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/sign-up">
            <Button size="lg" className="px-8">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Everything you need to manage your finances
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-2 text-4xl">📊</div>
              <CardTitle>Smart Analytics</CardTitle>
              <CardDescription>
                Visualize your spending with interactive charts and Sankey diagrams
              </CardDescription>
            </CardHeader>
            <CardContent>
              Track income, expenses, and net cash flow across all your accounts
              with real-time analytics.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 text-4xl">🏦</div>
              <CardTitle>Multi-Bank Support</CardTitle>
              <CardDescription>
                Import statements from Chase, HDFC, DCB, Zolve, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              Automatically parse PDF statements using OCR and text extraction
              for seamless data import.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 text-4xl">🤖</div>
              <CardTitle>AI Copilot</CardTitle>
              <CardDescription>
                Chat with your finances using natural language
              </CardDescription>
            </CardHeader>
            <CardContent>
              Ask questions about your spending, get insights, and receive
              personalized financial advice.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 text-4xl">🔄</div>
              <CardTitle>Auto-Categorization</CardTitle>
              <CardDescription>
                Intelligent transaction categorization with learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              Automatically categorize transactions and detect internal transfers
              between your accounts.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 text-4xl">💵</div>
              <CardTitle>Budget Tracking</CardTitle>
              <CardDescription>
                Set budgets and track your spending in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              Create monthly, weekly, or custom budgets with progress tracking
              and alerts.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 text-4xl">🔒</div>
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your financial data stays safe and private
              </CardDescription>
            </CardHeader>
            <CardContent>
              Enterprise-grade security with encrypted storage and secure
              authentication.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Ready to take control?</CardTitle>
            <CardDescription className="text-lg">
              Join thousands of users managing their finances smarter
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="px-12">
                Get Started Free
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 Finance Copilot. Your AI-powered finance assistant.</p>
        </div>
      </footer>
    </div>
  );
}
