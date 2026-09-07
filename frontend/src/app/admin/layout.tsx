"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import { LogOut, Users, Inbox, Activity, CreditCard, Bell, Briefcase, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
  }, [pathname]);

  // Click outside listener for notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

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

  // Get user initials
  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AD";

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-surface/95 backdrop-blur-md border-b border-border sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-3 sm:gap-6">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-4 lg:gap-8 shrink-0">
              <Link 
                href="/admin/leads/unassigned" 
                className="flex items-center gap-3 group shrink-0"
              >
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
                      Admin
                    </span>
                  </div>
                  <span className="text-[10px] text-ink-soft uppercase tracking-widest font-medium">
                    Ledger & Operations
                  </span>
                </div>
              </Link>

              {/* Desktop Nav - Modern Pill Style */}
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
                      <item.icon 
                        size={16} 
                        className={cn("transition-colors", isActive ? "text-accent" : "text-ink-soft")} 
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={cn(
                    "p-2 text-ink-soft hover:text-ink relative transition-all rounded-xl border border-transparent hover:border-border hover:bg-bg/80",
                    showNotifications && "bg-bg border-border text-ink"
                  )}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2.5 w-80 sm:w-88 bg-surface/98 backdrop-blur-md border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                    <div className="p-3.5 border-b border-border bg-bg/50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Bell size={15} className="text-accent" />
                        <h3 className="font-semibold text-xs text-ink uppercase tracking-wider">Notifications</h3>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold border border-accent/20">
                        {notifications.length} unread
                      </span>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto divide-y divide-border/60">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-ink-soft space-y-1">
                          <p className="font-medium text-ink">All caught up!</p>
                          <p>No unread notifications at this moment.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => markAsRead(n.id)}
                            className="p-3.5 hover:bg-bg/60 cursor-pointer transition-colors space-y-1"
                          >
                            <p className="text-xs text-ink leading-snug">{n.message}</p>
                            <span className="text-[10px] font-mono text-ink-soft block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                    Administrator
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

        {/* Mobile Navigation Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 pt-3 pb-4 space-y-2.5 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-ink text-surface flex items-center justify-center font-serif font-bold text-xs">
                  {userInitials}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-ink">{user.name}</span>
                  <span className="text-[10px] text-ink-soft">Admin Account</span>
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
