import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Trash2, Plus, UserCog, Key, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/hooks/use-api";

export default function SubAdminsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", password: "", isActive: true });
  const [showEditPassword, setShowEditPassword] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["sub-admins"],
    queryFn: () => fetchApi<any>("/sub-admins"),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => fetchApi<any>("/sub-admins", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-admins"] });
      setShowCreate(false);
      setCreateForm({ name: "", email: "", password: "" });
      toast({ title: "Sub-admin created successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) =>
      fetchApi<any>(`/sub-admins/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-admins"] });
      setEditingId(null);
      toast({ title: "Sub-admin updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi<any>(`/sub-admins/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-admins"] });
      toast({ title: "Sub-admin deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const admins = data?.admins || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    createMutation.mutate(createForm);
  };

  const startEdit = (admin: any) => {
    setEditingId(admin.id);
    setEditForm({ name: admin.name, password: "", isActive: admin.isActive });
    setShowEditPassword(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = { name: editForm.name, isActive: editForm.isActive };
    if (editForm.password) body.password = editForm.password;
    updateMutation.mutate({ id: editingId!, body });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Admin Management
          </h1>
          <p className="text-muted-foreground">Create and manage admin accounts. Only super admin can access this.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Admin
        </button>
      </div>

      {showCreate && (
        <Card className="bg-card border-primary/30 border-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              Create New Admin
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Admin Name"
                    className="w-full h-11 bg-input border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="admin@example.com"
                    className="w-full h-11 bg-input border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Min 4 characters"
                    className="w-full h-11 bg-input border border-border rounded-xl px-4 pr-12 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-3 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={createMutation.isPending} className="px-5 py-2.5 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60">
                  {createMutation.isPending ? "Creating..." : "Create Admin"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 bg-secondary text-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading admins...</div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No admins found</div>
        ) : (
          admins.map((admin: any) => (
            <Card key={admin.id} className={`bg-card border-border ${admin.isSuperAdmin ? "border-primary/50" : ""}`}>
              <CardContent className="p-5">
                {editingId === admin.id ? (
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                          className="w-full h-11 bg-input border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">New Password (optional)</label>
                        <div className="relative">
                          <input
                            type={showEditPassword ? "text" : "password"}
                            value={editForm.password}
                            onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                            placeholder="Leave blank to keep current"
                            className="w-full h-11 bg-input border border-border rounded-xl px-4 pr-12 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button type="button" onClick={() => setShowEditPassword(p => !p)} className="absolute right-3 top-3 text-muted-foreground">
                            {showEditPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`active-${admin.id}`}
                        checked={editForm.isActive}
                        onChange={e => setEditForm(p => ({ ...p, isActive: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`active-${admin.id}`} className="text-sm text-foreground">Account Active</label>
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" disabled={updateMutation.isPending} className="px-5 py-2.5 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60">
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="px-5 py-2.5 bg-secondary text-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${admin.isSuperAdmin ? "bg-primary/20 text-primary" : "bg-secondary text-white"}`}>
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white">{admin.name}</p>
                          {admin.isSuperAdmin && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">Super Admin</span>
                          )}
                          {admin.isActive ? (
                            <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3 h-3" /> Active</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3 h-3" /> Inactive</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                        <p className="text-xs text-muted-foreground">Joined: {new Date(admin.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                    </div>
                    {!admin.isSuperAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(admin)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium rounded-xl transition-colors"
                        >
                          <Key className="w-4 h-4" />
                          Edit / Reset Password
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${admin.name}? This cannot be undone.`)) {
                              deleteMutation.mutate(admin.id);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-medium rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
