import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/colors";

function TabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="markets"
        options={{
          title: "Markets",
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color }) => <Ionicons name="wallet" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <Ionicons name="time" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, isLoading]);

  return <TabLayout />;
}

export default function RootTabLayout() {
  return <AuthGuard />;
}
