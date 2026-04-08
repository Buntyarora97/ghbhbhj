import React, { useState } from "react";
import { useUpiAccounts, useAddUpiAccount, useDeleteUpiAccount } from "@/hooks/use-upi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { CreditCard, Trash2, Plus, QrCode } from "lucide-react";

export default function UpiPage() {
  const { data, isLoading } = useUpiAccounts();
  const addUpi = useAddUpiAccount();
  const deleteUpi = useDeleteUpiAccount();

  const [modalOpen, setModalOpen] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [holderName, setHolderName] = useState("");

  const accounts = data?.upiAccounts || [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId) return;
    await addUpi.mutateAsync({ upiId, holderName });
    setModalOpen(false);
    setUpiId("");
    setHolderName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Deposit UPI Accounts</h1>
          <p className="text-muted-foreground">Manage the UPI IDs shown to users for making deposits.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="w-5 h-5" /> Add UPI Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : accounts.length === 0 ? (
          <div className="col-span-full p-12 bg-card border border-border rounded-2xl text-center text-muted-foreground flex flex-col items-center">
            <QrCode className="w-12 h-12 mb-4 opacity-50" />
            <p>No UPI accounts added yet.</p>
            <p className="text-sm">Users will not be able to deposit until you add at least one.</p>
          </div>
        ) : (
          accounts.map((acc, index) => (
            <Card key={acc.id} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-6xl font-display font-bold">#{index + 1}</span>
              </div>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 border border-primary/30">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-mono font-bold text-xl text-white mb-1 truncate" title={acc.upiId}>{acc.upiId}</h3>
                <p className="text-muted-foreground text-sm mb-6">{acc.holderName || "No Name Provided"}</p>
                
                <div className="flex justify-between items-center border-t border-border/50 pt-4 mt-auto">
                  <span className="text-xs font-medium bg-green-500/10 text-green-400 px-2 py-1 rounded">Active in Rotation</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10 hover:text-red-400"
                    onClick={() => {
                      if(window.confirm("Delete this UPI account?")) deleteUpi.mutate(acc.id);
                    }}
                    disabled={deleteUpi.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen} title="Add UPI Account">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">UPI ID</label>
            <Input
              required
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourname@paytm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Holder Name (Optional)</label>
            <Input
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="e.g. Haryana Ki Shan"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={addUpi.isPending}>Add Account</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
