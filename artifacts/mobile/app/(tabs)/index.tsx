import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  RefreshControl, Platform, StatusBar, Animated, Dimensions
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Colors } from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function TickerBanner({ results }: { results: any[] }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const text = results.map(r => `${r.marketName}: ${r.resultNumber}`).join("   ★   ");

  useEffect(() => {
    if (!text) return;
    const totalWidth = text.length * 9;
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -totalWidth,
        duration: totalWidth * 40,
        useNativeDriver: true,
      })
    ).start();
  }, [text]);

  if (!text) return null;

  return (
    <View style={styles.ticker}>
      <View style={styles.tickerLabel}>
        <Ionicons name="radio" size={12} color={Colors.gold} />
        <Text style={styles.tickerLabelText}>LIVE</Text>
      </View>
      <View style={styles.tickerScroll}>
        <Animated.Text style={[styles.tickerText, { transform: [{ translateX: scrollX }] }]}>
          {text}{"   ★   "}{text}
        </Animated.Text>
      </View>
    </View>
  );
}

function ResultCard({ result }: { result: any }) {
  return (
    <View style={styles.resultCard}>
      <LinearGradient
        colors={[Colors.crimson, "#8B0000"]}
        style={styles.resultCardInner}
      >
        <Text style={styles.resultMarket}>{result.marketName}</Text>
        <Text style={styles.resultNumber}>{result.resultNumber}</Text>
        <Text style={styles.resultDate}>{result.gameDate}</Text>
      </LinearGradient>
    </View>
  );
}

