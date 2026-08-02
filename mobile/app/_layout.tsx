import "react-native-gesture-handler";
import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { 
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
  Outfit_900Black 
} from '@expo-google-fonts/outfit';
import { useState } from "react";
import AnimatedSplashScreen from "../components/AnimatedSplashScreen";
import ErrorBoundary from "../components/ErrorBoundary";
import { loadSavedApiUrl } from "../services/api";
import { AuthProvider } from "../providers/AuthProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
    Outfit_900Black,
  });

  useEffect(() => {
    if (loaded || error) {
      loadSavedApiUrl().finally(() => SplashScreen.hideAsync());
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <ErrorBoundary>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
          {showSplash && (
            <AnimatedSplashScreen onAnimationComplete={() => setShowSplash(false)} />
          )}
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
