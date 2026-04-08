import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { fetchApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound, UserCircle, ShieldCheck, LogOut } from "lucide-react";

function PasswordInput({ value, onChange, placeholder, id }: any) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function MyAccountPage() {
  const { adminUser, logout } = useAuth();
  const { toast } = useToast();

  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [emailForm, setEmailForm] = useState({ currentPassword: "", newEmail: "" });

  const changePwdMutation = useMutation({
    mutationFn: () =>
      fetchApi<any>("/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passForm.currentPassword,
          newPassword: passForm.newPassword,
        }),
      }),
    onSuccess: (data) => {
      toast({ title: "Password Changed!", description: data.message });
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to change password", variant: "destructive" });
    },
  });

  const changeEmailMutation = useMutation({
    mutationFn: () =>
      fetchApi<any>("/change-email", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: emailForm.currentPassword,
          newEmail: emailForm.newEmail,
        }),
      }),
    onSuccess: (data) => {
      toast({ title: "Username Changed!", description: data.message + " Logging out..." });
      setEmailForm({ currentPassword: "", newEmail: "" });
      setTimeout(() => logout(), 2000);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to change username", variant: "destructive" });
    },
  });

  const handleChangePwd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passForm.currentPassword || !passForm.newPassword || !passForm.confirmPassword) {
      toast({ title: "Error", description: "Sab fields fill karo", variant: "destructive" });
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast({ title: "Error", description: "New password aur confirm password match nahi kar rahe", variant: "destructive" });
      return;
    }
    if (passForm.newPassword.length < 6) {
      toast({ title: "Error", description: "New password kam se kam 6 characters ka hona chahiye", variant: "destructive" });
      return;
    }
    changePwdMutation.mutate();
  };

  const handleChangeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.currentPassword || !emailForm.newEmail) {
      toast({ title: "Error", description: "Sab fields fill karo", variant: "destructive" });
      return;
    }
    changeEmailMutation.mutate();
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">My Account</h1>
        <p className="text-muted-foreground">Apna password ya username yahan se change karo</p>
      </div>

      <Card className="bg-gradient-to-br from-card to-secondary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <UserCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{adminUser?.name || "Admin"}</h3>
              <p className="text-muted-foreground text-sm">{adminUser?.email}</p>
              {adminUser?.isSuperAdmin && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Super Admin
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border/50 bg-secondary/10 flex items-center gap-3">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-white">Password Change Karo</h3>
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleChangePwd} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password (Purana password)</Label>
              <PasswordInput
                id="current-password"
                value={passForm.currentPassword}
                onChange={(e: any) => setPassForm(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Purana password likho"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password (Naya password)</Label>
              <PasswordInput
                id="new-password"
                value={passForm.newPassword}
                onChange={(e: any) => setPassForm(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="Naya password likho (kam se kam 6 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password (Dubara likho)</Label>
              <PasswordInput
                id="confirm-password"
                value={passForm.confirmPassword}
                onChange={(e: any) => setPassForm(p => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Naya password dubara likho"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={changePwdMutation.isPending}
            >
              {changePwdMutation.isPending ? "Changing..." : "Password Change Karo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border/50 bg-secondary/10 flex items-center gap-3">
          <UserCircle className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Username / Login ID Change Karo</h3>
        </div>
        <CardContent className="p-6">
          <p className="text-sm text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-5">
            Username change karne ke baad automatically logout ho jayega. Naye username se dobara login karna hoga.
          </p>
          <form onSubmit={handleChangeEmail} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email-current-password">Current Password (Verify karne ke liye)</Label>
              <PasswordInput
                id="email-current-password"
                value={emailForm.currentPassword}
                onChange={(e: any) => setEmailForm(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Apna current password likho"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Naya Username / Login ID</Label>
              <Input
                id="new-email"
                type="text"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm(p => ({ ...p, newEmail: e.target.value }))}
                placeholder="Naya username ya email likho"
              />
              <p className="text-xs text-muted-foreground">Ye wahi cheez hai jo login screen pe email/username ki jagah dalte ho</p>
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              disabled={changeEmailMutation.isPending}
            >
              {changeEmailMutation.isPending ? "Changing..." : "Username Change Karo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border border-red-500/20 rounded-2xl overflow-hidden">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Logout</h3>
            <p className="text-sm text-muted-foreground">Admin panel se bahar aao</p>
          </div>
          <Button
            variant="outline"
            onClick={logout}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