function MarketCard({ market }: { market: any }) {
  const isOpen = market.isActive;
  return (
    <Pressable
      style={({ pressed }) => [styles.marketCard, pressed && { opacity: 0.85 }]}
      onPress={() => {
        if (!isOpen) return;
        router.push({ pathname: "/bet", params: { marketId: market.id, marketName: market.name } });
      }}
    >
      <View style={styles.marketCardInner}>
        <View style={styles.marketLeft}>
          <View style={styles.marketNameRow}>
            {market.isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            <Text style={styles.marketName}>{market.name}</Text>
          </View>
          <View style={styles.marketMeta}>
            <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.marketTime}>{market.resultTime}</Text>
          </View>
          <View style={styles.gameTypeTags}>
            <View style={styles.gameTag}>
              <Text style={styles.gameTagText}>Jodi 90x</Text>
            </View>
            <View style={styles.gameTag}>
              <Text style={styles.gameTagText}>Haruf 9x</Text>
            </View>
          </View>
        </View>
        <View style={styles.marketRight}>
          <Text style={styles.marketResultLabel}>Result</Text>
          <Text style={styles.marketResult}>{market.latestResult || "---"}</Text>
          <View style={[styles.statusBadge, isOpen ? styles.openBadge : styles.closedBadge]}>
            <Text style={[styles.statusText, isOpen ? styles.openText : styles.closedText]}>
              {isOpen ? "OPEN" : "CLOSED"}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: marketsData, refetch: refetchMarkets } = useQuery({
    queryKey: ["markets"],
    queryFn: api.markets.list,
    refetchInterval: 30000,
  });

  const { data: resultsData, refetch: refetchResults } = useQuery({
    queryKey: ["results"],
    queryFn: api.results.latest,
    refetchInterval: 30000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchMarkets(), refetchResults(), refreshUser()]);
    setRefreshing(false);
  };

  const markets = marketsData?.markets || [];
  const results = (resultsData?.results || []).slice(0, 15);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: Colors.darkBg }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.crimson} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.gold} />}
      >
        {/* Header */}
        <LinearGradient
          colors={[Colors.crimson, "#8B0000", Colors.darkBg]}
          style={[styles.headerGradient, { paddingTop: topPad + 8 }]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.appName}>Haryana Ki Shan</Text>
              <Text style={styles.greeting}>Welcome, {user?.name || "Player"}</Text>
            </View>
            <Pressable
              style={styles.balanceChip}
              onPress={() => router.push("/(tabs)/wallet")}
            >
              <Ionicons name="wallet" size={14} color={Colors.gold} />
              <Text style={styles.balanceText}>₹{parseFloat(user?.walletBalance || "0").toFixed(2)}</Text>
            </Pressable>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn} onPress={() => router.push("/deposit")}>
              <LinearGradient colors={["#22c55e", "#15803d"]} style={styles.actionBtnGrad}>
                <Ionicons name="arrow-down-circle" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Add Money</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => router.push("/withdraw")}>
              <LinearGradient colors={[Colors.gold, "#b8860b"]} style={styles.actionBtnGrad}>
                <Ionicons name="arrow-up-circle" size={20} color="#000" />
                <Text style={[styles.actionBtnText, { color: "#000" }]}>Withdraw</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Promo Cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoRow}>
            <LinearGradient
              colors={[Colors.crimson, "#5D0000"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.promoCard}
            >
              <Text style={styles.promoTitle}>Jodi Game</Text>
              <Text style={styles.promoSub}>₹10 ke ₹900</Text>
              <Text style={styles.promoOdds}>90x Return!</Text>
            </LinearGradient>
            <LinearGradient
              colors={["#7c3aed", "#4c1d95"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.promoCard}
            >
              <Text style={styles.promoTitle}>Haruf Game</Text>
              <Text style={styles.promoSub}>₹10 ke ₹90</Text>
              <Text style={styles.promoOdds}>9x Return!</Text>
            </LinearGradient>
            <LinearGradient
              colors={["#059669", "#064e3b"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.promoCard}
            >
              <Text style={styles.promoTitle}>Multi Bet</Text>
              <Text style={styles.promoSub}>Ek sath kai numbers</Text>
              <Text style={styles.promoOdds}>One Payment!</Text>
            </LinearGradient>
          </ScrollView>
        </LinearGradient>

        {/* Live Ticker */}
        {results.length > 0 && <TickerBanner results={results} />}

        {/* Latest Results Section */}
        {results.length > 0 && (
          <View style={styles.latestResultsSection}>
            <LinearGradient
              colors={[Colors.crimson, "#8B0000"]}
              style={styles.latestResultsHeader}
            >
              <Ionicons name="trophy" size={18} color={Colors.gold} />
              <Text style={styles.latestResultsTitle}>Latest Results</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.livePulse} />
                <Text style={styles.liveIndicatorText}>LIVE</Text>
              </View>
            </LinearGradient>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.resultsRow}>
              {results.map(r => <ResultCard key={r.id} result={r} />)}
            </ScrollView>
          </View>
        )}

        {/* Markets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Markets</Text>
            <Text style={styles.sectionCount}>{markets.length} Markets</Text>
          </View>
          {markets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No markets available</Text>
            </View>
          ) : (
            markets.map(m => <MarketCard key={m.id} market={m} />)
          )}
        </View>

        {/* Footer note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>Min. Deposit: ₹50 | Min. Bet: ₹10</Text>
          <Text style={styles.footerNoteText}>18+ Only | Play Responsibly</Text>
        </View>

        <View style={{ height: Platform.OS === "web" ? 100 : insets.bottom + 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  headerLeft: {},
  appName: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.textPrimary, letterSpacing: 0.5 },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  balanceChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1, borderColor: Colors.gold,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  balanceText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.gold },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  actionBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  actionBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  promoRow: { gap: 12, paddingRight: 16 },
  promoCard: {
    borderRadius: 16, padding: 16, width: 160,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  promoTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.textPrimary },
  promoSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  promoOdds: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.gold, marginTop: 6 },
  ticker: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1a0000", borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: Colors.crimson, paddingVertical: 8, overflow: "hidden",
  },
  tickerLabel: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.crimson, paddingHorizontal: 10, paddingVertical: 6,
    marginRight: 8,
  },
  tickerLabelText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.gold },
  tickerScroll: { flex: 1, overflow: "hidden" },
  tickerText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.gold, whiteSpace: "nowrap" } as any,
  latestResultsSection: {
    marginTop: 20, marginHorizontal: 16,
    borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: Colors.crimson,
  },
  latestResultsHeader: {
    flexDirection: "row", alignItems: "center", gap: 8, padding: 12,
  },
  latestResultsTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.gold, flex: 1 },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 4 },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  liveIndicatorText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#22c55e" },
  resultsRow: { gap: 10, padding: 12 },
  resultCard: { borderRadius: 12, overflow: "hidden" },
  resultCardInner: { padding: 12, alignItems: "center", minWidth: 90, borderRadius: 12 },
  resultMarket: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.8)", marginBottom: 6, textAlign: "center" },
  resultNumber: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.gold, marginBottom: 4 },
  resultDate: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.6)" },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.textPrimary },
  sectionCount: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted },
  marketCard: { marginBottom: 12, borderRadius: 16, overflow: "hidden" },
  marketCardInner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  marketLeft: { flex: 1 },
  marketNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(231,76,60,0.2)",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.error },
  liveText: { fontFamily: "Inter_700Bold", fontSize: 10, color: Colors.error },
  marketName: { fontFamily: "Inter_700Bold", fontSize: 17, color: Colors.textPrimary },
  marketMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  marketTime: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  gameTypeTags: { flexDirection: "row", gap: 6 },
  gameTag: {
    backgroundColor: "rgba(212,160,23,0.15)", borderWidth: 1, borderColor: "rgba(212,160,23,0.3)",
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  gameTagText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.gold },
  marketRight: { alignItems: "flex-end", gap: 6 },
  marketResultLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted },
  marketResult: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.gold },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  openBadge: { backgroundColor: "rgba(34,197,94,0.15)", borderWidth: 1, borderColor: "rgba(34,197,94,0.3)" },
  closedBadge: { backgroundColor: "rgba(239,68,68,0.15)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  openText: { color: "#22c55e" },
  closedText: { color: "#ef4444" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted },
  footerNote: {
    marginHorizontal: 16, marginTop: 16, padding: 12,
    backgroundColor: Colors.surface, borderRadius: 12, alignItems: "center",
    borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  footerNoteText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
});
