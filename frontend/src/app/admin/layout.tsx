"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { LogOut, Users, Inbox, Activity, CreditCard, Bell, Briefcase, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || user.role !== "ADMIN") return null;

  const navItems = [
    { name: "Inbox", href: "/admin/leads/unassigned", icon: Inbox },
    { name: "All Leads", href: "/admin/leads", icon: Users },
    { name: "Performance", href: "/admin/performance", icon: Activity },
    { name: "Deals", href: "/admin/deals", icon: Briefcase },
    { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top Navigation */}
      <header className="bg-surface border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
            {/* Brand Logo & Title */}
            <div className="flex items-center">
              <Link href="/admin/leads/unassigned" className="flex items-center gap-2.5 sm:gap-3 pr-2 sm:pr-4 group">
                <div className="h-9 w-12 sm:h-10 sm:w-14 rounded-lg bg-white p-1 border border-border/50 shadow-sm flex items-center justify-center shrink-0">
                  <img
                    src="/logo.png"
                    alt="BKD Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-base sm:text-lg text-ink font-bold leading-tight group-hover:text-accent transition-colors">
                    BKD CRM
                  </span>
                  <span className="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">
                    Admin Ledger
                  </span>
                </div>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:ml-4 md:flex md:space-x-1 lg:space-x-3 xl:space-x-6">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "inline-flex items-center px-2 pt-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap",
                        isActive
                          ? "border-accent text-ink font-semibold"
                          : "border-transparent text-ink-soft hover:text-ink hover:border-border"
                      )}
                    >
                      <item.icon size={16} className="mr-1.5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-ink-soft hover:text-ink relative transition-colors rounded-lg hover:bg-bg/80"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-border bg-bg/50 flex justify-between items-center">
                      <h3 className="font-semibold text-sm text-ink">Notifications</h3>
                      <span className="text-xs text-ink-soft">{notifications.length} unread</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-ink-soft">No new notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => markAsRead(n.id)}
                            className="p-3 hover:bg-bg/50 cursor-pointer transition-colors"
                          >
                            <p className="text-sm text-ink">{n.message}</p>
                            <span className="text-xs text-ink-soft mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop User Info & Sign Out */}
              <span className="text-xs sm:text-sm text-ink-soft hidden lg:block whitespace-nowrap">
                Signed in as <strong className="text-ink">{user.name}</strong>
              </span>
              <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:inline-flex">
                <LogOut size={16} className="mr-1.5" />
                Sign out
              </Button>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-ink-soft hover:text-ink hover:bg-bg transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 pt-3 pb-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="pb-2 border-b border-border text-xs text-ink-soft">
              Signed in as <strong className="text-ink">{user.name}</strong> ({user.role})
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
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent/10 text-accent font-semibold"
                        : "text-ink hover:bg-bg"
                    )}
                  >
                    <item.icon size={18} className="shrink-0" />
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
                className="w-full justify-center text-danger hover:bg-danger/10 hover:text-danger hover:border-danger/30"
              >
                <LogOut size={16} className="mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border z-40 px-1 py-1.5 flex justify-around items-center shadow-lg">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all",
                isActive
                  ? "text-accent font-bold"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <item.icon size={18} className={isActive ? "stroke-[2.5]" : "stroke-[1.75]"} />
              <span className="mt-0.5 whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
