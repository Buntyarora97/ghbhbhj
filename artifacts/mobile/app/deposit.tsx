import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Colors } from "@/constants/colors";

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function DepositScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: upiData, isLoading: upiLoading } = useQuery({
    queryKey: ["active-upi"],
    queryFn: api.wallet.activeUpi,
  });

  const handleDeposit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) {
      return Alert.alert("Error", "Minimum deposit amount is ₹100");
    }
    if (!upiData?.upiId) {
      return Alert.alert("Error", "No UPI account available. Please try later.");
    }
    setLoading(true);
    try {
      const resp = await api.wallet.deposit({
        amount: amt,
        upiId: upiData.upiId,
      });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      Alert.alert("Request Submitted!", resp.message || "Your deposit request has been submitted. It will be approved within a few minutes.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit deposit request");
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerTitle}>Add Money</Text>
          <View style={{ width: 32 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {/* UPI Info */}
        <View style={styles.upiCard}>
          <LinearGradient colors={[Colors.surface, Colors.cardBg]} style={styles.upiInner}>
            <View style={styles.upiHeader}>
              <Ionicons name="qr-code" size={24} color={Colors.gold} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.upiTitle}>Send Money To</Text>
                {upiLoading ? (
                  <ActivityIndicator size="small" color={Colors.gold} />
                ) : (
                  <Text style={styles.upiId}>{upiData?.upiId || "Loading..."}</Text>
                )}
                {upiData?.holderName && <Text style={styles.holderName}>{upiData.holderName}</Text>}
              </View>
            </View>
            <View style={styles.steps}>
              {["Open PhonePe / GPay / Paytm", "Send exact amount to above UPI", "Submit your request below"].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.label}>Deposit Amount (Min. ₹100)</Text>
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

        <View style={styles.noteBox}>
          <Ionicons name="information-circle" size={16} color={Colors.info} />
          <Text style={styles.noteText}>
            Send the exact amount to the UPI ID above, then click "I Have Sent". Your wallet will be credited after admin approval.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.9 }]}
          onPress={handleDeposit}
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
                <Ionicons name="checkmark-circle" size={20} color={Colors.darkBg} />
                <Text style={styles.submitText}>I Have Sent Money</Text>
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
  upiCard: { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
  upiInner: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  upiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  upiTitle: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  upiId: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.gold, marginTop: 2 },
  holderName: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  steps: { gap: 10 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.crimson, alignItems: "center", justifyContent: "center",
  },
  stepNumText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.gold },
  stepText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, flex: 1 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.textSecondary, marginBottom: 10 },
  amountInput: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.border, paddingHorizontal: 16,
    height: 58,
  },
  rupeeSign: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.gold, marginRight: 8 },
  amountField: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.textPrimary },
  quickAmounts: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, marginBottom: 20 },
  quickBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickBtnActive: { backgroundColor: Colors.crimson, borderColor: Colors.gold },
  quickBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  quickBtnTextActive: { color: Colors.gold },
  noteBox: {
    flexDirection: "row", gap: 8,
    backgroundColor: Colors.info + "15",
    borderRadius: 12, padding: 12, marginBottom: 20,
  },
  noteText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, flex: 1 },
  submitBtn: { borderRadius: 16, overflow: "hidden" },
  submitGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18 },
  submitText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.darkBg },
});
