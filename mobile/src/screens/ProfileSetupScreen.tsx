import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

import { getUserProfile, updateUserProfile } from "../lib/profile";
import type { TokenResponse, UserProfileResponse } from "../types/auth";

type ProfileSetupScreenProps = {
  session: TokenResponse;
  onSignOut: () => void;
  onComplete: () => void;
};

type ProfileStepKey =
  | "name"
  | "dob"
  | "gender"
  | "sexuality"
  | "pronouns"
  | "location";

type ProfileState = {
  name: string;
  dob: string;
  gender: string;
  sexuality: string;
  pronouns: string;
  location: string;
};

type Choice = {
  label: string;
  value: string;
};

type StepConfig = {
  key: ProfileStepKey;
  eyebrow: string;
  title: string;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  choices?: Choice[];
};

const GENDER_CHOICES: Choice[] = [
  { label: "Woman", value: "woman" },
  { label: "Man", value: "man" },
  { label: "Non-binary", value: "non_binary" },
  { label: "Trans woman", value: "trans_woman" },
  { label: "Trans man", value: "trans_man" },
  { label: "Still figuring it out", value: "figuring_it_out" },
];

const SEXUALITY_CHOICES: Choice[] = [
  { label: "Straight", value: "straight" },
  { label: "Gay", value: "gay" },
  { label: "Lesbian", value: "lesbian" },
  { label: "Bisexual", value: "bisexual" },
  { label: "Pansexual", value: "pansexual" },
  { label: "Queer", value: "queer" },
];

const PRONOUN_CHOICES: Choice[] = [
  { label: "She / her", value: "she_her" },
  { label: "He / him", value: "he_him" },
  { label: "They / them", value: "they_them" },
  { label: "Any", value: "any" },
];

const PROFILE_STEPS: StepConfig[] = [
  {
    key: "name",
    eyebrow: "Core profile",
    title: "What should people call you?",
    placeholder: "Your first name",
  },
  {
    key: "dob",
    eyebrow: "Core profile",
    title: "When's your birthday?",
    placeholder: "DD / MM / YYYY",
    keyboardType: "numeric",
  },
  {
    key: "gender",
    eyebrow: "Identity",
    title: "How do you identify?",
    choices: GENDER_CHOICES,
  },
  {
    key: "sexuality",
    eyebrow: "Identity",
    title: "What describes your sexuality?",
    choices: SEXUALITY_CHOICES,
  },
  {
    key: "pronouns",
    eyebrow: "Identity",
    title: "What pronouns should we show?",
    choices: PRONOUN_CHOICES,
  },
  {
    key: "location",
    eyebrow: "Discovery",
    title: "Where are you dating from?",
    placeholder: "City or area",
  },
];

