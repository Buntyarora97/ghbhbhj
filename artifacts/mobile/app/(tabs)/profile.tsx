import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Alert, Platform, StatusBar, Share
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Colors } from "@/constants/colors";

function MenuItem({ icon, label, value, onPress, danger }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.menuIcon, danger && { backgroundColor: Colors.error + "20" }]}>
        <Ionicons name={icon} size={18} color={danger ? Colors.error : Colors.gold} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, danger && { color: Colors.error }]}>{label}</Text>
        {value && <Text style={styles.menuValue}>{value}</Text>}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 100 : insets.bottom + 80;

  const { data: referralData } = useQuery({
    queryKey: ["referral-info"],
    queryFn: api.auth.referralInfo,
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Play Haryana Ki Shan! Use my referral code: ${user?.referralCode} to get bonus. Download now!`,
        title: "Haryana Ki Shan Referral",
      });
    } catch (e) {}
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[Colors.crimson, Colors.darkBg]}
          style={[styles.header, { paddingTop: topPad + 16 }]}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userPhone}>{user?.phone}</Text>
            </View>
          </View>

          <View style={styles.walletCard}>
            <Ionicons name="wallet" size={20} color={Colors.gold} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <Text style={styles.walletBalance}>₹{parseFloat(user?.walletBalance || "0").toFixed(2)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Referral Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referral Program</Text>
          <View style={styles.referralCard}>
            <LinearGradient
              colors={["#2C1000", Colors.surface]}
              style={styles.referralInner}
            >
              <View style={styles.referralTop}>
                <View>
                  <Text style={styles.referralLabel}>Your Code</Text>
                  <Text style={styles.referralCode}>{user?.referralCode}</Text>
                </View>
                <Pressable style={styles.shareBtn} onPress={handleShare}>
                  <Ionicons name="share-social" size={16} color={Colors.darkBg} />
                  <Text style={styles.shareBtnText}>Share</Text>
                </Pressable>
              </View>
              <View style={styles.referralStats}>
                <View style={styles.refStat}>
                  <Text style={styles.refStatValue}>{referralData?.totalReferrals || 0}</Text>
                  <Text style={styles.refStatLabel}>Referrals</Text>
                </View>
                <View style={styles.refDivider} />
                <View style={styles.refStat}>
                  <Text style={[styles.refStatValue, { color: Colors.gold }]}>₹{referralData?.totalEarnings || "0"}</Text>
                  <Text style={styles.refStatLabel}>Earned</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="call-outline" label="Phone" value={user?.phone} />
            <MenuItem icon="card-outline" label="UPI ID" value={user?.upiId || "Not set"} />
            <MenuItem icon="calendar-outline" label="Joined" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : ""} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.menuCard}>
            <MenuItem icon="log-out-outline" label="Logout" onPress={handleLogout} danger />
          </View>
        </View>

        <View style={{ height: botPad }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  avatarContainer: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.crimson,
    borderWidth: 2, borderColor: Colors.gold,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.gold },
  userName: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.textPrimary },
  userPhone: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  walletCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "rgba(212,160,23,0.3)",
  },
  walletLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  walletBalance: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.gold },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.textPrimary, marginBottom: 12 },
  referralCard: { borderRadius: 16, overflow: "hidden" },
  referralInner: {
    padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  referralTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  referralLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  referralCode: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.gold, letterSpacing: 2 },
  shareBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.gold,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  shareBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.darkBg },
  referralStats: { flexDirection: "row" },
  refStat: { flex: 1, alignItems: "center" },
  refDivider: { width: 1, backgroundColor: Colors.border },
  refStatValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.textPrimary },
  refStatLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 12,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.gold + "20",
    alignItems: "center", justifyContent: "center",
  },
  menuContent: { flex: 1 },
  menuLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textPrimary },
  menuValue: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
