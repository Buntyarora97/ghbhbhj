import React, { useState } from "react";
import { useUsers, useBlockUser, useEditBalance } from "@/hooks/use-users";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Ban, CheckCircle, Wallet, History } from "lucide-react";

export default function UsersPage() {
  const { data, isLoading } = useUsers();
  const blockUser = useBlockUser();
  const editBalance = useEditBalance();
  
  const [search, setSearch] = useState("");
  const [balanceModal, setBalanceModal] = useState<{ open: boolean; user: any | null }>({ open: false, user: null });
  const [amount, setAmount] = useState("");
  const [operation, setOperation] = useState<"add" | "subtract" | "set">("add");

  const users = data?.users || [];
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.phone.includes(search)
  );

  const handleEditBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModal.user || !amount) return;
    
    await editBalance.mutateAsync({
      id: balanceModal.user.id,
      amount: parseFloat(amount),
      operation
    });
    setBalanceModal({ open: false, user: null });
    setAmount("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Users Directory</h1>
          <p className="text-muted-foreground">Manage players, balances, and access.</p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Details</TableHead>
              <TableHead>Phone / UPI</TableHead>
              <TableHead>Wallet Balance</TableHead>
              <TableHead>Referral Info</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No users found</TableCell></TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className={user.isBlocked ? "opacity-50" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-white">{user.phone}</p>
                    <p className="text-xs text-muted-foreground">{user.upiId || 'No UPI'}</p>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-primary text-lg">
                      {formatCurrency(user.walletBalance)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">Code: <span className="text-primary tracking-wider">{user.referralCode}</span></p>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBalanceModal({ open: true, user })}
                        title="Edit Balance"
                      >
                        <Wallet className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={user.isBlocked ? "primary" : "danger"}
                        size="sm"
                        onClick={() => blockUser.mutate({ id: user.id, isBlocked: !user.isBlocked })}
                        isLoading={blockUser.isPending}
                        title={user.isBlocked ? "Unblock User" : "Block User"}
                      >
                        {user.isBlocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog 
        open={balanceModal.open} 
        onOpenChange={(open) => !open && setBalanceModal({ open: false, user: null })}
        title="Edit Wallet Balance"
        description={`Adjust balance for ${balanceModal.user?.name}`}
      >
        <form onSubmit={handleEditBalance} className="space-y-4">
          <div className="p-4 bg-secondary/30 rounded-xl mb-4 border border-border">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(balanceModal.user?.walletBalance || 0)}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "add", label: "Add (+)" },
              { id: "subtract", label: "Subtract (-)" },
              { id: "set", label: "Set (=)" }
            ].map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setOperation(op.id as any)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  operation === op.id 
                    ? "bg-primary text-black border-primary" 
                    : "bg-card border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">Amount (₹)</label>
            <Input
              type="number"
              required
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setBalanceModal({ open: false, user: null })}>
              Cancel
            </Button>
            <Button type="submit" isLoading={editBalance.isPending}>
              Update Balance
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
