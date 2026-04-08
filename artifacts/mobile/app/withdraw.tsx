import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Colors } from "@/constants/colors";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState(user?.upiId || "");
  const [loading, setLoading] = useState(false);

  const balance = parseFloat(user?.walletBalance || "0");

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 500) return Alert.alert("Error", "Minimum withdrawal is ₹500");
    if (amt > balance) return Alert.alert("Error", "Insufficient wallet balance");
    if (!upiId) return Alert.alert("Error", "Please enter your UPI ID");

    Alert.alert(
      "Confirm Withdrawal",
      `Amount: ₹${amt}\nTo UPI: ${upiId}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setLoading(true);
            try {
              const resp = await api.wallet.withdraw({ amount: amt, upiId });
              await refreshUser();
              await queryClient.invalidateQueries({ queryKey: ["transactions"] });
              Alert.alert("Request Submitted!", resp.message, [
                { text: "OK", onPress: () => router.back() }
              ]);
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to submit withdrawal");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.crimson + "80", Colors.darkBg]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-down" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Withdraw</Text>
          <View style={{ width: 32 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balLabel}>Available Balance</Text>
          <Text style={styles.balAmount}>₹{balance.toFixed(2)}</Text>
        </View>

        <Text style={styles.label}>Withdraw Amount (Min. ₹500)</Text>
        <View style={styles.amountInput}>
          <Text style={styles.rupeeSign}>₹</Text>
          <TextInput
            style={styles.amountField}
            placeholder="Enter amount"
            placeholderTextColor={Colors.textMuted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
          />
          <Pressable onPress={() => setAmount(balance.toString())} style={styles.maxBtn}>
            <Text style={styles.maxBtnText}>MAX</Text>
          </Pressable>
        </View>

        <View style={styles.quickAmounts}>
          {QUICK_AMOUNTS.map(qa => (
            <Pressable
              key={qa}
              style={[styles.quickBtn, amount === qa.toString() && styles.quickBtnActive]}
              onPress={() => setAmount(qa.toString())}
            >
              <Text style={[styles.quickBtnText, amount === qa.toString() && styles.quickBtnTextActive]}>
                ₹{qa}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Your UPI ID</Text>
        <View style={styles.upiInput}>
          <Ionicons name="card-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.upiField}
            placeholder="yourname@upi"
            placeholderTextColor={Colors.textMuted}
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.noteBox}>
          <Ionicons name="time" size={16} color={Colors.warning} />
          <Text style={styles.noteText}>
            Withdrawal requests are processed within 24 hours. Min ₹500, amount will be deducted immediately.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.9 }]}
          onPress={handleWithdraw}
          disabled={loading}
        >
          <LinearGradient
            colors={[Colors.goldLight, Colors.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {loading ? (
              <ActivityIndicator color={Colors.darkBg} />
            ) : (
              <>
                <Ionicons name="arrow-up-circle" size={20} color={Colors.darkBg} />
                <Text style={styles.submitText}>Request Withdrawal</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.textPrimary },
  content: { padding: 20 },
  balanceCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.border, alignItems: "center",
  },
  balLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted },
  balAmount: { fontFamily: "Inter_700Bold", fontSize: 32, color: Colors.gold, marginTop: 4 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.textSecondary, marginBottom: 10 },
  amountInput: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.border, paddingHorizontal: 16,
    height: 58,
  },
  rupeeSign: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.gold, marginRight: 8 },
  amountField: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.textPrimary },
  maxBtn: {
    backgroundColor: Colors.crimson, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  maxBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.gold },
  quickAmounts: { flexDirection: "row", gap: 8, marginTop: 10, marginBottom: 20 },
  quickBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickBtnActive: { backgroundColor: Colors.crimson, borderColor: Colors.gold },
  quickBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  quickBtnTextActive: { color: Colors.gold },
  upiInput: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.border, paddingHorizontal: 16,
    height: 52, marginBottom: 20,
  },
  inputIcon: { marginRight: 10 },
  upiField: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.textPrimary },
  noteBox: {
    flexDirection: "row", gap: 8,
    backgroundColor: Colors.warning + "15",
    borderRadius: 12, padding: 12, marginBottom: 20,
  },
  noteText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, flex: 1 },
  submitBtn: { borderRadius: 16, overflow: "hidden" },
  submitGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18 },
  submitText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.darkBg },
});
