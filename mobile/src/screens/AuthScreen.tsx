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
          <Stop offset="0%" stopColor="#ffffff" />
          <Stop offset="100%" stopColor="#ffffff" />
        </SvgLinearGradient>
        <RadialGradient id="pinkGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#ff3d5c" stopOpacity={0.09} />
          <Stop offset="65%" stopColor="#ff3d5c" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="coralGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#ff3d5c" stopOpacity={0.06} />
          <Stop offset="70%" stopColor="#ff3d5c" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="plumGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#ff3d5c" stopOpacity={0.085} />
          <Stop offset="65%" stopColor="#ff3d5c" stopOpacity={0} />
        </RadialGradient>
        <SvgLinearGradient id="topBlush" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#ff3d5c" stopOpacity={0.06} />
          <Stop offset="100%" stopColor="#ff3d5c" stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="url(#authBase)" />
      <Rect x="0" y="0" width={width} height={Math.min(1100, height * 0.7)} fill="url(#topBlush)" opacity={0.9} />
      <Ellipse cx={width * 0.16} cy={height * 0.18} rx={width * 0.42} ry={width * 0.42} fill="url(#pinkGlow)" />
      <Ellipse cx={width * 0.86} cy={height * 0.14} rx={width * 0.25} ry={width * 0.25} fill="url(#coralGlow)" />
      <Ellipse cx={width * 0.5} cy={height * 0.36} rx={width * 0.62} ry={height * 0.2} fill="url(#plumGlow)" />
      <Ellipse cx={width * 0.48} cy={height * 0.2} rx={width * 0.76} ry={height * 0.16} fill="url(#plumGlow)" opacity={0.6} />
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
  const [selectedMode, setSelectedMode] = useState<"signup" | "login">("signup");
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
  const modeProgress = useState(new Animated.Value(0))[0];

  const animateToForm = (nextMode: "signup" | "login") => {
    setSelectedMode(nextMode);
    modeProgress.setValue(nextMode === "login" ? 1 : 0);

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
    if (nextMode === selectedMode) {
      return;
    }

    setSelectedMode(nextMode);
    setError("");
    modeProgress.stopAnimation();
    Animated.timing(modeProgress, {
      toValue: nextMode === "login" ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleAuthSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    if (!cleanEmail || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    if (selectedMode === "signup" && !cleanName) {
      setError("Enter your name to create an account.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      setLoading(true);
      setError("");

      const result =
        selectedMode === "signup"
          ? await registerUser({
              name: cleanName,
              email: cleanEmail,
              password,
              bio: "",
              location_city: "",
            })
          : await loginUser({
              email: cleanEmail,
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

  const signupPanelStyle = {
    opacity: modeProgress.interpolate({
      inputRange: [0, 0.45, 1],
      outputRange: [1, 0.2, 0],
    }),
    transform: [
      {
        translateX: modeProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -18],
        }),
      },
    ],
  };

  const loginPanelStyle = {
    opacity: modeProgress.interpolate({
      inputRange: [0, 0.55, 1],
      outputRange: [0, 0.2, 1],
    }),
    transform: [
      {
        translateX: modeProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

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
                      selectedMode === "signup" && styles.modePillActive,
                      pressed && styles.modePillPressed,
                    ]}
                    onPress={() => animateAuthModeChange("signup")}
                  >
                    <Text
                      style={[
                        styles.modePillText,
                        selectedMode === "signup" && styles.modePillTextActive,
                      ]}
                    >
                      Sign up
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.modePill,
                      selectedMode === "login" && styles.modePillActive,
                      pressed && styles.modePillPressed,
                    ]}
                    onPress={() => animateAuthModeChange("login")}
                  >
                    <Text
                      style={[
                        styles.modePillText,
                        selectedMode === "login" && styles.modePillTextActive,
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
                ]}
              >
                <View style={styles.formStage}>
                  <Animated.View
                    pointerEvents={selectedMode === "signup" ? "auto" : "none"}
                    style={[styles.formPanel, signupPanelStyle]}
                  >
                    <Text style={styles.kicker}>Create account</Text>

                    <Text style={styles.formTitle}>
                      Start with your email, then build the vibe.
                    </Text>

                    <View style={styles.formCardShell}>
                      <LinearGradient
                        colors={["rgba(255,255,255,0.09)", "rgba(255,255,255,0.03)"]}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 0.9, y: 1 }}
                        style={styles.formCard}
                      >
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
                            placeholder="Create a password"
                            placeholderTextColor="#C8C0C8"
                            secureTextEntry
                            style={styles.input}
                          />
                        </View>

                        {selectedMode === "signup" && error ? (
                          <Text style={styles.errorText}>{error}</Text>
                        ) : null}

                        <Pressable
                          style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.buttonPressed,
                            loading && styles.buttonDisabled,
                          ]}
                          onPress={handleAuthSubmit}
                          disabled={loading || selectedMode !== "signup"}
                        >
                          <LinearGradient
                            colors={["#FF4F88", "#FF6A71", "#FF7A59"]}
                            locations={[0, 0.6, 1]}
                            start={{ x: 0, y: 0.2 }}
                            end={{ x: 1, y: 0.8 }}
                            style={styles.primaryGradient}
                          />
                          <Text style={styles.primaryButtonText}>
                            {loading && selectedMode === "signup"
                              ? "Please wait..."
                              : "Create account"}
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

                  <Animated.View
                    pointerEvents={selectedMode === "login" ? "auto" : "none"}
                    style={[styles.formPanel, loginPanelStyle]}
                  >
                    <Text style={styles.kicker}>Welcome back</Text>

                    <Text style={styles.formTitle}>
                      Sign back in and pick up where you left off.
                    </Text>

                    <View style={styles.formCardShell}>
                      <LinearGradient
                        colors={["rgba(255,255,255,0.09)", "rgba(255,255,255,0.03)"]}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 0.9, y: 1 }}
                        style={styles.formCard}
                      >
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
                            placeholder="Enter your password"
                            placeholderTextColor="#C8C0C8"
                            secureTextEntry
                            style={styles.input}
                          />
                        </View>

                        {selectedMode === "login" && error ? (
                          <Text style={styles.errorText}>{error}</Text>
                        ) : null}

                        <Pressable
                          style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.buttonPressed,
                            loading && styles.buttonDisabled,
                          ]}
                          onPress={handleAuthSubmit}
                          disabled={loading || selectedMode !== "login"}
                        >
                          <LinearGradient
                            colors={["#FF4F88", "#FF6A71", "#FF7A59"]}
                            locations={[0, 0.6, 1]}
                            start={{ x: 0, y: 0.2 }}
                            end={{ x: 1, y: 0.8 }}
                            style={styles.primaryGradient}
                          />
                          <Text style={styles.primaryButtonText}>
                            {loading && selectedMode === "login"
                              ? "Please wait..."
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
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  svgBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "transparent",
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
    backgroundColor: "#0b0b0c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 6,
  },
  logoMarkText: {
    color: "#ffffff",
    fontSize: 20,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  brandWordmark: {
    color: "#0b0b0c",
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
    color: "#0b0b0c",
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
    color: "rgba(11,11,12,0.66)",
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
    color: "#0b0b0c",
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
    backgroundColor: "#ff3d5c",
    shadowColor: "#ff3d5c",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 32,
    elevation: 8,
  },
  primaryGradient: {
    ...StyleSheet.absoluteFill,
    borderRadius: 17,
    backgroundColor: "#ff3d5c",
  },
  primaryButtonText: {
    color: "#ffffff",
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
    borderColor: "rgba(11,11,12,0.12)",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#0b0b0c",
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
    backgroundColor: "#f9eff2",
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
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(11,11,12,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPressed: {
    opacity: 0.82,
  },
  backButtonText: {
    color: "#0b0b0c",
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
    backgroundColor: "#f9eff2",
    borderWidth: 1,
    borderColor: "rgba(11,11,12,0.12)",
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
    backgroundColor: "#ff3d5c",
  },
  modePillPressed: {
    opacity: 0.88,
  },
  modePillText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: "SpaceGrotesk_500Medium",
    color: "rgba(11,11,12,0.66)",
    includeFontPadding: false,
  },
  modePillTextActive: {
    color: "#ffffff",
  },
  modePillTextInactive: {
    color: "rgba(11,11,12,0.52)",
  },
  formContentWrap: {
    flex: 1,
  },
  formStage: {
    position: "relative",
    minHeight: 438,
  },
  formPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  kicker: {
    color: "rgba(11,11,12,0.52)",
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1.9,
    textTransform: "uppercase",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 10,
    includeFontPadding: false,
  },
  formTitle: {
    color: "#0b0b0c",
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
    borderWidth: 1.5,
    borderColor: "rgba(11,11,12,0.12)",
    backgroundColor: "#ffffff",
    shadowColor: "rgba(11,11,12,0.14)",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 1,
    shadowRadius: 70,
    elevation: 4,
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
    backgroundColor: "rgba(255,61,92,0.04)",
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: "rgba(11,11,12,0.66)",
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
    borderWidth: 1.5,
    borderColor: "rgba(11,11,12,0.12)",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    color: "#0b0b0c",
    fontSize: 14,
    lineHeight: 17,
    fontFamily: "SpaceGrotesk_400Regular",
    includeFontPadding: false,
  },
  errorText: {
    color: "#e11d48",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "SpaceGrotesk_500Medium",
    marginBottom: 12,
    includeFontPadding: false,
  },
  formFootnote: {
    marginTop: 16,
    color: "rgba(11,11,12,0.52)",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "SpaceGrotesk_400Regular",
    maxWidth: 220,
    includeFontPadding: false,
  },
});