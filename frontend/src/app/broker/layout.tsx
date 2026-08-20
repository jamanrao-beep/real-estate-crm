"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut, Briefcase, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrokerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user || user.role !== "BROKER") return null;

  const navItems = [
    { name: "My Leads", href: "/broker/leads", icon: Briefcase },
    { name: "Deals & Payments", href: "/broker/deals", icon: IndianRupee },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top Navigation */}
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center gap-2 text-accent">
                <Building2 size={24} strokeWidth={1.5} />
                <span className="font-serif text-lg text-ink font-semibold">Broker Workspace</span>
              </div>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-4 lg:space-x-8">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap",
                        isActive
                          ? "border-accent text-ink"
                          : "border-transparent text-ink-soft hover:text-ink hover:border-border"
                      )}
                    >
                      <item.icon size={16} className="mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-ink-soft hidden md:block whitespace-nowrap">
                Signed in as <strong className="text-ink">{user.name}</strong>
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut size={16} className="mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
