// main app file
// & "C:\Program Files\nodejs\npm.cmd" run start
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function App() {
  const [activeTab, setActiveTab] = useState<"setup" | "matches" | "swipe">(
    "setup"
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>VibeMatch</Text>
        <Text style={styles.title}>Music first. Everything else follows.</Text>
        <Text style={styles.subtitle}>
          TEST VERSION
        </Text>
      </View>

      <View style={styles.tabRow}>
        <TabButton
          label="Setup"
          isActive={activeTab === "setup"}
          onPress={() => setActiveTab("setup")}
        />
        <TabButton
          label="Matches"
          isActive={activeTab === "matches"}
          onPress={() => setActiveTab("matches")}
        />
        <TabButton
          label="Swipe"
          isActive={activeTab === "swipe"}
          onPress={() => setActiveTab("swipe")}
        />
      </View>

      <View style={styles.panel}>
        {activeTab === "setup" ? (
          <>
            <Text style={styles.panelTitle}>Setup</Text>
            <Text style={styles.panelBody}>
              This screen will become artist and song onboarding.
            </Text>
          </>
        ) : null}

        {activeTab === "matches" ? (
          <>
            <Text style={styles.panelTitle}>Matches</Text>
            <Text style={styles.panelBody}>
              This screen will show music-based match cards from the backend.
            </Text>
          </>
        ) : null}

        {activeTab === "swipe" ? (
          <>
            <Text style={styles.panelTitle}>Swipe</Text>
            <Text style={styles.panelBody}>
              This screen will become the actual swipe deck and mutual match area.
            </Text>
          </>
        ) : null}
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

type TabButtonProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
};

function TabButton({ label, isActive, onPress }: TabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
    >
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7e7cf",
    padding: 20,
  },
  header: {
    marginTop: 24,
    gap: 8,
  },
  eyebrow: {
    color: "#a85d3f",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: "#1e1916",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
  },
  subtitle: {
    color: "#5d4639",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900'
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 28,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#e3d6c4",
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#201915",
  },
  tabText: {
    color: "#201915",
    fontSize: 15,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#fff8f1",
  },
  panel: {
    marginTop: 18,
    backgroundColor: "#fff9f3",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4c4af",
    padding: 20,
    minHeight: 240,
    justifyContent: "center",
  },
  panelTitle: {
    color: "#201915",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 10,
  },
  panelBody: {
    color: "#5d4639",
    fontSize: 17,
    lineHeight: 26,
  },
});
