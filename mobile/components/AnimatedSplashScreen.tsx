import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Image, StyleSheet, Easing } from "react-native";
import { colors } from "../constants/colors";

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

export default function AnimatedSplashScreen({
  onAnimationComplete,
}: AnimatedSplashScreenProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(15)).current;
  const sloganOpacity = useRef(new Animated.Value(0)).current;
  const sloganTranslateY = useRef(new Animated.Value(15)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Logo fades in and moves up
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]),
      // 2. Title fades in
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]),
      // 3. Slogan fades in
      Animated.parallel([
        Animated.timing(sloganOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(sloganTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]),
      // 4. Wait for a moment
      Animated.delay(1200),
      // 5. Fade out the whole container
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start(() => {
      onAnimationComplete();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
        },
      ]}
    >
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslateY }],
            alignItems: "center",
          }}
        >
          <Image
            source={require("../assets/LOGO CHICKENSHII-nobg.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
            marginTop: 20,
            alignItems: "center",
          }}
        >
          <Text style={styles.title}>
            <Text style={{ color: colors.primary }}>Chicken</Text>
            <Text style={{ color: colors.foreground }}>Shii</Text>
          </Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: sloganOpacity,
            transform: [{ translateY: sloganTranslateY }],
            marginTop: 10,
            alignItems: "center",
          }}
        >
          <Text style={styles.slogan}>Deteksi Cepat, Ayam Sehat</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999, // Ensure it sits on top of everything
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontFamily: "Outfit_900Black",
    fontSize: 36,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  slogan: {
    fontFamily: "Outfit_500Medium",
    fontSize: 15,
    color: colors.secondary,
    letterSpacing: 0.2,
  },
});
