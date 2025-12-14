"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  title: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "📊" },
  { title: "Transactions", href: "/dashboard/transactions", icon: "💳" },
  { title: "Accounts", href: "/dashboard/accounts", icon: "🏦" },
  { title: "Budgets", href: "/dashboard/budgets", icon: "💰" },
  { title: "Analytics", href: "/dashboard/analytics", icon: "📈" },
  { title: "Imports", href: "/dashboard/imports", icon: "📄" },
  { title: "AI Copilot", href: "/dashboard/ai", icon: "🤖" },
  { title: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-gray-50">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <span className="text-2xl">💸</span>
          <span className="text-xl font-bold">Finance Copilot</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-200"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="text-xs text-gray-500">
          <p>© 2025 Finance Copilot</p>
        </div>
      </div>
    </div>
  );
}