export function ProfileSetupScreen({
  session,
  onSignOut,
  onComplete,
}: ProfileSetupScreenProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 430);
  const topInset =
    Platform.OS === "android" ? (NativeStatusBar.currentHeight ?? 0) + 18 : 18;

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [profile, setProfile] = useState<ProfileState>({
    name: session.user.name ?? "",
    dob: "",
    gender: "",
    sexuality: "",
    pronouns: "",
    location: session.user.location_city ?? "",
  });
  const [screenError, setScreenError] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingStep, setIsSavingStep] = useState(false);

  const formatDobFromApi = (value: string | null) => {
    if (!value) {
      return "";
    }

    const [year, month, day] = value.split("-");
    if (!year || !month || !day) {
      return "";
    }

    return `${day} / ${month} / ${year}`;
  };

  const formatDobForApi = (value: string) => {
    const [day, month, year] = value.split(" / ");
    if (!day || !month || !year || year.length !== 4) {
      return "";
    }

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setIsLoadingProfile(true);
        setScreenError("");

        const data = await getUserProfile(session.user.id, session.access_token);

        if (!isMounted) {
          return;
        }

        setProfile({
          name: data.name ?? "",
          dob: formatDobFromApi(data.date_of_birth),
          gender: data.gender ?? "",
          sexuality: data.sexuality ?? "",
          pronouns: data.pronouns ?? "",
          location: data.location_city ?? "",
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setScreenError(
          error instanceof Error ? error.message : "Could not load your profile."
        );
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [session.access_token, session.user.id]);

  if (!fontsLoaded) {
    return null;
  }

  const currentStep = PROFILE_STEPS[stepIndex];
  const progress = (stepIndex + 1) / PROFILE_STEPS.length;
  const progressPercent = Math.round(progress * 100);
  const isLastStep = stepIndex === PROFILE_STEPS.length - 1;

  const formatDobInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 8);
    let cursor = 0;
    let day = "";
    let month = "";
    let year = "";

    if (digitsOnly.length >= 1) {
      const firstDayDigit = digitsOnly[0];

      if (Number(firstDayDigit) > 3) {
        day = `0${firstDayDigit}`;
        cursor = 1;
      } else if (digitsOnly.length >= 2) {
        day = digitsOnly.slice(0, 2);
        cursor = 2;
      } else {
        day = firstDayDigit;
      }
    }

    const monthDigits = digitsOnly.slice(cursor);

    if (monthDigits.length >= 1 && day.length === 2) {
      const firstMonthDigit = monthDigits[0];

      if (Number(firstMonthDigit) > 1) {
        month = `0${firstMonthDigit}`;
        cursor += 1;
      } else if (monthDigits.length >= 2) {
        month = monthDigits.slice(0, 2);
        cursor += 2;
      } else {
        month = firstMonthDigit;
        cursor += 1;
      }
    }

    year = digitsOnly.slice(cursor, cursor + 4);

    if (!day) {
      return "";
    }

    if (day.length < 2) {
      return day;
    }

    if (!month) {
      return `${day} / `;
    }

    if (month.length < 2) {
      return `${day} / ${month}`;
    }

    if (!year) {
      return `${day} / ${month} / `;
    }

    return `${day} / ${month} / ${year}`;
  };

  const updateField = (value: string) => {
    const nextValue =
      currentStep.key === "dob" ? formatDobInput(value) : value;

    setProfile((current) => ({
      ...current,
      [currentStep.key]: nextValue,
    }));
  };

  const currentValue = profile[currentStep.key];

  const getDobValidationMessage = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");

    if (digitsOnly.length < 8) {
      return "Enter your full birth date in DD / MM / YYYY format.";
    }

    const [dayText, monthText, yearText] = value.split(" / ");

    if (!dayText || !monthText || !yearText || yearText.length !== 4) {
      return "Enter your full birth date in DD / MM / YYYY format.";
    }

    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);

    if (month < 1 || month > 12) {
      return "Month must be between 01 and 12.";
    }

    if (day < 1 || day > 31) {
      return "Day must be between 01 and 31.";
    }

    const candidateDate = new Date(year, month - 1, day);
    const isRealDate =
      candidateDate.getFullYear() === year &&
      candidateDate.getMonth() === month - 1 &&
      candidateDate.getDate() === day;

    if (!isRealDate) {
      return "That date does not exist on the calendar.";
    }

    const today = new Date();

    if (candidateDate > today) {
      return "Birth date cannot be in the future.";
    }

    let age = today.getFullYear() - year;
    const hasHadBirthdayThisYear =
      today.getMonth() > month - 1 ||
      (today.getMonth() === month - 1 && today.getDate() >= day);

    if (!hasHadBirthdayThisYear) {
      age -= 1;
    }

    if (age < 18) {
      return "You must be at least 18 years old to use VibeMatch.";
    }

    return "";
  };

  const currentStepError =
    currentStep.key === "dob" ? getDobValidationMessage(currentValue) : "";

  const isStepValid =
    typeof currentValue === "string"
      ? currentValue.trim().length > 0 && !currentStepError
      : false;

  const buildProfilePayloadForCurrentStep = () => {
    switch (currentStep.key) {
      case "name":
        return { name: profile.name.trim() };
      case "dob":
        return { date_of_birth: formatDobForApi(profile.dob) };
      case "gender":
        return { gender: profile.gender };
      case "sexuality":
        return { sexuality: profile.sexuality };
      case "pronouns":
        return { pronouns: profile.pronouns };
      case "location":
        return { location_city: profile.location.trim() };
      default:
        return {};
    }
  };

  const hydrateProfileFromResponse = (data: UserProfileResponse) => {
    setProfile((current) => ({
      ...current,
      name: data.name ?? current.name,
      dob: data.date_of_birth ? formatDobFromApi(data.date_of_birth) : current.dob,
      gender: data.gender ?? current.gender,
      sexuality: data.sexuality ?? current.sexuality,
      pronouns: data.pronouns ?? current.pronouns,
      location: data.location_city ?? current.location,
    }));
  };

  const handleNext = async () => {
    if (!isStepValid) {
      return;
    }

    try {
      setIsSavingStep(true);
      setScreenError("");

      const updatedProfile = await updateUserProfile(
        session.user.id,
        session.access_token,
        buildProfilePayloadForCurrentStep()
      );

      hydrateProfileFromResponse(updatedProfile);

      if (!isLastStep) {
        setStepIndex((current) => current + 1);
      } else {
        onComplete();
      }
    } catch (error) {
      setScreenError(
        error instanceof Error
          ? error.message
          : "Could not save this step right now."
      );
    } finally {
      setIsSavingStep(false);
    }
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      return;
    }

    setStepIndex((current) => current - 1);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.fixedTopPanelWrap, { paddingTop: topInset }]}>
        <View style={[styles.topPanel, { width: contentWidth }]}>
          <View style={styles.titleWrap}>
            <Text style={styles.topPanelTitle}>Profile setup</Text>
            <Text style={styles.topPanelSubcopy}>
              {`step ${stepIndex + 1} of ${PROFILE_STEPS.length}`}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.iconGhost,
              pressed && styles.iconGhostPressed,
            ]}
            onPress={onSignOut}
          >
            <Text style={styles.iconGhostText}>x</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 94,
            paddingBottom: 28,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, { width: contentWidth }]}>
          <View style={styles.progressBlock}>
            <View style={styles.progressTop}>
              <Text style={styles.progressLabel}>{currentStep.eyebrow}</Text>
              <Text style={styles.progressValue}>{`${progressPercent}%`}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
          </View>

          {isLoadingProfile ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#82F7A6" />
              <Text style={styles.loadingText}>Loading your profile...</Text>
            </View>
          ) : (
            <View style={styles.questionCard}>
              <Text style={styles.kicker}>Matching signal</Text>
              <Text style={styles.title}>{currentStep.title}</Text>

              {currentStep.choices ? (
                <View style={styles.choiceGrid}>
                  {currentStep.choices.map((choice) => {
                    const isActive = currentValue === choice.value;

                    return (
                      <Pressable
                        key={choice.value}
                        style={({ pressed }) => [
                          styles.choiceTile,
                          isActive && styles.choiceTileActive,
                          pressed && styles.choiceTilePressed,
                        ]}
                        onPress={() => updateField(choice.value)}
                      >
                        <Text
                          style={[
                            styles.choiceTileText,
                            isActive && styles.choiceTileTextActive,
                          ]}
                        >
                          {choice.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.inputBlock}>
                  <TextInput
                    value={currentValue}
                    onChangeText={updateField}
                    placeholder={currentStep.placeholder}
                    placeholderTextColor="#9D97A5"
                    keyboardType={currentStep.keyboardType ?? "default"}
                    autoCapitalize={
                      currentStep.key === "location" || currentStep.key === "name"
                        ? "words"
                        : "none"
                    }
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
              )}

              {currentStepError ? (
                <Text style={styles.errorText}>{currentStepError}</Text>
              ) : null}

              <View style={styles.footerRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    stepIndex === 0 && styles.secondaryButtonDisabled,
                    pressed && stepIndex !== 0 && styles.secondaryButtonPressed,
                  ]}
                  onPress={handleBack}
                  disabled={stepIndex === 0}
                >
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    (!isStepValid || isSavingStep) && styles.primaryButtonDisabled,
                    pressed &&
                      isStepValid &&
                      !isSavingStep &&
                      styles.primaryButtonPressed,
                  ]}
                  onPress={handleNext}
                  disabled={!isStepValid || isSavingStep}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSavingStep
                      ? "Saving..."
                      : isLastStep
                        ? "Save and continue"
                        : "Continue"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {screenError ? (
            <View style={styles.bannerError}>
              <Text style={styles.bannerErrorText}>{screenError}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  fixedTopPanelWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
    backgroundColor: "rgba(13,10,17,0.12)",
  },
  topPanel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 14,
  },
  titleWrap: {
    gap: 4,
  },
  topPanelTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.5,
  },
  topPanelSubcopy: {
    color: "rgba(255,248,251,0.56)",
    fontSize: 12,
    textTransform: "lowercase",
    fontFamily: "SpaceGrotesk_500Medium",
  },
  iconGhost: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconGhostPressed: {
    opacity: 0.8,
  },
  iconGhostText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  content: {
    minHeight: "100%",
  },
  progressBlock: {
    marginBottom: 16,
  },
  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: {
    color: "rgba(255,248,251,0.76)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  progressValue: {
    color: "rgba(255,248,251,0.76)",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#F26A8D",
    borderRadius: 999,
  },
  loadingCard: {
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    color: "rgba(255,248,251,0.72)",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  questionCard: {
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 18,
    marginBottom: 16,
  },
  kicker: {
    fontSize: 11,
    color: "rgba(255,248,251,0.72)",
    textTransform: "uppercase",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 10,
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 30,
    lineHeight: 31,
    color: "#FFFFFF",
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -1.2,
    maxWidth: 300,
  },
  inputBlock: {
    marginTop: 18,
  },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 16,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  choiceTile: {
    width: "48.5%",
    minHeight: 72,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  choiceTileActive: {
    backgroundColor: "rgba(255,105,122,0.20)",
    borderColor: "rgba(255,122,89,0.34)",
  },
  choiceTilePressed: {
    opacity: 0.88,
  },
  choiceTileText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  choiceTileTextActive: {
    color: "#FFFFFF",
  },
  errorText: {
    marginTop: 12,
    color: "#FFB4B6",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  footerRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonPressed: {
    opacity: 0.85,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  primaryButton: {
    flex: 1.3,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#F26A8D",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonPressed: {
    opacity: 0.92,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  bannerError: {
    borderRadius: 18,
    backgroundColor: "rgba(180,35,24,0.18)",
    borderWidth: 1,
    borderColor: "rgba(244,199,199,0.18)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 18,
  },
  bannerErrorText: {
    color: "#FFCCCF",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "SpaceGrotesk_500Medium",
  },
});
