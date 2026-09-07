"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, Briefcase, IndianRupee, ReceiptIndianRupee, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!user || user.role !== "SALES_PERSON") return null;

  const navItems = [
    { name: "My Leads", href: "/sales/leads", icon: Briefcase },
    { name: "Deals & Payments", href: "/sales/deals", icon: IndianRupee },
    { name: "My Transactions", href: "/sales/transactions", icon: ReceiptIndianRupee },
  ];

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SP";

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-surface/95 backdrop-blur-md border-b border-border sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-3 sm:gap-6">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-4 lg:gap-8 shrink-0">
              <Link href="/sales/leads" className="flex items-center gap-3 group shrink-0">
                <div className="h-10 w-12 rounded-xl bg-white p-1 border border-border/70 shadow-2xs flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                  <img
                    src="/logo.png"
                    alt="BKD Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex flex-col whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base sm:text-lg font-bold text-ink leading-tight tracking-tight group-hover:text-accent transition-colors">
                      BKD CRM
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-accent bg-accent/10 border border-accent/25 px-1.5 py-0.5 rounded-md">
                      Sales
                    </span>
                  </div>
                  <span className="text-[10px] text-ink-soft uppercase tracking-widest font-medium">
                    Sales Specialist
                  </span>
                </div>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-150 whitespace-nowrap",
                        isActive
                          ? "bg-ink text-surface shadow-xs"
                          : "text-ink-soft hover:text-ink hover:bg-bg/80"
                      )}
                    >
                      <item.icon size={16} className={cn("transition-colors", isActive ? "text-accent" : "text-ink-soft")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Desktop User Profile Badge */}
              <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-border/80">
                <div className="w-8 h-8 rounded-full bg-ink text-surface flex items-center justify-center font-serif font-bold text-xs shadow-2xs border border-accent/30">
                  {userInitials}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-ink leading-none whitespace-nowrap">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-ink-soft leading-tight mt-0.5 font-medium">
                    Sales Representative
                  </span>
                </div>
              </div>

              {/* Sign Out Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout} 
                className="hidden sm:inline-flex text-xs h-8 px-2.5 text-ink-soft hover:text-danger hover:bg-danger/10 hover:border-danger/20 rounded-xl transition-all"
                title="Sign out of CRM"
              >
                <LogOut size={15} className="mr-1.5" />
                Sign out
              </Button>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-bg border border-transparent hover:border-border transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 pt-3 pb-4 space-y-2.5 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-ink text-surface flex items-center justify-center font-serif font-bold text-xs">
                  {userInitials}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-ink">{user.name}</span>
                  <span className="text-[10px] text-ink-soft">Sales Workspace</span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-ink text-surface"
                        : "text-ink hover:bg-bg"
                    )}
                  >
                    <item.icon size={18} className={cn("shrink-0", isActive ? "text-accent" : "text-ink-soft")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
            <div className="pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="w-full justify-center text-xs text-danger hover:bg-danger/10 hover:text-danger hover:border-danger/30 rounded-xl"
              >
                <LogOut size={15} className="mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-border z-40 px-2 py-2 flex justify-around items-center shadow-xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-medium transition-all duration-150",
                isActive
                  ? "text-ink font-bold bg-accent/15"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <item.icon size={18} className={isActive ? "text-accent stroke-[2.5]" : "stroke-[1.75]"} />
              <span className="mt-0.5 whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
