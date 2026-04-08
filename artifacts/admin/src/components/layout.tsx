import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Users, Store, Trophy, 
  ArrowDownCircle, ArrowUpCircle, CreditCard, 
  BarChart3, LogOut, Crown, Menu, Shield, UserCog
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/markets", label: "Markets", icon: Store },
  { href: "/results", label: "Declare Results", icon: Trophy },
  { href: "/deposits", label: "Deposits", icon: ArrowDownCircle },
  { href: "/withdrawals", label: "Withdrawals", icon: ArrowUpCircle },
  { href: "/upi", label: "UPI Accounts", icon: CreditCard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/sub-admins", label: "Admin Management", icon: Shield, superAdminOnly: true },
  { href: "/my-account", label: "My Account", icon: UserCog },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, adminUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isSuperAdmin = adminUser?.isSuperAdmin;

  const visibleNavItems = NAV_ITEMS.filter(item => !item.superAdminOnly || isSuperAdmin);

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3 border-b border-border/50 bg-secondary/20">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center shadow-lg shadow-primary/20">
          <Crown className="w-6 h-6 text-black" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg text-white leading-tight">Haryana Ki Shan</h1>
          <p className="text-xs text-primary font-medium tracking-widest uppercase">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive 
                  ? "text-primary font-medium bg-primary/10" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5",
                item.superAdminOnly && "border border-primary/20 mt-2"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
              )}
              <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-primary", item.superAdminOnly && "text-primary/70")} />
              <span>{item.label}</span>
              {item.superAdminOnly && (
                <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">SA</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="px-4 py-3 mb-2 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">
            {adminUser?.name?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-white truncate">{adminUser?.name || "Admin"}</p>
              {isSuperAdmin && <Crown className="w-3 h-3 text-primary shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{adminUser?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <aside className="hidden lg:flex w-72 flex-col bg-card border-r border-border relative z-20">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 flex flex-col lg:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center px-4 lg:px-8 shrink-0 sticky top-0 z-30 justify-between lg:justify-end">
          <button 
            className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            {isSuperAdmin && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                <Crown className="w-3 h-3" />
                Super Admin
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              System Active
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 animate-in relative">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
