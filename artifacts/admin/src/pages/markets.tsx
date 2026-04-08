import React, { useState } from "react";
import { useMarkets, useCreateMarket, useUpdateMarket, useDeleteMarket } from "@/hooks/use-markets";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Store, Clock, Trophy } from "lucide-react";

export default function MarketsPage() {
  const { data, isLoading } = useMarkets();
  const createMarket = useCreateMarket();
  const updateMarket = useUpdateMarket();
  const deleteMarket = useDeleteMarket();

  const [modal, setModal] = useState<{ open: boolean; market: any | null }>({ open: false, market: null });
  const [formData, setFormData] = useState({ name: "", resultTime: "", isActive: true });

  const markets = data?.markets || [];

  const openModal = (market?: any) => {
    if (market) {
      setFormData({ name: market.name, resultTime: market.resultTime, isActive: market.isActive });
      setModal({ open: true, market });
    } else {
      setFormData({ name: "", resultTime: "", isActive: true });
      setModal({ open: true, market: null });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal.market) {
      await updateMarket.mutateAsync({ id: modal.market.id, ...formData });
    } else {
      await createMarket.mutateAsync(formData);
    }
    setModal({ open: false, market: null });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this market? This cannot be undone.")) {
      deleteMarket.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Markets</h1>
          <p className="text-muted-foreground">Manage gaming markets and timings.</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2">
          <Plus className="w-5 h-5" /> Add Market
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          markets.map((market) => (
            <div key={market.id} className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full ${market.isActive ? 'bg-primary' : 'bg-muted'}`} />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center border border-border">
                    <Store className={`w-6 h-6 ${market.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">{market.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${market.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {market.isActive ? 'Active' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  Result Time: <span className="text-white font-medium">{market.resultTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Trophy className="w-4 h-4 text-primary" />
                  Latest Result: <span className="text-primary font-bold text-lg ml-1 bg-primary/10 px-2 rounded">{market.latestResult || "---"}</span>
                </div>
              </div>

              <div className="flex gap-2 border-t border-border/50 pt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openModal(market)}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="danger" size="icon" onClick={() => handleDelete(market.id)} disabled={deleteMarket.isPending}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog 
        open={modal.open} 
        onOpenChange={(open) => !open && setModal({ open: false, market: null })}
        title={modal.market ? "Edit Market" : "Add New Market"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Market Name</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Gali, Desawar"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Result Time</label>
            <Input
              required
              value={formData.resultTime}
              onChange={(e) => setFormData({ ...formData, resultTime: e.target.value })}
              placeholder="e.g. 11:00 PM"
            />
          </div>
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-secondary/20 mt-2">
            <input
              type="checkbox"
              id="isActive"
              className="w-5 h-5 accent-primary rounded border-border"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-white font-medium select-none cursor-pointer">
              Market is currently Active (Accepting Bets)
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setModal({ open: false, market: null })}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMarket.isPending || updateMarket.isPending}>
              {modal.market ? "Save Changes" : "Create Market"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
