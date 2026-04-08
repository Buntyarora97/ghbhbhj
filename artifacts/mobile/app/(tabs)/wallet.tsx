import React from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, Platform, StatusBar
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Colors } from "@/constants/colors";

const TYPE_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  deposit: { icon: "arrow-down-circle", color: Colors.success },
  withdraw: { icon: "arrow-up-circle", color: Colors.error },
  bet: { icon: "game-controller", color: Colors.warning },
  win: { icon: "trophy", color: Colors.gold },
  loss: { icon: "close-circle", color: Colors.error },
  referral_bonus: { icon: "gift", color: Colors.info },
};

function TransactionItem({ tx }: { tx: any }) {
  const meta = TYPE_ICONS[tx.type] || { icon: "swap-horizontal", color: Colors.textMuted };
  const isCredit = ["deposit", "win", "referral_bonus"].includes(tx.type);
  const date = new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <View style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: meta.color + "20" }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc}>{tx.description || tx.type.replace("_", " ")}</Text>
        <Text style={styles.txDate}>{date}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[styles.txAmount, { color: isCredit ? Colors.success : Colors.error }]}>
          {isCredit ? "+" : "-"}₹{parseFloat(tx.amount).toFixed(2)}
        </Text>
        <Text style={[styles.txStatus, { color: tx.status === "completed" ? Colors.success : Colors.warning }]}>
          {tx.status}
        </Text>
      </View>
    </View>
  );
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 100 : insets.bottom + 80;

  const { data, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: api.wallet.transactions,
    refetchInterval: 15000,
  });

  const transactions = data?.transactions || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[Colors.crimson, Colors.darkBg]}
          style={[styles.header, { paddingTop: topPad + 16 }]}
        >
          <Text style={styles.headerTitle}>Wallet</Text>
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={[Colors.crimsonLight, Colors.crimson]}
              style={styles.balanceGradient}
            >
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>
                ₹{parseFloat(user?.walletBalance || "0").toFixed(2)}
              </Text>
              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => router.push("/deposit")}
                >
                  <Ionicons name="add-circle" size={20} color={Colors.darkBg} />
                  <Text style={styles.actionText}>Add Money</Text>
                </Pressable>
                <View style={styles.actionDivider} />
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => router.push("/withdraw")}
                >
                  <Ionicons name="arrow-up-circle" size={20} color={Colors.darkBg} />
                  <Text style={styles.actionText}>Withdraw</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        </LinearGradient>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Won", value: transactions.filter((t: any) => t.type === "win").reduce((s: number, t: any) => s + parseFloat(t.amount), 0), color: Colors.gold },
            { label: "Deposited", value: transactions.filter((t: any) => t.type === "deposit").reduce((s: number, t: any) => s + parseFloat(t.amount), 0), color: Colors.success },
            { label: "Withdrawn", value: transactions.filter((t: any) => t.type === "withdraw").reduce((s: number, t: any) => s + parseFloat(t.amount), 0), color: Colors.error },
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statAmount, { color: stat.color }]}>₹{stat.value.toFixed(0)}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          {isLoading ? (
            <ActivityIndicator color={Colors.gold} style={{ marginTop: 20 }} />
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((tx: any) => <TransactionItem key={tx.id} tx={tx} />)
          )}
        </View>
        <View style={{ height: botPad }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.textPrimary, marginBottom: 16 },
  balanceCard: { borderRadius: 20, overflow: "hidden" },
  balanceGradient: {
    padding: 24, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(212,160,23,0.3)",
  },
  balanceLabel: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.gold + "CC" },
  balanceAmount: { fontFamily: "Inter_700Bold", fontSize: 36, color: Colors.textPrimary, marginTop: 4 },
  actions: {
    flexDirection: "row", marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12, overflow: "hidden",
  },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  actionDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  actionText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.darkBg },
  statsRow: {
    flexDirection: "row", paddingHorizontal: 20, gap: 12, marginTop: 20,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: 14, padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  statAmount: { fontFamily: "Inter_700Bold", fontSize: 16 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.textPrimary, marginBottom: 14 },
  txItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txDesc: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textPrimary, textTransform: "capitalize" },
  txDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  txAmount: { fontFamily: "Inter_700Bold", fontSize: 15 },
  txStatus: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2, textTransform: "capitalize" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted },
});
