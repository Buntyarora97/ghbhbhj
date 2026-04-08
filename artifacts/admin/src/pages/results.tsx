import React, { useState } from "react";
import { useMarkets, useDeclareResult } from "@/hooks/use-markets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResultsPage() {
  const { data: marketsData, isLoading } = useMarkets();
  const declareResult = useDeclareResult();
  const { toast } = useToast();

  const [marketId, setMarketId] = useState("");
  const [resultNumber, setResultNumber] = useState("");

  const activeMarkets = marketsData?.markets?.filter(m => m.isActive) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketId || !resultNumber) return;

    if (resultNumber.length !== 2 || isNaN(parseInt(resultNumber))) {
      toast({ title: "Invalid Input", description: "Result must be a 2-digit number (00-99)", variant: "destructive" });
      return;
    }

    const market = activeMarkets.find(m => m.id.toString() === marketId);

    if (window.confirm(`Are you sure you want to declare result ${resultNumber} for ${market?.name}? This will automatically process all pending bets.`)) {
      try {
        await declareResult.mutateAsync({ marketId: parseInt(marketId), resultNumber });
        toast({ title: "Success", description: "Result declared and bets processed successfully." });
        setMarketId("");
        setResultNumber("");
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Declare Results</h1>
        <p className="text-muted-foreground">Select a market and enter the winning number to process payouts automatically.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            New Result Declaration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex gap-3 text-destructive items-start">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">Warning: Declaring a result is irreversible. It will automatically calculate wins/losses and credit users' wallets.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">Select Market</label>
                <select
                  required
                  value={marketId}
                  onChange={(e) => setMarketId(e.target.value)}
                  className="flex h-14 w-full rounded-xl border border-border bg-input px-4 py-2 text-base text-foreground shadow-inner focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary appearance-none"
                >
                  <option value="" disabled>-- Select a Market --</option>
                  {isLoading ? (
                    <option disabled>Loading markets...</option>
                  ) : (
                    activeMarkets.map(m => (
                      <option key={m.id} value={m.id}>{m.name} (Time: {m.resultTime})</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">Winning Number (00-99)</label>
                <div className="relative">
                  <Input
                    required
                    type="text"
                    maxLength={2}
                    placeholder="e.g. 42"
                    value={resultNumber}
                    onChange={(e) => setResultNumber(e.target.value.replace(/\D/g, ''))}
                    className="h-20 text-4xl font-display font-bold text-center tracking-widest text-primary placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg" 
              disabled={!marketId || resultNumber.length !== 2}
              isLoading={declareResult.isPending}
            >
              Declare & Process Payouts
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
