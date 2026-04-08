import React from "react";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Users, UserCheck, ArrowDownToLine, ArrowUpFromLine, Gamepad2, Trophy, Landmark, Banknote, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Active Users (30d)", value: stats?.activeUsers, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
    { title: "Total Deposits", value: formatCurrency(stats?.totalDeposits || 0), icon: ArrowDownToLine, color: "text-primary", bg: "bg-primary/10" },
    { title: "Total Withdrawals", value: formatCurrency(stats?.totalWithdrawals || 0), icon: ArrowUpFromLine, color: "text-red-500", bg: "bg-red-500/10" },
    { title: "Total Bets", value: formatCurrency(stats?.totalBets || 0), icon: Gamepad2, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Total Winnings", value: formatCurrency(stats?.totalWinnings || 0), icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { title: "Net Profit", value: formatCurrency(stats?.netProfit || 0), icon: Landmark, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Est. Tax", value: formatCurrency(stats?.taxAmount || 0), icon: Banknote, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  // Dummy chart data for visualization since API doesn't provide historical series
  const chartData = [
    { name: "Mon", deposits: 4000, withdrawals: 2400 },
    { name: "Tue", deposits: 3000, withdrawals: 1398 },
    { name: "Wed", deposits: 2000, withdrawals: 9800 },
    { name: "Thu", deposits: 2780, withdrawals: 3908 },
    { name: "Fri", deposits: 1890, withdrawals: 4800 },
    { name: "Sat", deposits: 2390, withdrawals: 3800 },
    { name: "Sun", deposits: 3490, withdrawals: 4300 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Overview</h1>
        <p className="text-muted-foreground">Welcome back. Here's what's happening today.</p>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(stats?.pendingDeposits > 0 || stats?.pendingWithdrawals > 0) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-4 mb-4"
          >
            {stats?.pendingDeposits > 0 && (
              <div className="flex-1 bg-gradient-to-r from-blue-900/40 to-blue-800/20 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-blue-100 font-semibold">{stats.pendingDeposits} Pending Deposits</h4>
                  <p className="text-blue-300/70 text-sm">Require your approval</p>
                </div>
              </div>
            )}
            {stats?.pendingWithdrawals > 0 && (
              <div className="flex-1 bg-gradient-to-r from-red-900/40 to-red-800/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h4 className="text-red-100 font-semibold">{stats.pendingWithdrawals} Pending Withdrawals</h4>
                  <p className="text-red-300/70 text-sm">Require your approval</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="mt-8">
        <div className="p-6 border-b border-border/50">
          <h3 className="text-xl font-display font-semibold text-white">Financial Activity (Weekly)</h3>
        </div>
        <CardContent className="p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff50" tick={{ fill: '#ffffff50' }} />
                <YAxis stroke="#ffffff50" tick={{ fill: '#ffffff50' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#1A0A0A', borderColor: '#3D1515', color: '#fff', borderRadius: '12px' }}
                />
                <Bar dataKey="deposits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Deposits" />
                <Bar dataKey="withdrawals" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Withdrawals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
