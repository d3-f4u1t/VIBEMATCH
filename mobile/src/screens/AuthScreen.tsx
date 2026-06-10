import { useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import Svg, {
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { loginUser, registerUser } from "../lib/auth";
import type { TokenResponse } from "../types/auth";

type AuthScreenProps = {
  onAuthenticated: (result: TokenResponse) => void;
};

type AuthBackdropProps = {
  width: number;
  height: number;
};

function AuthBackdrop({ width, height }: AuthBackdropProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={styles.svgBackdrop}
    >
      <Defs>
        <SvgLinearGradient id="authBase" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#24111F" />
          <Stop offset="48%" stopColor="#130B15" />
          <Stop offset="100%" stopColor="#09070D" />
        </SvgLinearGradient>

        <RadialGradient id="pinkGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FF4D94" stopOpacity="0.72" />
          <Stop offset="52%" stopColor="#FF4D94" stopOpacity="0.34" />
          <Stop offset="100%" stopColor="#FF4F88" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient id="coralGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FF7B4F" stopOpacity="0.5" />
          <Stop offset="58%" stopColor="#FF7B4F" stopOpacity="0.22" />
          <Stop offset="100%" stopColor="#FF7A59" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient id="plumGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FF4D94" stopOpacity="0.3" />
          <Stop offset="60%" stopColor="#FF4D94" stopOpacity="0.12" />
          <Stop offset="100%" stopColor="#FF4F88" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient id="whiteHaze" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.028" />
          <Stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.008" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient id="topMist" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.036" />
          <Stop offset="62%" stopColor="#FFFFFF" stopOpacity="0.01" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Rect x="0" y="0" width={width} height={height} fill="url(#authBase)" />

      <Ellipse
        cx={width * 0.16}
        cy={height * 0.18}
        rx={width * 0.42}
        ry={width * 0.42}
        fill="url(#pinkGlow)"
      />
      <Ellipse
        cx={width * 0.86}
        cy={height * 0.14}
        rx={width * 0.25}
        ry={width * 0.25}
        fill="url(#coralGlow)"
      />
      <Ellipse
        cx={width * 0.78}
        cy={height * 0.83}
        rx={width * 0.21}
        ry={width * 0.21}
        fill="url(#plumGlow)"
      />
      <Ellipse
        cx={width * 0.5}
        cy={height * 0.36}
        rx={width * 0.62}
        ry={height * 0.2}
        fill="url(#whiteHaze)"
      />
      <Ellipse
        cx={width * 0.48}
        cy={height * 0.2}
        rx={width * 0.76}
        ry={height * 0.16}
        fill="url(#topMist)"
      />
    </Svg>
  );
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const { width, height } = useWindowDimensions();
  const contentWidth = Math.min(width - 40, 333);
  const topInset =
    Platform.OS === "android" ? (NativeStatusBar.currentHeight ?? 0) + 12 : 12;
  const stageHeight = Math.max(height - topInset - 32, 700);

  const [showForm, setShowForm] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  const landingOpacity = useState(new Animated.Value(1))[0];
  const landingTranslate = useState(new Animated.Value(0))[0];
  const formOpacity = useState(new Animated.Value(0))[0];
  const formTranslate = useState(new Animated.Value(26))[0];
  const formContentOpacity = useState(new Animated.Value(1))[0];
  const formContentTranslate = useState(new Animated.Value(0))[0];

  const animateToForm = (nextMode: "signup" | "login") => {
    setAuthMode(nextMode);

    Animated.parallel([
      Animated.timing(landingOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(landingTranslate, {
        toValue: -20,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowForm(true);
      formOpacity.setValue(0);
      formTranslate.setValue(28);
      formContentOpacity.setValue(1);
      formContentTranslate.setValue(0);

      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(formTranslate, {
          toValue: 0,
          damping: 18,
          stiffness: 190,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const animateToLanding = () => {
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formTranslate, {
        toValue: 16,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowForm(false);
      landingOpacity.setValue(0);
      landingTranslate.setValue(-18);

      Animated.parallel([
        Animated.timing(landingOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(landingTranslate, {
          toValue: 0,
          damping: 18,
          stiffness: 190,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const animateAuthModeChange = (nextMode: "signup" | "login") => {
    if (nextMode === authMode) {
      return;
    }

    const exitDirection = nextMode === "signup" ? 12 : -12;
    const enterDirection = nextMode === "signup" ? -12 : 12;

    Animated.parallel([
      Animated.timing(formContentOpacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(formContentTranslate, {
        toValue: exitDirection,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAuthMode(nextMode);
      formContentOpacity.setValue(0);
      formContentTranslate.setValue(enterDirection);

      Animated.parallel([
        Animated.timing(formContentOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(formContentTranslate, {
          toValue: 0,
          damping: 18,
          stiffness: 200,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleAuthSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        authMode === "signup"
          ? await registerUser({
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
              bio: "",
              location_city: "",
            })
          : await loginUser({
              email: email.trim().toLowerCase(),
              password,
            });

      onAuthenticated(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unexpected error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <AuthBackdrop width={width} height={height} />
      <View style={styles.vignette} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 20,
            paddingBottom: 32,
            minHeight: height,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.viewport, { width: contentWidth }]}>
          {!showForm ? (
            <Animated.View
              style={[
                styles.animatedSection,
                styles.landingLayout,
                { minHeight: stageHeight },
                {
                  opacity: landingOpacity,
                  transform: [{ translateY: landingTranslate }],
                },
              ]}
              shouldRasterizeIOS={false}
              renderToHardwareTextureAndroid={false}
            >
              <View style={styles.landingHero}>
                <View style={styles.logoMark}>
                  <Text style={styles.logoMarkText}>V</Text>
                </View>
                <Text style={styles.brandWordmark}>VibeMatch</Text>
                <Text style={styles.landingHeadline}>
                  Meet someone your playlist would choose.
                </Text>
              </View>

              <View style={styles.landingFooter}>
                <Text style={styles.landingLegal}>
                  By tapping <Text style={styles.legalStrong}>Create account</Text> or{" "}
                  <Text style={styles.legalStrong}>Sign in</Text>, you agree to our
                  terms and privacy policy.
                </Text>

                <View style={styles.buttonStack}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => animateToForm("signup")}
                  >
                    <LinearGradient
                      colors={["#FF4E88", "#FF6A71", "#FF7A5E"]}
                      locations={[0, 0.55, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.primaryGradient}
                    />
                    <Text style={styles.primaryButtonText}>Create account</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.secondaryButtonPressed,
                    ]}
                    onPress={() => animateToForm("login")}
                  >
                    <Text style={styles.secondaryButtonText}>Sign in</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.animatedSection,
                styles.formLayout,
                { minHeight: stageHeight },
                {
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslate }],
                },
              ]}
              shouldRasterizeIOS={false}
              renderToHardwareTextureAndroid={false}
            >
              <View style={styles.formTopRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed && styles.backButtonPressed,
                  ]}
                  onPress={animateToLanding}
                >
                  <Text style={styles.backButtonText}>{"<"}</Text>
                </Pressable>

                <View style={styles.modeSwitch}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modePill,
                      authMode === "signup" && styles.modePillActive,
                      pressed && styles.modePillPressed,
                    ]}
                    onPress={() => animateAuthModeChange("signup")}
                  >
                    <Text
                      style={[
                        styles.modePillText,
                        authMode === "signup" && styles.modePillTextActive,
                      ]}
                    >
                      Sign up
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.modePill,
                      authMode === "login" && styles.modePillPressed,
                    ]}
                    onPress={() => animateAuthModeChange("login")}
                  >
                    <Text
                      style={[
                        styles.modePillText,
                        authMode === "login" && styles.modePillTextInactive,
                      ]}
                    >
                      Log in
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Animated.View
                style={[
                  styles.formContentWrap,
                  {
                    opacity: formContentOpacity,
                    transform: [{ translateX: formContentTranslate }],
                  },
                ]}
              >
                <Text style={styles.kicker}>
                  {authMode === "signup" ? "Create account" : "Welcome back"}
                </Text>

                <Text style={styles.formTitle}>
                  {authMode === "signup"
                    ? "Start with your email, then build the vibe."
                    : "Sign back in and pick up where you left off."}
                </Text>

                <View style={styles.formCardShell}>
                  <LinearGradient
                    colors={["rgba(255,255,255,0.09)", "rgba(255,255,255,0.03)"]}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={styles.formCard}
                  >
                    {authMode === "signup" ? (
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput
                          value={name}
                          onChangeText={setName}
                          placeholder="Your name"
                          placeholderTextColor="#C8C0C8"
                          style={styles.input}
                          autoCapitalize="words"
                          autoCorrect={false}
                        />
                      </View>
                    ) : null}

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Email</Text>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        placeholderTextColor="#C8C0C8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder={
                          authMode === "signup"
                            ? "Create a password"
                            : "Enter your password"
                        }
                        placeholderTextColor="#C8C0C8"
                        secureTextEntry
                        style={styles.input}
                      />
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <Pressable
                      style={({ pressed }) => [
                        styles.primaryButton,
                        pressed && styles.buttonPressed,
                        loading && styles.buttonDisabled,
                      ]}
                      onPress={handleAuthSubmit}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={["#FF4F88", "#FF6A71", "#FF7A59"]}
                        locations={[0, 0.6, 1]}
                        start={{ x: 0, y: 0.2 }}
                        end={{ x: 1, y: 0.8 }}
                        style={styles.primaryGradient}
                      />
                      <Text style={styles.primaryButtonText}>
                        {loading
                          ? "Please wait..."
                          : authMode === "signup"
                            ? "Create account"
                            : "Continue"}
                      </Text>
                    </Pressable>

                    <Text style={styles.formFootnote}>
                      By continuing, you agree to the terms and privacy policy.
                    </Text>
                  </LinearGradient>
                  <LinearGradient
                    colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0)"]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.formGloss}
                    pointerEvents="none"
                  />
                </View>
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#09070D",
    overflow: "hidden",
  },
  svgBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,1,5,0.12)",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  viewport: {
    flex: 1,
    justifyContent: "center",
  },
  animatedSection: {
    flex: 1,
  },
  landingLayout: {
    justifyContent: "space-between",
    paddingHorizontal: 2,
    paddingTop: 26,
    paddingBottom: 8,
  },
  landingHero: {
    alignItems: "center",
    marginTop: 112,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.98)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 6,
  },
  logoMarkText: {
    color: "#19111A",
    fontSize: 20,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  brandWordmark: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 34,
    letterSpacing: -2.1,
    fontFamily: Platform.select({
      android: "sans-serif-black",
      default: "SpaceGrotesk_700Bold",
    }),
    marginBottom: 18,
    includeFontPadding: false,
  },
  landingHeadline: {
    color: "#FFF8FB",
    fontSize: 17,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: Platform.select({
      android: "sans-serif-medium",
      default: "SpaceGrotesk_500Medium",
    }),
    letterSpacing: -0.4,
    maxWidth: 248,
    includeFontPadding: false,
  },
  landingFooter: {
    paddingBottom: 2,
  },
  landingLegal: {
    color: "rgba(255,248,251,0.88)",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    fontFamily: Platform.select({
      android: "sans-serif",
      default: "SpaceGrotesk_400Regular",
    }),
    maxWidth: 252,
    alignSelf: "center",
    marginBottom: 18,
    includeFontPadding: false,
  },
  legalStrong: {
    color: "#FFFFFF",
    fontFamily: Platform.select({
      android: "sans-serif-bold",
      default: "SpaceGrotesk_700Bold",
    }),
  },
  buttonStack: {
    gap: 12,
  },
  primaryButton: {
    height: 52,
    borderRadius: 17,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF5A84",
    shadowColor: "#050109",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 32,
    elevation: 8,
  },
  primaryGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 17,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 17,
    fontFamily: Platform.select({
      android: "sans-serif-bold",
      default: "SpaceGrotesk_700Bold",
    }),
    includeFontPadding: false,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.86)",
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 17,
    fontFamily: Platform.select({
      android: "sans-serif-bold",
      default: "SpaceGrotesk_700Bold",
    }),
    includeFontPadding: false,
  },
  buttonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
  secondaryButtonPressed: {
    opacity: 0.84,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  formLayout: {
    paddingTop: 10,
  },
  formTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPressed: {
    opacity: 0.82,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 16,
    fontFamily: "SpaceGrotesk_500Medium",
    marginLeft: -1,
    includeFontPadding: false,
  },
  modeSwitch: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  modePill: {
    minWidth: 74,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  modePillActive: {
    backgroundColor: "#FF5A84",
  },
  modePillPressed: {
    opacity: 0.88,
  },
  modePillText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: "SpaceGrotesk_500Medium",
    color: "rgba(255,248,251,0.74)",
    includeFontPadding: false,
  },
  modePillTextActive: {
    color: "#FFFFFF",
  },
  modePillTextInactive: {
    color: "rgba(255,244,248,0.72)",
  },
  formContentWrap: {
    flex: 1,
  },
  kicker: {
    color: "rgba(255,248,251,0.72)",
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1.9,
    textTransform: "uppercase",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 10,
    includeFontPadding: false,
  },
  formTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 31,
    letterSpacing: -1.9,
    fontFamily: "SpaceGrotesk_700Bold",
    maxWidth: 314,
    marginBottom: 14,
    includeFontPadding: false,
  },
  formCardShell: {
    position: "relative",
    marginTop: 20,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  formCard: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
  },
  formGloss: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 88,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: "rgba(255,248,251,0.82)",
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "SpaceGrotesk_500Medium",
    marginBottom: 8,
    includeFontPadding: false,
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 16,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 17,
    fontFamily: "SpaceGrotesk_400Regular",
    includeFontPadding: false,
  },
  errorText: {
    color: "#FFB7BD",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "SpaceGrotesk_500Medium",
    marginBottom: 12,
    includeFontPadding: false,
  },
  formFootnote: {
    marginTop: 16,
    color: "rgba(255,248,251,0.68)",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "SpaceGrotesk_400Regular",
    maxWidth: 220,
    includeFontPadding: false,
  },
});
