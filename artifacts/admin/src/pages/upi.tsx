import React, { useState, useRef } from "react";
import { useUpiAccounts, useAddUpiAccount, useDeleteUpiAccount, useUpdateUpiAccount } from "@/hooks/use-upi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { CreditCard, Trash2, Plus, QrCode, Upload, X, ImageIcon, Pencil } from "lucide-react";

function QrUploadBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-muted-foreground mb-1.5">
        QR Code Image (Optional)
      </label>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="QR Code"
            className="w-40 h-40 object-contain rounded-xl border border-border bg-white p-2"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center hover:opacity-80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors gap-2 text-sm"
        >
          <Upload className="w-6 h-6" />
          <span>Upload QR Image</span>
          <span className="text-xs opacity-60">PNG / JPG / JPEG</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {!value && (
        <p className="text-xs text-muted-foreground">
          Upload your UPI app QR code image. Users will see this to scan & pay.
        </p>
      )}
    </div>
  );
}

export default function UpiPage() {
  const { data, isLoading } = useUpiAccounts();
  const addUpi = useAddUpiAccount();
  const deleteUpi = useDeleteUpiAccount();
  const updateUpi = useUpdateUpiAccount();

  const [modalOpen, setModalOpen] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [holderName, setHolderName] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQrImageUrl, setEditQrImageUrl] = useState("");

  const accounts = data?.upiAccounts || [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId) return;
    await addUpi.mutateAsync({ upiId, holderName, qrImageUrl: qrImageUrl || undefined });
    setModalOpen(false);
    setUpiId("");
    setHolderName("");
    setQrImageUrl("");
  };

  const handleOpenEdit = (acc: any) => {
    setEditingId(acc.id);
    setEditQrImageUrl(acc.qrImageUrl || "");
    setEditModalOpen(true);
  };

  const handleSaveQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    await updateUpi.mutateAsync({ id: editingId, qrImageUrl: editQrImageUrl || null });
    setEditModalOpen(false);
    setEditingId(null);
    setEditQrImageUrl("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Deposit UPI Accounts</h1>
          <p className="text-muted-foreground">Manage the UPI IDs and QR codes shown to users for making deposits.</p>
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
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono font-bold text-xl text-white mb-1 truncate" title={acc.upiId}>{acc.upiId}</h3>
                    <p className="text-muted-foreground text-sm">{acc.holderName || "No Name Provided"}</p>
                  </div>
                </div>

                {/* QR Image preview */}
                <div className="mb-4">
                  {acc.qrImageUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={acc.qrImageUrl}
                        alt="QR Code"
                        className="w-36 h-36 object-contain rounded-xl border border-border bg-white p-2"
                      />
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <QrCode className="w-3 h-3" /> QR Scanner Active
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4 rounded-xl border border-dashed border-border text-muted-foreground">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <span className="text-xs">No QR image uploaded</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-border/50 pt-4">
                  <span className="text-xs font-medium bg-green-500/10 text-green-400 px-2 py-1 rounded">Active in Rotation</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:bg-primary/10"
                      onClick={() => handleOpenEdit(acc)}
                      title="Update QR Code"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-red-400"
                      onClick={() => {
                        if (window.confirm("Delete this UPI account?")) deleteUpi.mutate(acc.id);
                      }}
                      disabled={deleteUpi.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add UPI Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen} title="Add UPI Account">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">UPI ID *</label>
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
          <QrUploadBox value={qrImageUrl} onChange={setQrImageUrl} />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={addUpi.isPending}>Add Account</Button>
          </div>
        </form>
      </Dialog>

      {/* Edit QR Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen} title="Update QR Code">
        <form onSubmit={handleSaveQr} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload or replace the QR code image for this UPI account. This image will be shown to users during deposit.
          </p>
          <QrUploadBox value={editQrImageUrl} onChange={setEditQrImageUrl} />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={updateUpi.isPending}>Save QR Code</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
