import "./global.css";
import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { AuthStack } from "./src/navigation/AuthStack";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { DesignSystemScreen } from "./src/screens/DesignSystemScreen";
import { applyStoredColorScheme } from "./src/theme/colorScheme";
import { primary } from "./src/theme/palette";

function Gate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator color={primary[600]} />
      </View>
    );
  }
  return user ? <RootNavigator /> : <AuthStack />;
}

export default function App() {
  useEffect(() => {
    applyStoredColorScheme();
  }, []);

  // Component-kit reference, reachable at /design on web — not password-protected yet
  // (see the banner on the page itself), so it's checked before AuthProvider/NavigationContainer.
  // Normally a navigator (bottom-tabs/native-stack) supplies SafeAreaProviderCompat for
  // Screen's SafeAreaView; outside any navigator here, it needs its own provider.
  if (Platform.OS === "web" && window.location.pathname.startsWith("/design")) {
    return (
      <SafeAreaProvider>
        <DesignSystemScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Gate />
      </NavigationContainer>
    </AuthProvider>
  );
}
