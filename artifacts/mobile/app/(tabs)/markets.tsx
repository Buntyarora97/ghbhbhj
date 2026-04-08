import React from "react";
import {
  View, Text, FlatList, StyleSheet, Pressable,
  ActivityIndicator, Platform, StatusBar
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Colors } from "@/constants/colors";

export default function MarketsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["markets"],
    queryFn: api.markets.list,
    refetchInterval: 30000,
  });

  const markets = data?.markets || [];

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.crimson + "80", Colors.darkBg]}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <Text style={styles.title}>Markets</Text>
        <Text style={styles.subtitle}>Choose a market to play</Text>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.gold} size="large" />
        </View>
      ) : (
        <FlatList
          data={markets}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 80 }
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={false}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No markets available</Text>
              <Text style={styles.emptyDesc}>Check back later for active markets</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => router.push({ pathname: "/bet", params: { marketId: item.id, marketName: item.name } })}
            >
              <View style={styles.cardLeft}>
                <View style={styles.iconBg}>
                  <Ionicons name="trophy" size={22} color={Colors.gold} />
                </View>
                <View>
                  <Text style={styles.marketName}>{item.name}</Text>
                  <Text style={styles.marketTime}>Result: {item.resultTime}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                {item.latestResult ? (
                  <View style={styles.resultBadge}>
                    <Text style={styles.resultNum}>{item.latestResult}</Text>
                  </View>
                ) : (
                  <Text style={styles.pendingText}>Pending</Text>
                )}
                {item.isLive && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={Colors.gold} style={{ marginLeft: 8 }} />
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.textPrimary },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 20, gap: 12 },
  card: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBg: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.crimson + "40",
    alignItems: "center", justifyContent: "center",
  },
  marketName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.textPrimary },
  marketTime: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  resultBadge: {
    backgroundColor: Colors.crimson,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  resultNum: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.gold },
  pendingText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(231,76,60,0.2)",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.error },
  liveText: { fontFamily: "Inter_700Bold", fontSize: 10, color: Colors.error },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.textPrimary },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textMuted },
});
