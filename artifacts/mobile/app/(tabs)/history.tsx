import React from "react";
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Platform, StatusBar
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Colors } from "@/constants/colors";

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  win: Colors.gold,
  loss: Colors.error,
};

const GAME_TYPE_LABELS: Record<string, string> = {
  jodi: "Jodi",
  single: "Single Digit",
};

function BetCard({ bet }: { bet: any }) {
  const statusColor = STATUS_COLORS[bet.status] || Colors.textMuted;
  const date = new Date(bet.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.marketName}>{bet.marketName}</Text>
          <Text style={styles.gameType}>{GAME_TYPE_LABELS[bet.gameType] || bet.gameType}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {bet.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Number</Text>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{bet.number}</Text>
          </View>
        </View>
        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Bet Amount</Text>
          <Text style={styles.infoValue}>₹{parseFloat(bet.amount).toFixed(2)}</Text>
        </View>
        {bet.status === "win" && bet.winAmount && (
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Won</Text>
            <Text style={[styles.infoValue, { color: Colors.gold }]}>₹{parseFloat(bet.winAmount).toFixed(2)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.dateText}>{date}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-bets"],
    queryFn: api.bets.my,
    refetchInterval: 15000,
  });

  const bets = data?.bets || [];
  const wins = bets.filter((b: any) => b.status === "win").length;
  const totalBet = bets.reduce((s: number, b: any) => s + parseFloat(b.amount), 0);
  const totalWon = bets.filter((b: any) => b.status === "win").reduce((s: number, b: any) => s + parseFloat(b.winAmount || "0"), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={bets}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 80 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        ListHeaderComponent={
          <View>
            <LinearGradient
              colors={[Colors.crimson + "80", Colors.darkBg]}
              style={[styles.header, { paddingTop: topPad + 16 }]}
            >
              <Text style={styles.title}>Bet History</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{bets.length}</Text>
                  <Text style={styles.statLabel}>Total Bets</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: Colors.gold }]}>{wins}</Text>
                  <Text style={styles.statLabel}>Wins</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: Colors.success }]}>₹{totalWon.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Won</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: Colors.error }]}>₹{totalBet.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Spent</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="game-controller-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No bets yet</Text>
              <Text style={styles.emptyDesc}>Place your first bet to see history</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <BetCard bet={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  header: { paddingHorizontal: 20, paddingBottom: 20, marginBottom: 4 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.textPrimary, marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: 12, padding: 12, alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.textPrimary },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  list: { paddingHorizontal: 20, gap: 10 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cardLeft: {},
  marketName: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.textPrimary },
  gameType: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  cardBottom: { flexDirection: "row", gap: 16, marginBottom: 8 },
  infoGroup: {},
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted },
  numberBadge: {
    marginTop: 4, backgroundColor: Colors.crimson,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    alignSelf: "flex-start",
  },
  numberText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.gold },
  infoValue: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.textPrimary, marginTop: 4 },
  dateText: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.textPrimary },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted },
});
