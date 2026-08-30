import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Providers from "@/shared/providers";
import { useAuthSession } from "@/shared/hooks/useAuthSession";

// Keep the native splash up while the stored token is read and the profile is
// restored, so an already-authenticated user never sees the login screen.
// No-ops in Expo Go, where the splash module isn't present — hence the
// in-app indicator below, which covers that case.
void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isBooting, isAuthenticated } = useAuthSession();

  if (isBooting) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  SplashScreen.hide();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Always mounted: it owns "/" and forwards to whichever branch the
          guards below have enabled. */}
      <Stack.Screen name="index" />
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Providers>
      <StatusBar style="dark" />
      <RootNavigator />
    </Providers>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
});
