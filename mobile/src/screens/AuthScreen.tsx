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
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

export function AuthScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 420);
  const topInset =
    Platform.OS === "android" ? (NativeStatusBar.currentHeight ?? 0) + 18 : 18;
  const panelHeight = 64;

  const [showForm, setShowForm] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const animateToForm = () => {
    Animated.parallel([
      Animated.timing(landingOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(landingTranslate, {
        toValue: -18,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowForm(true);
      formOpacity.setValue(0);
      formTranslate.setValue(24);
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
        toValue: 18,
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
    if (nextMode === authMode) return;

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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.fixedTopPanelWrap,
          {
            paddingTop: topInset,
          },
        ]}
      >
        <View style={[styles.topPanel, { width: contentWidth }]}>
          <View style={styles.brandHeader}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>V</Text>
            </View>
            <Text style={styles.brandName}>VibeMatch</Text>
          </View>
          <View style={styles.panelUtilityButton}>
            <View style={styles.panelUtilityDot} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + panelHeight + 24,
            paddingBottom: 28,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.content, { width: contentWidth }]}>
          {!showForm ? (
            <Animated.View
              style={[
                styles.animatedSection,
                {
                  opacity: landingOpacity,
                  transform: [{ translateX: landingTranslate }],
                },
              ]}
            >
              <View style={styles.heroBlock}>
                <Text style={styles.kicker}>Music-led dating</Text>
                <Text style={styles.title}>
                  Your music taste says more than your bio ever could.
                </Text>
                <Text style={styles.subtitle}>
                  Find connections through energy, personality, and sound.
                </Text>
              </View>

              <View style={styles.visualCard}>
                <View style={styles.visualGlowBlue} />
                <View style={styles.visualGlowPeach} />

                <View style={styles.mockCluster}>
                  <View style={[styles.mockCard, styles.mockCardLeft]} />
                  <View style={[styles.mockCard, styles.mockCardCenter]}>
                    <Text style={styles.mockCardLabel}>
                      profile{"\n"}music card
                    </Text>
                  </View>
                  <View style={[styles.mockCard, styles.mockCardRight]} />
                </View>

                <View style={styles.visualCopy}>
                  <Text style={styles.visualTitle}>Music-led matches</Text>
                  <Text style={styles.visualText}>
                    Built for people who care about vibes, not just looks.
                  </Text>
                </View>

                <View style={styles.progressRow}>
                  <View style={[styles.progressDot, styles.progressDotActive]} />
                  <View style={styles.progressDot} />
                  <View style={styles.progressDot} />
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={animateToForm}
                >
                  <Text style={styles.primaryButtonText}>
                    Continue with email
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>
                    Use phone number
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.formScreen,
                styles.animatedSection,
                {
                  opacity: formOpacity,
                  transform: [{ translateX: formTranslate }],
                },
              ]}
            >
              <View style={styles.formTopRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed && styles.backButtonPressed,
                  ]}
                  onPress={animateToLanding}
                >
                  <Text style={styles.backButtonText}>Back</Text>
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
                      authMode === "login" && styles.modePillActive,
                      pressed && styles.modePillPressed,
                    ]}
                    onPress={() => animateAuthModeChange("login")}
                  >
                    <Text
                      style={[
                        styles.modePillText,
                        authMode === "login" && styles.modePillTextActive,
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
                <View style={styles.formHero}>
                  <Text style={styles.kicker}>
                    {authMode === "signup"
                      ? "Create your account"
                      : "Welcome back"}
                  </Text>
                  <Text style={styles.formTitle}>
                    {authMode === "signup"
                      ? "Let's start with your email."
                      : "Pick up where your vibe left off."}
                  </Text>
                  <Text style={styles.formSubtitle}>
                    {authMode === "signup"
                      ? "We'll use this to build your profile, connect your music taste, and get you into the app."
                      : "Log in to keep building your profile and continue matching through music."}
                  </Text>
                </View>

                <View style={styles.formCard}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      placeholderTextColor="#98A2B3"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#98A2B3"
                      secureTextEntry
                      style={styles.input}
                    />
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {authMode === "signup" ? "Create account" : "Continue"}
                    </Text>
                  </Pressable>

                  <Text style={styles.formFootnote}>
                    By continuing, you agree to our terms and privacy policy.
                  </Text>
                </View>
              </Animated.View>
            </Animated.View>
          )}

          <View style={styles.altSection}>
            <View style={styles.dividerLine} />
            <Text style={styles.altText}>
              {showForm ? "or keep going with" : "or sign up with"}
            </Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <Pressable style={styles.socialButton}>
              <Text style={styles.socialButtonText}>f</Text>
            </Pressable>
            <Pressable style={styles.socialButton}>
              <Text style={styles.socialButtonText}>G</Text>
            </Pressable>
            <Pressable style={styles.socialButton}>
              <Text style={styles.socialButtonText}>A</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Terms of use</Text>
            <Text style={styles.footerDivider}>/</Text>
            <Text style={styles.footerText}>Privacy Policy</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F6F4",
  },
  fixedTopPanelWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
    backgroundColor: "#F7F6F4",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  content: {
    minHeight: "100%",
  },
  topPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF2",
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#17181C",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  brandIconText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  brandName: {
    fontSize: 21,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#17181C",
    letterSpacing: -0.3,
  },
  panelUtilityButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E6EB",
    justifyContent: "center",
    alignItems: "center",
  },
  panelUtilityDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#6EA0F8",
  },
  heroBlock: {
    marginBottom: 28,
  },
  animatedSection: {
    marginBottom: 28,
  },
  formScreen: {
    marginBottom: 28,
  },
  formContentWrap: {
    flex: 1,
  },
  kicker: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#6EA0F8",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#17181C",
    letterSpacing: -0.8,
    marginBottom: 14,
    maxWidth: 340,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 27,
    color: "#667085",
    maxWidth: 360,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  visualCard: {
    borderRadius: 34,
    backgroundColor: "#FBF9F5",
    borderWidth: 1,
    borderColor: "#E4E6EB",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    marginBottom: 28,
    overflow: "hidden",
  },
  visualGlowBlue: {
    position: "absolute",
    top: 88,
    left: -36,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(110,160,248,0.14)",
  },
  visualGlowPeach: {
    position: "absolute",
    right: -24,
    bottom: 70,
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "rgba(255,164,142,0.16)",
  },
  mockCluster: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  mockCard: {
    position: "absolute",
    width: 74,
    height: 118,
    borderRadius: 18,
  },
  mockCardLeft: {
    left: "22%",
    backgroundColor: "#F5D2E4",
  },
  mockCardCenter: {
    width: 106,
    height: 136,
    borderRadius: 24,
    backgroundColor: "#E9EEFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  mockCardRight: {
    right: "22%",
    backgroundColor: "#EEDFCB",
  },
  mockCardLabel: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "SpaceGrotesk_500Medium",
    color: "#475467",
  },
  visualCopy: {
    marginBottom: 18,
  },
  visualTitle: {
    fontSize: 31,
    lineHeight: 35,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#17181C",
    letterSpacing: -0.6,
    marginBottom: 10,
    maxWidth: 260,
  },
  visualText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#667085",
    maxWidth: 300,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#D0D5DD",
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: "#6EA0F8",
    width: 22,
  },
  actions: {
    gap: 12,
    marginBottom: 22,
  },
  primaryButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#17181C",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  secondaryButton: {
    height: 50,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E6EB",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonPressed: {
    opacity: 0.85,
    backgroundColor: "#F8F9FB",
  },
  secondaryButtonText: {
    color: "#17181C",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  formTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backButtonText: {
    color: "#667085",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  modeSwitch: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E6EB",
    borderRadius: 999,
    padding: 4,
  },
  modePill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modePillActive: {
    backgroundColor: "#17181C",
  },
  modePillPressed: {
    opacity: 0.88,
  },
  modePillText: {
    color: "#667085",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  modePillTextActive: {
    color: "#FFFFFF",
  },
  formHero: {
    marginBottom: 22,
  },
  formTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#17181C",
    letterSpacing: -0.6,
    marginBottom: 12,
    maxWidth: 320,
  },
  formSubtitle: {
    fontSize: 16,
    lineHeight: 25,
    color: "#667085",
    maxWidth: 360,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  formCard: {
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E6EB",
    padding: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#344054",
    fontSize: 14,
    marginBottom: 8,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4E6EB",
    backgroundColor: "#FCFCFD",
    paddingHorizontal: 16,
    color: "#17181C",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  formFootnote: {
    marginTop: 14,
    color: "#98A2B3",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    fontFamily: "SpaceGrotesk_400Regular",
  },
  altSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E4E6EB",
  },
  altText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: "#98A2B3",
    fontFamily: "SpaceGrotesk_400Regular",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 26,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E6EB",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  socialButtonText: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#17181C",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#98A2B3",
    fontFamily: "SpaceGrotesk_400Regular",
  },
  footerDivider: {
    marginHorizontal: 8,
    color: "#98A2B3",
    fontFamily: "SpaceGrotesk_400Regular",
  },
});
