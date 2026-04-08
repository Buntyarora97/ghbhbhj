import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  StatusBar
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/colors";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!phone || !password) {
      setError("Phone and password are required");
      return;
    }
    if (mode === "register" && !name) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login(phone, password);
      } else {
        await register(name, phone, password, referralCode || undefined);
      }
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.crimson, Colors.darkBg, Colors.darkBg]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="diamond" size={40} color={Colors.gold} />
            </View>
            <Text style={styles.appName}>Haryana Ki Shan</Text>
            <Text style={styles.tagline}>हरियाणा की शान</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, mode === "login" && styles.tabActive]}
                onPress={() => { setMode("login"); setError(""); }}
              >
                <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Login</Text>
              </Pressable>
              <Pressable
                style={[styles.tab, mode === "register" && styles.tabActive]}
                onPress={() => { setMode("register"); setError(""); }}
              >
                <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>Register</Text>
              </Pressable>
            </View>

            {mode === "register" && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={Colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.textMuted} />
              </Pressable>
            </View>

            {mode === "register" && (
              <View style={styles.inputContainer}>
                <Ionicons name="gift-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Referral Code (optional)"
                  placeholderTextColor={Colors.textMuted}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && styles.btnPressed]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.goldLight, Colors.gold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.darkBg} />
                ) : (
                  <Text style={styles.submitText}>{mode === "login" ? "Login" : "Create Account"}</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  logoContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.surface,
    borderWidth: 2, borderColor: Colors.gold,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    shadowColor: Colors.gold, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.gold,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1, paddingVertical: 10,
    borderRadius: 10, alignItems: "center",
  },
  tabActive: { backgroundColor: Colors.crimson },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textMuted },
  tabTextActive: { color: Colors.gold },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.cardBg,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14,
    marginBottom: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, fontFamily: "Inter_400Regular",
    fontSize: 15, color: Colors.textPrimary,
  },
  eyeBtn: { padding: 4 },
  errorBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(231,76,60,0.1)",
    borderRadius: 8, padding: 10, marginBottom: 12, gap: 6,
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.error, flex: 1 },
  submitBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  btnPressed: { opacity: 0.85 },
  btnGradient: {
    paddingVertical: 16, alignItems: "center", justifyContent: "center",
  },
  submitText: {
    fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.darkBg,
  },
});
