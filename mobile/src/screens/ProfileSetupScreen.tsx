import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

import { getUserProfile, updateUserProfile } from "../lib/profile";
import type {
  TokenResponse,
  UserHabits,
  UserProfileResponse,
} from "../types/auth";

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
  | "location"
  | "bio"
  | "height"
  | "weight"
  | "ethnicity"
  | "z_sign"
  | "f_plan"
  | "pets"
  | "religion"
  | "smoking"
  | "drinking"
  | "weed"
  | "age_min"
  | "age_max"
  | "intent"
  | "max_distance_km"
  | "dealbreakers";

type ProfileState = {
  name: string;
  dob: string;
  gender: string;
  sexuality: string;
  pronouns: string;
  location: string;
  bio: string;
  height: string;
  weight: string;
  ethnicity: string;
  z_sign: string;
  f_plan: string;
  pets: string;
  religion: string;
  habit: UserHabits;
  age_min: string;
  age_max: string;
  intent: string;
  max_distance_km: string;
  dealbreakers: string[];
};

type Choice = {
  label: string;
  value: string;
};

type FieldConfig = {
  key: ProfileStepKey;
  label: string;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  choices?: Choice[];
  multiline?: boolean;
  multiSelect?: boolean;
};

type StepConfig = {
  eyebrow: string;
  title: string;
  fields: FieldConfig[];
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

const FAMILY_PLAN_CHOICES: Choice[] = [
  { label: "Want kids", value: "want_kids" },
  { label: "Open to kids", value: "open_to_kids" },
  { label: "Don't want kids", value: "dont_want_kids" },
  { label: "Not sure yet", value: "not_sure_yet" },
];

const PET_CHOICES: Choice[] = [
  { label: "Dog person", value: "dog_person" },
  { label: "Cat person", value: "cat_person" },
  { label: "Love all pets", value: "love_all_pets" },
  { label: "No pets", value: "no_pets" },
];

const HABIT_CHOICES: Choice[] = [
  { label: "Never", value: "never" },
  { label: "Sometimes", value: "sometimes" },
  { label: "Socially", value: "socially" },
  { label: "Regularly", value: "regularly" },
];
//just for updated
const ETH_CHOICES: Choice[] = [
  {label: "Asian", value: "asian"},
  {label: "African", value: "african"},
  {label: "European", value: "european"},
  {label: "Hispanic", value: "hispanic"},
];

const Z_Sig: Choice[] = [
  {label: "Aquarius", value: "aquarius"},
  {label: "Pisces", value: "pisces"},
  {label: "Aries", value: "aries"},
  {label: "Taurus", value: "taurus"},
  {label: "Gemini", value: "gemini"},
  {label: "Cancer", value: "cancer"},
  {label: "Leo", value: "leo"},
  {label: "Virgo", value: "virgo"},
  {label: "Libra", value: "libra"},
  {label: "Scorpio", value: "scorpio"},
  {label: "Sagittarius", value: "sagittarius"},
  {label: "Capricorn", value: "capricorn"},

];

const R_CHOICES: Choice[] = [
  {label: "Christian", value: "christian"},
  {label: "Islam", value: "islam"},
  {label: "Hindu", value: "hindu"},
  {label: "Buddhism", value:"buddhism"},
  {label: "Sikh", value: "sikh"},
  {label: "Jewish", value: "jewish"},
  {label: "Jain", value:"jain"},
];

const INTENT_CHOICES: Choice[] = [
  { label: "Short-term fun", value: "short_term" },
  { label: "Long-term", value: "long_term" },
  { label: "Friendship", value: "friendship" },
  { label: "Open to anything", value: "open" },
];

const DEALBREAKER_CHOICES: Choice[] = [
  { label: "Smoking", value: "smoking" },
  { label: "Drinking", value: "drinking" },
  { label: "Weed", value: "weed" },
];

const PROFILE_STEPS: StepConfig[] = [
  {
    eyebrow: "Core profile · 1 of 7",
    title: "The basics",
    fields: [
      { key: "name", label: "What should people call you?", placeholder: "Your first name" },
      { key: "dob", label: "When's your birthday?", placeholder: "DD / MM / YYYY", keyboardType: "numeric" },
    ],
  },
  {
    eyebrow: "Identity · 2 of 7",
    title: "How do you identify?",
    fields: [
      { key: "gender", label: "Gender", choices: GENDER_CHOICES },
      { key: "sexuality", label: "Sexuality", choices: SEXUALITY_CHOICES },
      { key: "pronouns", label: "Pronouns", choices: PRONOUN_CHOICES },
    ],
  },
  {
    eyebrow: "Story · 3 of 7",
    title: "Where + who you are",
    fields: [
      { key: "location", label: "Where are you dating from?", placeholder: "City or area" },
      { key: "bio", label: "Short bio people can feel", placeholder: "Give your profile a little personality", multiline: true },
    ],
  },
  {
    eyebrow: "Details · 4 of 7",
    title: "The details",
    fields: [
      { key: "height", label: "Height", placeholder: `5'10" or 178 cm` },
      { key: "weight", label: "Weight", placeholder: "e.g., 70 kg" },
      { key: "ethnicity", label: "Ethnicity", choices: ETH_CHOICES },
      { key: "z_sign", label: "Zodiac", choices: Z_Sig },
    ],
  },
  {
    eyebrow: "Life · 5 of 7",
    title: "Life and values",
    fields: [
      { key: "f_plan", label: "Family plans", choices: FAMILY_PLAN_CHOICES },
      { key: "pets", label: "Pet vibe", choices: PET_CHOICES },
      { key: "religion", label: "Beliefs", choices: R_CHOICES },
    ],
  },
  {
    eyebrow: "Habits · 6 of 7",
    title: "Lifestyle habits",
    fields: [
      { key: "smoking", label: "Smoking", choices: HABIT_CHOICES },
      { key: "drinking", label: "Drinking", choices: HABIT_CHOICES },
      { key: "weed", label: "Weed", choices: HABIT_CHOICES },
    ],
  },
  {
    eyebrow: "Preferences · 7 of 7",
    title: "Who do you want to meet?",
    fields: [
      { key: "age_min", label: "Min age", placeholder: "e.g., 20", keyboardType: "numeric" },
      { key: "age_max", label: "Max age", placeholder: "e.g., 30", keyboardType: "numeric" },
      { key: "intent", label: "Looking for", choices: INTENT_CHOICES },
      { key: "max_distance_km", label: "Max distance km (optional)", placeholder: "e.g., 50", keyboardType: "numeric" },
      { key: "dealbreakers", label: "Dealbreakers (tap all that apply)", choices: DEALBREAKER_CHOICES, multiSelect: true },
    ],
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
    bio: session.user.bio ?? "",
    height: "",
    weight: "",
    ethnicity: "",
    z_sign: "",
    f_plan: "",
    pets: "",
    religion: "",
    habit: {
      smoking: "",
      drinking: "",
      weed: "",
    },
    age_min: "",
    age_max: "",
    intent: "",
    max_distance_km: "",
    dealbreakers: [],
  });
  const [screenError, setScreenError] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingStep, setIsSavingStep] = useState(false);
  const stepMotion = useRef(new Animated.Value(1)).current;

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
          bio: data.bio ?? "",
          height: data.height ?? "",
          weight: data.weight ?? "",
          ethnicity: data.ethnicity ?? "",
          z_sign: data.z_sign ?? "",
          f_plan: data.f_plan ?? "",
          pets: data.pets ?? "",
          religion: data.religion ?? "",
          habit: {
            smoking: data.habit?.smoking ?? "",
            drinking: data.habit?.drinking ?? "",
            weed: data.habit?.weed ?? "",
          },
          age_min: data.age_min != null ? String(data.age_min) : "",
          age_max: data.age_max != null ? String(data.age_max) : "",
          intent: (data as unknown as { intent?: string }).intent ?? "",
          max_distance_km: (data as unknown as { max_distance_km?: number }).max_distance_km != null
            ? String((data as unknown as { max_distance_km?: number }).max_distance_km)
            : "",
          dealbreakers: ((data as unknown as { dealbreakers?: string[] }).dealbreakers ?? []) as string[],
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

  useEffect(() => {
    stepMotion.setValue(0);

    Animated.timing(stepMotion, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isLoadingProfile, stepIndex, stepMotion]);

  if (!fontsLoaded) {
    return null;
  }

  const currentStep = PROFILE_STEPS[stepIndex];
  const progress = (stepIndex + 1) / PROFILE_STEPS.length;
  const progressPercent = Math.round(progress * 100);
  const isLastStep = stepIndex === PROFILE_STEPS.length - 1;

  const getFieldValue = (stepKey: ProfileStepKey): string | string[] => {
    switch (stepKey) {
      case "smoking":
        return profile.habit.smoking ?? "";
      case "drinking":
        return profile.habit.drinking ?? "";
      case "weed":
        return profile.habit.weed ?? "";
      case "dealbreakers":
        return profile.dealbreakers;
      default:
        return (profile as unknown as Record<string, string>)[stepKey] ?? "";
    }
  };

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

  const updateFieldValue = (stepKey: ProfileStepKey, value: string) => {
    const nextValue = stepKey === "dob" ? formatDobInput(value) : value;

    setProfile((current) => {
      if (stepKey === "smoking" || stepKey === "drinking" || stepKey === "weed") {
        return {
          ...current,
          habit: {
            ...current.habit,
            [stepKey]: nextValue,
          },
        };
      }

      return {
        ...current,
        [stepKey]: nextValue,
      };
    });
  };

  const toggleDealbreaker = (value: string) => {
    setProfile((current) => ({
      ...current,
      dealbreakers: current.dealbreakers.includes(value)
        ? current.dealbreakers.filter((d) => d !== value)
        : [...current.dealbreakers, value],
    }));
  };
  const stepAnimatedStyle = {
    opacity: stepMotion,
    transform: [
      {
        translateX: stepMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
      {
        translateY: stepMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

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

  const currentStepError = (() => {
    if (currentStep.fields.some((f) => f.key === "dob")) {
      return getDobValidationMessage(String(getFieldValue("dob") ?? ""));
    }
    return "";
  })();

  const isFieldValid = (key: ProfileStepKey): boolean => {
    if (key === "dob") return !getDobValidationMessage(String(getFieldValue("dob") ?? ""));
    if (key === "dealbreakers") return true; // optional multi-select
    if (key === "max_distance_km") return true; // optional
    const v = getFieldValue(key);
    if (Array.isArray(v)) return true;
    return typeof v === "string" && v.trim().length > 0;
  };

  const isStepValid =
    currentStep.fields.every((f) => isFieldValid(f.key)) && !currentStepError;

  const buildProfilePayloadForCurrentStep = () => {
    const payload: Record<string, unknown> = {};
    for (const f of currentStep.fields) {
      switch (f.key) {
        case "name":
          payload.name = profile.name.trim();
          break;
        case "dob":
          payload.date_of_birth = formatDobForApi(profile.dob);
          break;
        case "gender":
          payload.gender = profile.gender;
          break;
        case "sexuality":
          payload.sexuality = profile.sexuality;
          break;
        case "pronouns":
          payload.pronouns = profile.pronouns;
          break;
        case "location":
          payload.location_city = profile.location.trim();
          break;
        case "bio":
          payload.bio = profile.bio.trim();
          break;
        case "height":
          payload.height = profile.height.trim();
          break;
        case "weight":
          payload.weight = profile.weight.trim();
          break;
        case "ethnicity":
          payload.ethnicity = profile.ethnicity.trim();
          break;
        case "z_sign":
          payload.z_sign = profile.z_sign.trim();
          break;
        case "f_plan":
          payload.f_plan = profile.f_plan;
          break;
        case "pets":
          payload.pets = profile.pets;
          break;
        case "religion":
          payload.religion = profile.religion.trim();
          break;
        case "smoking":
        case "drinking":
        case "weed":
          payload.habit = {
            smoking: profile.habit.smoking || null,
            drinking: profile.habit.drinking || null,
            weed: profile.habit.weed || null,
          };
          break;
        case "age_min":
          payload.age_min = profile.age_min.trim() ? Number(profile.age_min) : null;
          break;
        case "age_max":
          payload.age_max = profile.age_max.trim() ? Number(profile.age_max) : null;
          break;
        case "intent":
          payload.intent = profile.intent || null;
          break;
        case "max_distance_km":
          payload.max_distance_km = profile.max_distance_km.trim() ? Number(profile.max_distance_km) : null;
          break;
        case "dealbreakers":
          payload.dealbreakers = profile.dealbreakers;
          break;
      }
    }
    // age sanity: client-side clamp, server re-validates
    if (payload.age_min != null && payload.age_max != null && (payload.age_max as number) < (payload.age_min as number)) {
      payload.age_max = payload.age_min;
    }
    return payload;
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
      bio: data.bio ?? current.bio,
      height: data.height ?? current.height,
      weight: data.weight ?? current.weight,
      ethnicity: data.ethnicity ?? current.ethnicity,
      z_sign: data.z_sign ?? current.z_sign,
      f_plan: data.f_plan ?? current.f_plan,
      pets: data.pets ?? current.pets,
      religion: data.religion ?? current.religion,
      habit: {
        smoking: data.habit?.smoking ?? current.habit.smoking,
        drinking: data.habit?.drinking ?? current.habit.drinking,
        weed: data.habit?.weed ?? current.habit.weed,
      },
      age_min: (data as unknown as { age_min?: number }).age_min != null ? String((data as unknown as { age_min?: number }).age_min) : current.age_min,
      age_max: (data as unknown as { age_max?: number }).age_max != null ? String((data as unknown as { age_max?: number }).age_max) : current.age_max,
      intent: (data as unknown as { intent?: string }).intent ?? current.intent,
      max_distance_km: (data as unknown as { max_distance_km?: number }).max_distance_km != null ? String((data as unknown as { max_distance_km?: number }).max_distance_km) : current.max_distance_km,
      dealbreakers: ((data as unknown as { dealbreakers?: string[] }).dealbreakers ?? current.dealbreakers) as string[],
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

          <Animated.View style={stepAnimatedStyle}>
            {isLoadingProfile ? (
              <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#82F7A6" />
              <Text style={styles.loadingText}>Loading your profile...</Text>
              </View>
            ) : (
              <View style={styles.questionCard}>
              <Text style={styles.kicker}>Matching signal</Text>
              <Text style={styles.title}>{currentStep.title}</Text>

              {currentStep.fields.map((field) => {
                const val = getFieldValue(field.key);
                if (field.choices) {
                  const isMulti = !!field.multiSelect;
                  return (
                    <View key={field.key} style={{ marginTop: 16 }}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      <View style={styles.choiceGrid}>
                        {field.choices.map((choice) => {
                          const isActive = isMulti
                            ? (val as string[]).includes(choice.value)
                            : val === choice.value;
                          return (
                            <Pressable
                              key={choice.value}
                              style={({ pressed }) => [
                                styles.choiceTile,
                                isActive && styles.choiceTileActive,
                                pressed && styles.choiceTilePressed,
                              ]}
                              onPress={() => {
                                if (isMulti) toggleDealbreaker(choice.value);
                                else updateFieldValue(field.key, choice.value);
                              }}
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
                    </View>
                  );
                }
                return (
                  <View key={field.key} style={styles.inputBlock}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <TextInput
                      value={String(val ?? "")}
                      onChangeText={(t) => updateFieldValue(field.key, t)}
                      placeholder={field.placeholder}
                      placeholderTextColor="#9D97A5"
                      keyboardType={field.keyboardType ?? "default"}
                      multiline={field.multiline}
                      autoCapitalize={
                        field.key === "location" ||
                        field.key === "name" ||
                        field.key === "ethnicity" ||
                        field.key === "religion"
                          ? "words"
                          : "none"
                      }
                      autoCorrect={false}
                      textAlignVertical={field.multiline ? "top" : "center"}
                      style={[
                        styles.input,
                        field.multiline && styles.inputMultiline,
                      ]}
                    />
                  </View>
                );
              })}

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
          </Animated.View>

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
  fieldLabel: {
    fontSize: 13,
    color: "rgba(255,248,251,0.85)",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
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
  inputMultiline: {
    minHeight: 120,
    height: 120,
    paddingTop: 16,
    paddingBottom: 16,
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
