import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, Users, AlertTriangle, Filter } from "lucide-react";
import { fetchApi } from "@/hooks/use-api";

function useMarkets() {
  return useQuery({
    queryKey: ["markets"],
    queryFn: () => fetchApi<any>("/markets"),
  });
}

function useBetAnalytics(marketId?: number, gameType?: string) {
  return useQuery({
    queryKey: ["bet-analytics", marketId, gameType],
    queryFn: () => {
      const params = new URLSearchParams();
      if (marketId) params.set("marketId", marketId.toString());
      if (gameType) params.set("gameType", gameType);
      return fetchApi<any>(`/bet-analytics?${params.toString()}`);
    },
  });
}

export default function AnalyticsPage() {
  const [marketId, setMarketId] = useState<number | undefined>(undefined);
  const [gameType, setGameType] = useState<string>("");

  const { data: marketsData } = useMarkets();
  const { data, isLoading } = useBetAnalytics(marketId, gameType || undefined);

  const allMarkets = marketsData?.markets || [];

  const getMultiplier = (gt: string) => gt === "jodi" ? 90 : 9;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Bet Analytics</h1>
          <p className="text-muted-foreground">Live exposure — see which numbers have the most money at stake.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-48">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={marketId || ""}
              onChange={(e) => setMarketId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="flex h-10 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary appearance-none"
            >
              <option value="">All Markets</option>
              {allMarkets.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <select
            value={gameType}
            onChange={(e) => setGameType(e.target.value)}
            className="flex h-10 w-32 rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary appearance-none"
          >
            <option value="">All Types</option>
            <option value="jodi">Jodi</option>
            <option value="haruf">Haruf</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-secondary/30">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Collection</p>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(data?.totalCollected || 0)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-destructive/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Paid Out</p>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(data?.totalPayout || 0)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-emerald-900/30">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
              <h3 className={`text-2xl font-bold ${parseFloat(data?.netProfit || '0') >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(data?.netProfit || 0)}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-border/50 bg-secondary/10 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <div>
            <h3 className="text-lg font-bold text-white">Number Liabilities (Jisbpe sbse jyada paisa lga h)</h3>
            <p className="text-sm text-muted-foreground">Numbers sorted by total bets placed. High risk = jyada loss potential.</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Game Type</TableHead>
              <TableHead>Total Bets</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Bet Count</TableHead>
              <TableHead>Potential Payout</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : !data?.analytics || data.analytics.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No bets placed yet</TableCell></TableRow>
            ) : (
              data.analytics.map((item: any, idx: number) => {
                const isHighRisk = idx < 3;
                const multiplier = getMultiplier(item.gameType);
                const payout = parseFloat(item.totalAmount) * multiplier;
                return (
                  <TableRow key={`${item.gameType}-${item.number}`} className={isHighRisk ? "bg-red-500/5" : ""}>
                    <TableCell className="text-muted-foreground font-mono text-sm">{idx + 1}</TableCell>
                    <TableCell>
                      <span className={`font-display text-2xl font-bold ${isHighRisk ? 'text-destructive' : 'text-primary'}`}>
                        {item.number}
                      </span>
                      {isHighRisk && (
                        <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                          HIGH RISK
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        item.gameType === "jodi"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-purple-500/20 text-purple-400"
                      }`}>
                        {item.gameType === "jodi" ? "Jodi (90x)" : "Haruf (9x)"}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-white text-lg">
                      {formatCurrency(item.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-4 h-4" /> {item.usersCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.betCount}</TableCell>
                    <TableCell className={`font-mono font-bold ${isHighRisk ? 'text-red-400' : 'text-orange-400'}`}>
                      {formatCurrency(payout)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
