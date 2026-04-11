import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform, Linking, Clipboard
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Colors } from "../constants/colors";

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const PAYMENT_APPS = [
  { name: "PhonePe", icon: "phone-portrait-outline", color: "#5f259f", scheme: "phonepe://pay" },
  { name: "GPay", icon: "logo-google", color: "#4285F4", scheme: "tez://upi/pay" },
  { name: "Paytm", icon: "wallet-outline", color: "#002970", scheme: "paytmmp://pay" },
  { name: "BHIM", icon: "card-outline", color: "#00529B", scheme: "upi://pay" },
];

export default function DepositScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [utrId, setUtrId] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: upiData, isLoading: upiLoading } = useQuery({
    queryKey: ["active-upi"],
    queryFn: api.wallet.activeUpi,
  });

  const handleCopyUpi = () => {
    if (upiData?.upiId) {
      Clipboard.setString(upiData.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenPaymentApp = (scheme: string) => {
    const amt = parseFloat(amount);
    const upiId = upiData?.upiId;
    const name = upiData?.holderName || "Haryana Ki Shan";

    let url = scheme;
    if (upiId) {
      url = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}${amt ? `&am=${amt}` : ""}&cu=INR`;
    }

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&cu=INR`).catch(() => {
          Alert.alert("App Not Found", "Please open the payment app manually and pay to the UPI ID shown above.");
        });
      }
    });
  };

  const handleDeposit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) {
      return Alert.alert("Error", "Minimum deposit amount is ₹100");
    }
    if (!upiData?.upiId) {
      return Alert.alert("Error", "No UPI account available. Please try later.");
    }
    if (!utrId.trim()) {
      return Alert.alert("Error", "Please enter the UTR / Reference ID from your payment");
    }
    setLoading(true);
    try {
      const resp = await api.wallet.deposit({
        amount: amt,
        upiId: upiData.upiId,
        utrId: utrId.trim(),
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

        {/* UPI Info Card */}
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
              {/* Copy UPI Button */}
              <Pressable
                style={[styles.copyBtn, copied && styles.copyBtnActive]}
                onPress={handleCopyUpi}
                disabled={!upiData?.upiId}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={16}
                  color={copied ? Colors.darkBg : Colors.gold}
                />
                <Text style={[styles.copyText, copied && styles.copyTextActive]}>
                  {copied ? "Copied!" : "Copy"}
                </Text>
              </Pressable>
            </View>

            {/* Payment App Buttons */}
            <View style={styles.payAppsSection}>
              <Text style={styles.payAppsLabel}>Pay via App</Text>
              <View style={styles.payAppsRow}>
                {PAYMENT_APPS.map((app) => (
                  <Pressable
                    key={app.name}
                    style={styles.payAppBtn}
                    onPress={() => handleOpenPaymentApp(app.scheme)}
                  >
                    <View style={[styles.payAppIcon, { backgroundColor: app.color + "20", borderColor: app.color + "40" }]}>
                      <Ionicons name={app.icon as any} size={20} color={app.color} />
                    </View>
                    <Text style={styles.payAppName}>{app.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.steps}>
              {["Copy UPI ID ya Pay via App button use karo", "Exact amount bhejo", "UTR/Reference ID copy karke neeche enter karo"].map((step, i) => (
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

        {/* Amount Input */}
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

        {/* UTR / Reference ID Input */}
        <Text style={styles.label}>UTR / Reference ID *</Text>
        <View style={[styles.amountInput, { marginBottom: 8 }]}>
          <Ionicons name="receipt-outline" size={20} color={Colors.gold} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.amountField, { fontSize: 16 }]}
            placeholder="Enter payment UTR or Reference ID"
            placeholderTextColor={Colors.textMuted}
            value={utrId}
            onChangeText={setUtrId}
            autoCapitalize="characters"
          />
        </View>
        <Text style={styles.utrHint}>
          Payment karne ke baad app mein Transaction ID / UTR milega
        </Text>

        <View style={styles.noteBox}>
          <Ionicons name="information-circle" size={16} color={Colors.info} />
          <Text style={styles.noteText}>
            UPI se exact amount bhejne ke baad UTR/Reference ID enter karo aur submit karo. Admin verification ke baad wallet credit hoga.
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
                <Text style={styles.submitText}>Submit Payment Request</Text>
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
  upiId: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.gold, marginTop: 2 },
  holderName: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  copyBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.gold,
    backgroundColor: Colors.gold + "15",
  },
  copyBtnActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  copyText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.gold },
  copyTextActive: { color: Colors.darkBg },
  payAppsSection: { marginBottom: 16 },
  payAppsLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textSecondary, marginBottom: 10 },
  payAppsRow: { flexDirection: "row", gap: 10 },
  payAppBtn: { flex: 1, alignItems: "center", gap: 6 },
  payAppIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  payAppName: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.textSecondary },
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
    height: 58, marginBottom: 10,
  },
  rupeeSign: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.gold, marginRight: 8 },
  amountField: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.textPrimary },
  quickAmounts: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  quickBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickBtnActive: { backgroundColor: Colors.crimson, borderColor: Colors.gold },
  quickBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  quickBtnTextActive: { color: Colors.gold },
  utrHint: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted, marginBottom: 16 },
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
