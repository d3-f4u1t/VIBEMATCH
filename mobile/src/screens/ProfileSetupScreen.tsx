import { useState } from "react";
import {
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

import type { TokenResponse } from "../types/auth";

type ProfileSetupScreenProps = {
  session: TokenResponse;
  onSignOut: () => void;
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
  subtitle: string;
  placeholder?: string;
  helper?: string;
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
    subtitle: "Start with the name that should show up on your profile.",
    placeholder: "Your first name",
    helper: "You can always fine-tune how this appears later.",
  },
  {
    key: "dob",
    eyebrow: "Core profile",
    title: "When's your birthday?",
    subtitle: "We use this to calculate your age and keep the app age-aware.",
    placeholder: "DD / MM / YYYY",
    keyboardType: "numeric",
    helper: "Example: 08 / 10 / 2002",
  },
  {
    key: "gender",
    eyebrow: "Identity",
    title: "How do you identify?",
    subtitle: "This helps us shape who sees you and how your profile is understood.",
    choices: GENDER_CHOICES,
  },
  {
    key: "sexuality",
    eyebrow: "Identity",
    title: "What describes your sexuality?",
    subtitle: "This matters for compatibility, visibility, and respectful matching.",
    choices: SEXUALITY_CHOICES,
  },
  {
    key: "pronouns",
    eyebrow: "Identity",
    title: "What pronouns should we show?",
    subtitle: "Optional socially, but useful for profile clarity and comfort.",
    choices: PRONOUN_CHOICES,
  },
  {
    key: "location",
    eyebrow: "Discovery",
    title: "Where are you dating from?",
    subtitle: "We'll use your area for distance-based discovery and nearby matches.",
    placeholder: "City or area",
    helper: "We'll add maps and exact distance handling in the next phase.",
  },
];

export function ProfileSetupScreen({
  session,
  onSignOut,
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

  if (!fontsLoaded) {
    return null;
  }

  const currentStep = PROFILE_STEPS[stepIndex];
  const progress = (stepIndex + 1) / PROFILE_STEPS.length;
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

  const handleNext = () => {
    if (!isStepValid) return;
    if (!isLastStep) {
      setStepIndex((current) => current + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((current) => current - 1);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.fixedTopPanelWrap, { paddingTop: topInset }]}>
        <View style={[styles.topPanel, { width: contentWidth }]}>
          <View>
            <Text style={styles.topPanelEyebrow}>Profile setup</Text>
            <Text style={styles.topPanelTitle}>
              {`Step ${stepIndex + 1} of ${PROFILE_STEPS.length}`}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.signOutGhost,
              pressed && styles.ghostPressed,
            ]}
            onPress={onSignOut}
          >
            <Text style={styles.signOutGhostText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={[styles.progressTrack, { width: contentWidth }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 110,
            paddingBottom: 28,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.content, { width: contentWidth }]}>
          <View style={styles.heroBlock}>
            <Text style={styles.kicker}>{currentStep.eyebrow}</Text>
            <Text style={styles.title}>{currentStep.title}</Text>
            <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
          </View>

          <View style={styles.stepCard}>
            {currentStep.choices ? (
              <View style={styles.choiceGrid}>
                {currentStep.choices.map((choice) => {
                  const isActive = currentValue === choice.value;

                  return (
                    <Pressable
                      key={choice.value}
                      style={({ pressed }) => [
                        styles.choiceChip,
                        isActive && styles.choiceChipActive,
                        pressed && styles.choiceChipPressed,
                      ]}
                      onPress={() => updateField(choice.value)}
                    >
                      <Text
                        style={[
                          styles.choiceChipText,
                          isActive && styles.choiceChipTextActive,
                        ]}
                      >
                        {choice.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {currentStep.key === "dob" ? "Date of birth" : "Your answer"}
                </Text>
                <TextInput
                  value={currentValue}
                  onChangeText={updateField}
                  placeholder={currentStep.placeholder}
                  placeholderTextColor="#98A2B3"
                  keyboardType={currentStep.keyboardType ?? "default"}
                  autoCapitalize={
                    currentStep.key === "location" || currentStep.key === "name"
                      ? "words"
                      : "none"
                  }
                  style={styles.input}
                />
              </View>
            )}

            {currentStepError ? (
              <Text style={styles.errorText}>{currentStepError}</Text>
            ) : null}

            {currentStep.helper ? (
              <Text style={styles.helperText}>{currentStep.helper}</Text>
            ) : null}
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewEyebrow}>Why this matters</Text>
            <Text style={styles.previewBody}>
              These fields are the first layer of your dating profile. They help
              with safety, relevance, and matching quality before we even get to
              photos, bio, and music taste.
            </Text>
          </View>

          <View style={styles.footerActions}>
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
                !isStepValid && styles.primaryButtonDisabled,
                pressed && isStepValid && styles.primaryButtonPressed,
              ]}
              onPress={handleNext}
              disabled={!isStepValid}
            >
              <Text style={styles.primaryButtonText}>
                {isLastStep ? "Save and continue" : "Continue"}
              </Text>
            </Pressable>
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
  topPanel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 16,
  },
  topPanelEyebrow: {
    color: "#6EA0F8",
    fontSize: 12,
    textTransform: "uppercase",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 4,
  },
  topPanelTitle: {
    color: "#17181C",
    fontSize: 21,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.3,
  },
  signOutGhost: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E6EB",
  },
  signOutGhostText: {
    color: "#344054",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  ghostPressed: {
    opacity: 0.8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#E8ECF2",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6EA0F8",
    borderRadius: 999,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  content: {
    minHeight: "100%",
  },
  heroBlock: {
    marginBottom: 28,
  },
  kicker: {
    fontSize: 14,
    color: "#6EA0F8",
    textTransform: "uppercase",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 12,
  },
  title: {
    fontSize: 33,
    lineHeight: 40,
    color: "#17181C",
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.8,
    marginBottom: 12,
    maxWidth: 340,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 27,
    color: "#667085",
    fontFamily: "SpaceGrotesk_400Regular",
    maxWidth: 360,
  },
  stepCard: {
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E6EB",
    padding: 18,
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 6,
  },
  inputLabel: {
    color: "#344054",
    fontSize: 14,
    marginBottom: 8,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4E6EB",
    backgroundColor: "#FCFCFD",
    paddingHorizontal: 16,
    color: "#17181C",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  helperText: {
    marginTop: 8,
    color: "#98A2B3",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  errorText: {
    marginTop: 8,
    color: "#D92D20",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  choiceChip: {
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E4E6EB",
    backgroundColor: "#FCFCFD",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  choiceChipActive: {
    backgroundColor: "#17181C",
    borderColor: "#17181C",
  },
  choiceChipPressed: {
    opacity: 0.85,
  },
  choiceChipText: {
    color: "#344054",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  choiceChipTextActive: {
    color: "#FFFFFF",
  },
  previewCard: {
    borderRadius: 24,
    backgroundColor: "#11131A",
    padding: 20,
    marginBottom: 22,
    overflow: "hidden",
  },
  previewEyebrow: {
    color: "#8FB3FF",
    fontSize: 12,
    textTransform: "uppercase",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 10,
  },
  previewBody: {
    color: "#E5E7EB",
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  footerActions: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 8,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
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
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    color: "#17181C",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  primaryButton: {
    flex: 1.35,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#6EA0F8",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold",
  },
});
