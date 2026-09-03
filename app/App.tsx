import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { AuthStack } from "./src/navigation/AuthStack";
import { RootNavigator } from "./src/navigation/RootNavigator";

function Gate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }
  return user ? <RootNavigator /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Gate />
      </NavigationContainer>
    </AuthProvider>
  );
}
