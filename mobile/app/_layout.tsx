import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
  Outfit_900Black 
} from '@expo-google-fonts/outfit';
import { useState } from "react";
import AnimatedSplashScreen from "../components/AnimatedSplashScreen";

// Keep the splash screen visible while we fetch resources
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
      // Sembunyikan native splash screen segera setelah font siap
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      {showSplash ? (
        <AnimatedSplashScreen onAnimationComplete={() => setShowSplash(false)} />
      ) : (
        <Stack screenOptions={{ headerShown: false }} />
      )}
    </>
  );
}
