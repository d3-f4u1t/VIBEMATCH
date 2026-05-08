import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export function AuthScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>VibeMatch</Text>
        <Text style={styles.title}>Music first. Everything else follows.</Text>
        <Text style={styles.subtitle}>
          Start with your account, then we build the rest of the app.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Log in</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#6a5143"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#6a5143"
          style={styles.input}
          secureTextEntry
        />

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    marginBottom: 28,
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
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#fff9f3",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4c4af",
    padding: 20,
    gap: 14,
  },
  sectionTitle: {
    color: "#201915",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#f7efe4",
    borderWidth: 1,
    borderColor: "#d4c4af",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#201915",
    fontSize: 15,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#201915",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff8f1",
    fontSize: 16,
    fontWeight: "800",
  },
});
