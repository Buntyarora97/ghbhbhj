import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Linking
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Colors } from "../constants/colors";

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const PAYMENT_APPS: { name: string; icon: keyof typeof Ionicons.glyphMap; color: string; scheme: string }[] = [
  { name: "Paytm", icon: "wallet-outline", color: "#00BAF2", scheme: "paytmmp://pay" },
  { name: "GPay", icon: "logo-google", color: "#4285F4", scheme: "tez://upi/pay" },
  { name: "PhonePe", icon: "phone-portrait-outline", color: "#5f259f", scheme: "phonepe://pay" },
  { name: "Other UPI", icon: "card-outline", color: "#16A34A", scheme: "upi://pay" },
];

function buildUpiUrl(scheme: string, upiId: string, holderName: string, amountValue: number) {
  const query = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(holderName)}${amountValue ? `&am=${amountValue.toFixed(2)}` : ""}&cu=INR&tn=${encodeURIComponent("Haryana Ki Shan wallet deposit")}`;
  const separator = scheme.includes("?") ? "&" : "?";
  return `${scheme}${separator}${query}`;
}

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

  const amountValue = parseFloat(amount);
  const qrAmount = amountValue && amountValue >= 50 ? amountValue : 0;
  const qrUpiUrl = upiData?.upiId
    ? buildUpiUrl("upi://pay", upiData.upiId, upiData.holderName || "Haryana Ki Shan", qrAmount)
    : "";

  const handleCopyUpi = async () => {
    if (upiData?.upiId) {
      await Clipboard.setStringAsync(upiData.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert("Copied", "UPI ID copy ho gayi hai.");
    }
  };

  const handleOpenPaymentApp = (scheme: string) => {
    const amt = parseFloat(amount);
    const upiId = upiData?.upiId;
    const name = upiData?.holderName || "Haryana Ki Shan";

    if (!upiId) {
      Alert.alert("Error", "UPI ID available nahi hai. Thodi der baad try karo.");
      return;
    }
    if (!amt || amt < 50) {
      Alert.alert("Amount Required", "Payment app open karne se pehle minimum ₹50 amount enter karo.");
      return;
    }

    const url = buildUpiUrl(scheme, upiId, name, amt);
    const fallbackUrl = buildUpiUrl("upi://pay", upiId, name, amt);
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(fallbackUrl).catch(() => {
          Alert.alert("App Not Found", "Payment app manually open karke upar wali UPI ID par exact amount pay karo.");
        });
      }
    }).catch(() => {
      Linking.openURL(fallbackUrl).catch(() => {
        Alert.alert("App Not Found", "Payment app manually open karke upar wali UPI ID par exact amount pay karo.");
      });
    });
  };

  const handleDeposit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 50) {
      return Alert.alert("Error", "Minimum deposit amount is ₹50");
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
        { text: "OK", onPress: () => router.back() },
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

            {upiData?.upiId && (
              <View style={styles.qrSection}>
                <View style={styles.qrHeader}>
                  <Ionicons name="scan-outline" size={18} color={Colors.gold} />
                  <Text style={styles.qrTitle}>Scan QR & Pay</Text>
                </View>
                <View style={styles.qrBox}>
                  <QRCode
                    value={qrUpiUrl}
                    size={190}
                    color="#111111"
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <Text style={styles.qrHint}>
                  {qrAmount
                    ? `QR mein ₹${qrAmount.toFixed(2)} amount set hai. Scan karke exact payment karo.`
                    : "Amount enter karte hi QR exact amount ke saath update ho jayega."}
                </Text>
              </View>
            )}

            {/* Payment App Buttons */}
            <View style={styles.payAppsSection}>
              <Text style={styles.payAppsLabel}>Pay via App</Text>
              <View style={styles.payAppsRow}>
                {PAYMENT_APPS.map((app) => (
                  <Pressable
                    key={app.name}
                    style={styles.payAppBtn}
                    onPress={() => handleOpenPaymentApp(app.scheme)}
                    disabled={!upiData?.upiId}
                  >
                    <View style={[styles.payAppIcon, { backgroundColor: app.color + "20", borderColor: app.color + "40" }]}>
                      <Ionicons name={app.icon} size={20} color={app.color} />
                    </View>
                    <Text style={styles.payAppName}>{app.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.steps}>
              {["Amount enter karo", "Paytm, Google Pay, PhonePe ya Other UPI se exact payment karo", "Payment ke baad UTR/Reference ID neeche enter karke submit karo"].map((step, i) => (
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
        <Text style={styles.label}>Deposit Amount (Min. ₹50)</Text>
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
          Payment successful hone ke baad Paytm/GPay/PhonePe mein Transaction ID / UTR milega
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
  qrSection: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    backgroundColor: Colors.darkBg + "55",
  },
  qrHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  qrTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.textPrimary },
  qrBox: {
    width: 216,
    height: 216,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 13,
    borderWidth: 3,
    borderColor: Colors.gold,
  },
  qrHint: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
  },
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
