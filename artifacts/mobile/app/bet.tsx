import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform, StatusBar
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Colors } from "@/constants/colors";

const QUICK_AMOUNTS = [10, 50, 100, 200, 500, 1000];

type BetRow = { number: string; amount: string; gameType: "jodi" | "haruf" };

export default function BetScreen() {
  const { marketId, marketName } = useLocalSearchParams<{ marketId: string; marketName: string }>();
  const insets = useSafeAreaInsets();
  const { user, updateBalance } = useAuth();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"single" | "multi">("single");
  const [gameType, setGameType] = useState<"jodi" | "haruf">("jodi");
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const [multiBets, setMultiBets] = useState<BetRow[]>([{ number: "", amount: "", gameType: "jodi" }]);

  const balance = parseFloat(user?.walletBalance || "0");
  const betAmount = parseFloat(amount) || 0;
  const multiplier = gameType === "jodi" ? 90 : 9;
  const potentialWin = betAmount * multiplier;
  const multiTotal = multiBets.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);

  const handleNumberChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, "");
    if (gameType === "jodi") {
      if (cleaned.length <= 2) setNumber(cleaned);
    } else {
      if (cleaned.length <= 1) setNumber(cleaned);
    }
  };

  const addBetRow = () => {
    if (multiBets.length >= 50) return;
    setMultiBets(prev => [...prev, { number: "", amount: "", gameType: "jodi" }]);
  };

  const removeBetRow = (idx: number) => {
    setMultiBets(prev => prev.filter((_, i) => i !== idx));
  };

  const updateBetRow = (idx: number, field: keyof BetRow, val: string) => {
    setMultiBets(prev => prev.map((b, i) => {
      if (i !== idx) return b;
      if (field === "number") {
        const cleaned = val.replace(/[^0-9]/g, "");
        const max = b.gameType === "jodi" ? 2 : 1;
        return { ...b, number: cleaned.slice(0, max) };
      }
      if (field === "gameType") {
        return { ...b, gameType: val as "jodi" | "haruf", number: "" };
      }
      return { ...b, [field]: val };
    }));
  };

  const handlePlaceSingleBet = async () => {
    if (!number) return Alert.alert("Error", "Please enter a number");
    if (!amount || betAmount < 10) return Alert.alert("Error", "Minimum bet is ₹10");
    if (betAmount > balance) return Alert.alert("Insufficient Balance", "Please add money to your wallet");

    const maxNum = gameType === "jodi" ? 99 : 9;
    const numVal = parseInt(number);
    if (isNaN(numVal) || numVal < 0 || numVal > maxNum) {
      return Alert.alert("Error", `Number must be 0-${maxNum}`);
    }

    Alert.alert(
      "Confirm Bet",
      `${gameType === "jodi" ? "Jodi" : "Haruf"} - ${number.padStart(gameType === "jodi" ? 2 : 1, "0")}\nAmount: ₹${betAmount}\nPotential Win: ₹${potentialWin}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Place Bet",
          onPress: async () => {
            setLoading(true);
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const resp = await api.bets.place({
                marketId: parseInt(marketId!),
                gameType,
                number: gameType === "jodi" ? number.padStart(2, "0") : number,
                amount: betAmount,
              });
              updateBalance(resp.newBalance);
              await queryClient.invalidateQueries({ queryKey: ["my-bets"] });
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Bet Placed!", `Bet placed!\nNew balance: ₹${resp.newBalance}`, [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (e: any) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Error", e.message || "Failed to place bet");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handlePlaceMultiBet = async () => {
    const validBets = multiBets.filter(b => b.number && b.amount && parseFloat(b.amount) >= 10);
    if (validBets.length === 0) {
      return Alert.alert("Error", "Please enter at least one number and amount (min ₹10)");
    }
    if (multiTotal > balance) {
      return Alert.alert("Insufficient Balance", `Need ₹${multiTotal.toFixed(2)}, you have ₹${balance.toFixed(2)}`);
    }

    for (const b of validBets) {
      const maxNum = b.gameType === "jodi" ? 99 : 9;
      const numVal = parseInt(b.number);
      if (isNaN(numVal) || numVal < 0 || numVal > maxNum) {
        return Alert.alert("Error", `Invalid number ${b.number} for ${b.gameType}`);
      }
    }

    Alert.alert(
      "Confirm Multi Bet",
      `${validBets.length} numbers | Total: ₹${multiTotal.toFixed(2)}\n${validBets.map(b => `${b.gameType === "jodi" ? "Jodi" : "Haruf"} ${b.number.padStart(b.gameType === "jodi" ? 2 : 1, "0")} = ₹${b.amount}`).join("\n")}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Place All Bets",
          onPress: async () => {
            setLoading(true);
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const resp = await api.bets.placeMulti({
                marketId: parseInt(marketId!),
                bets: validBets.map(b => ({
                  gameType: b.gameType,
                  number: b.gameType === "jodi" ? b.number.padStart(2, "0") : b.number,
                  amount: parseFloat(b.amount),
                })),
              });
              updateBalance(resp.newBalance);
              await queryClient.invalidateQueries({ queryKey: ["my-bets"] });
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Bets Placed!", `${resp.betsPlaced} bets placed!\nNew balance: ₹${resp.newBalance}`, [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (e: any) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Error", e.message || "Failed to place bets");
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
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.crimson, Colors.darkBg]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-down" size={24} color={Colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.headerTitle}>{marketName}</Text>
            <Text style={styles.headerSub}>Place Your Bet</Text>
          </View>
          <View style={styles.balanceChip}>
            <Text style={styles.balanceText}>₹{balance.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.modeRow}>
          {(["single", "multi"] as const).map(m => (
            <Pressable
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              onPress={() => setMode(m)}
            >
              <Ionicons
                name={m === "single" ? "game-controller" : "list"}
                size={16}
                color={mode === m ? Colors.darkBg : Colors.textMuted}
              />
              <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                {m === "single" ? "Single Bet" : "Multi Bet"}
              </Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {mode === "single" ? (
          <>
            <Text style={styles.label}>Game Type</Text>
            <View style={styles.gameTypeRow}>
              {(["jodi", "haruf"] as const).map(type => (
                <Pressable
                  key={type}
                  style={[styles.gameTypeBtn, gameType === type && styles.gameTypeBtnActive]}
                  onPress={() => { setGameType(type); setNumber(""); }}
                >
                  <Ionicons
                    name={type === "jodi" ? "grid" : "keypad"}
                    size={20}
                    color={gameType === type ? Colors.darkBg : Colors.textMuted}
                  />
                  <View>
                    <Text style={[styles.gameTypeName, gameType === type && styles.gameTypeNameActive]}>
                      {type === "jodi" ? "Jodi" : "Haruf"}
                    </Text>
                    <Text style={[styles.gameTypeOdds, gameType === type && { color: Colors.darkBg + "99" }]}>
                      {type === "jodi" ? "00-99 | 90x" : "0-9 | 9x"}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Select Number</Text>
            {gameType === "haruf" ? (
              <View style={styles.singleGrid}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <Pressable
                    key={n}
                    style={[styles.singleBtn, number === n.toString() && styles.singleBtnActive]}
                    onPress={() => setNumber(n.toString())}
                  >
                    <Text style={[styles.singleBtnText, number === n.toString() && styles.singleBtnTextActive]}>{n}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.numberInput}>
                <TextInput
                  style={styles.numField}
                  placeholder="00 - 99"
                  placeholderTextColor={Colors.textMuted}
                  value={number}
                  onChangeText={handleNumberChange}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                {number.length > 0 && (
                  <View style={styles.numberPreview}>
                    <Text style={styles.numberPreviewText}>{number.padStart(2, "0")}</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.label}>Bet Amount (₹)</Text>
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
                  <Text style={[styles.quickBtnText, amount === qa.toString() && styles.quickBtnTextActive]}>₹{qa}</Text>
                </Pressable>
              ))}
            </View>

            {betAmount > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Bet Amount</Text>
                  <Text style={styles.summaryValue}>₹{betAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Multiplier</Text>
                  <Text style={[styles.summaryValue, { color: Colors.gold }]}>{multiplier}x</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryHighlight]}>
                  <Text style={[styles.summaryLabel, { color: Colors.gold }]}>Potential Win</Text>
                  <Text style={[styles.summaryValue, styles.winAmount]}>₹{potentialWin.toFixed(2)}</Text>
                </View>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.betBtn, pressed && { opacity: 0.9 }, loading && styles.betBtnDisabled]}
              onPress={handlePlaceSingleBet}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.goldLight, Colors.gold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.betBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.darkBg} />
                ) : (
                  <>
                    <Ionicons name="trophy" size={20} color={Colors.darkBg} />
                    <Text style={styles.betBtnText}>Place Bet</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.multiBetHeader}>
              <Text style={styles.label}>Multiple Numbers</Text>
              <Text style={styles.multiTotalText}>Total: ₹{multiTotal.toFixed(2)}</Text>
            </View>

            {multiBets.map((bet, idx) => (
              <View key={idx} style={styles.multiBetRow}>
                <View style={styles.multiBetTypeRow}>
                  {(["jodi", "haruf"] as const).map(type => (
                    <Pressable
                      key={type}
                      style={[styles.miniTypeBtn, bet.gameType === type && styles.miniTypeBtnActive]}
                      onPress={() => updateBetRow(idx, "gameType", type)}
                    >
                      <Text style={[styles.miniTypeBtnText, bet.gameType === type && styles.miniTypeBtnTextActive]}>
                        {type === "jodi" ? "Jodi" : "Haruf"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.multiBetInputs}>
                  <View style={styles.multiBetNumWrap}>
                    <TextInput
                      style={styles.multiBetNum}
                      placeholder={bet.gameType === "jodi" ? "00-99" : "0-9"}
                      placeholderTextColor={Colors.textMuted}
                      value={bet.number}
                      onChangeText={v => updateBetRow(idx, "number", v)}
                      keyboardType="number-pad"
                      maxLength={bet.gameType === "jodi" ? 2 : 1}
                    />
                  </View>
                  <View style={styles.multiBetAmtWrap}>
                    <Text style={styles.rupeeSign}>₹</Text>
                    <TextInput
                      style={styles.multiBetAmt}
                      placeholder="Amount"
                      placeholderTextColor={Colors.textMuted}
                      value={bet.amount}
                      onChangeText={v => updateBetRow(idx, "amount", v)}
                      keyboardType="number-pad"
                    />
                  </View>
                  {multiBets.length > 1 && (
                    <Pressable style={styles.removeBetBtn} onPress={() => removeBetRow(idx)}>
                      <Ionicons name="close-circle" size={22} color={Colors.error} />
                    </Pressable>
                  )}
                </View>
                {bet.number && bet.amount && parseFloat(bet.amount) >= 10 && (
                  <Text style={styles.multiBetWin}>
                    Win: ₹{(parseFloat(bet.amount) * (bet.gameType === "jodi" ? 90 : 9)).toFixed(2)}
                  </Text>
                )}
              </View>
            ))}

            <Pressable style={styles.addBetBtn} onPress={addBetRow}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.gold} />
              <Text style={styles.addBetText}>Add Another Number</Text>
            </Pressable>

            <View style={styles.multiAmountButtons}>
              {QUICK_AMOUNTS.map(qa => (
                <Pressable
                  key={qa}
                  style={styles.quickBtnSmall}
                  onPress={() => {
                    setMultiBets(prev => prev.map(b => ({ ...b, amount: qa.toString() })));
                  }}
                >
                  <Text style={styles.quickBtnSmallText}>All ₹{qa}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Numbers</Text>
                <Text style={styles.summaryValue}>{multiBets.filter(b => b.number && b.amount).length}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryHighlight]}>
                <Text style={[styles.summaryLabel, { color: Colors.gold }]}>Total Amount</Text>
                <Text style={[styles.summaryValue, styles.winAmount]}>₹{multiTotal.toFixed(2)}</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.betBtn, pressed && { opacity: 0.9 }, loading && styles.betBtnDisabled]}
              onPress={handlePlaceMultiBet}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.goldLight, Colors.gold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.betBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.darkBg} />
                ) : (
                  <>
                    <Ionicons name="trophy" size={20} color={Colors.darkBg} />
                    <Text style={styles.betBtnText}>Place {multiBets.filter(b => b.number && b.amount).length} Bets</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.textPrimary },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  balanceChip: {
    backgroundColor: "rgba(0,0,0,0.3)", borderWidth: 1, borderColor: Colors.gold,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  balanceText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.gold },
  modeRow: { flexDirection: "row", gap: 10 },
  modeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  modeBtnActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  modeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textMuted },
  modeBtnTextActive: { color: Colors.darkBg },
  content: { padding: 20 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.textSecondary, marginBottom: 10, marginTop: 16 },
  gameTypeRow: { flexDirection: "row", gap: 12 },
  gameTypeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 2, borderColor: Colors.border,
  },
  gameTypeBtnActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  gameTypeName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.textPrimary },
  gameTypeNameActive: { color: Colors.darkBg },
  gameTypeOdds: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  numberInput: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.border, padding: 16,
    gap: 12,
  },
  numField: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.textPrimary },
  numberPreview: { backgroundColor: Colors.crimson, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  numberPreviewText: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.gold },
  singleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  singleBtn: {
    width: 52, height: 52,
    backgroundColor: Colors.surface, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: Colors.border,
  },
  singleBtnActive: { backgroundColor: Colors.crimson, borderColor: Colors.gold },
  singleBtnText: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.textPrimary },
  singleBtnTextActive: { color: Colors.gold },
  amountInput: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.border, paddingHorizontal: 16,
    height: 58,
  },
  rupeeSign: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.gold, marginRight: 8 },
  amountField: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.textPrimary },
  quickAmounts: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  quickBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickBtnActive: { backgroundColor: Colors.crimson, borderColor: Colors.gold },
  quickBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  quickBtnTextActive: { color: Colors.gold },
  summaryCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  summaryHighlight: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4, paddingTop: 12 },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.textPrimary },
  winAmount: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.gold },
  betBtn: { marginTop: 20, borderRadius: 16, overflow: "hidden" },
  betBtnDisabled: { opacity: 0.7 },
  betBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18 },
  betBtnText: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.darkBg },
  multiBetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 10 },
  multiTotalText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.gold },
  multiBetRow: {
    backgroundColor: Colors.surface, borderRadius: 14,
    padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  multiBetTypeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  miniTypeBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
  },
  miniTypeBtnActive: { backgroundColor: Colors.crimson, borderColor: Colors.gold },
  miniTypeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.textMuted },
  miniTypeBtnTextActive: { color: Colors.gold },
  multiBetInputs: { flexDirection: "row", alignItems: "center", gap: 8 },
  multiBetNumWrap: {
    flex: 1, backgroundColor: Colors.cardBg,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  multiBetNum: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.textPrimary },
  multiBetAmtWrap: {
    flex: 1.5, flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.cardBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  multiBetAmt: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.textPrimary },
  removeBetBtn: { padding: 4 },
  multiBetWin: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.gold, marginTop: 6 },
  addBetBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1.5, borderColor: Colors.gold, borderStyle: "dashed",
    borderRadius: 12, paddingVertical: 12, marginTop: 4,
  },
  addBetText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.gold },
  multiAmountButtons: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  quickBtnSmall: {
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
  },
  quickBtnSmallText: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
});
