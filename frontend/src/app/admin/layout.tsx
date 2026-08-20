"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Building2, LogOut, Users, Inbox, Activity, CreditCard, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  if (!user || user.role !== "ADMIN") return null; // Protected by context, but safe check

  const navItems = [
    { name: "Inbox", href: "/admin/leads/unassigned", icon: Inbox },
    { name: "All Leads", href: "/admin/leads", icon: Users },
    { name: "Performance", href: "/admin/performance", icon: Activity },
    { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
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
                <span className="font-serif text-lg text-ink font-semibold">Admin Ledger</span>
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
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-ink-soft hover:text-ink relative transition-colors rounded-full hover:bg-surface/50"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[8px] text-white"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="p-3 border-b border-border bg-bg/50 flex justify-between items-center">
                      <h3 className="font-semibold text-sm text-ink">Notifications</h3>
                      <span className="text-xs text-ink-soft">{notifications.length} unread</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-ink-soft">No new notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => markAsRead(n.id)}
                            className="p-3 border-b border-border hover:bg-bg/50 cursor-pointer transition-colors"
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
