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
import { Button, EmptyState } from "./src/ui";

function Gate() {
  const { user, loading, restoreFailed, retryRestore, logout } = useAuth();
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator color={primary[600]} />
      </View>
    );
  }
  // Saved session, but the server couldn't be reached to confirm it: keep the session and let
  // them retry, rather than dropping them to the login screen just for being out of signal.
  if (!user && restoreFailed) {
    return (
      <View className="flex-1 justify-center gap-4 bg-neutral-50 p-6 dark:bg-neutral-950">
        <EmptyState title="Can't reach HEOS" subtitle="Check your connection — you're still signed in." onRetry={retryRestore} />
        <Button variant="ghost" title="Sign out instead" onPress={logout} />
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
