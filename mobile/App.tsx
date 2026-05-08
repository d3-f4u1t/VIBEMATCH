// main app file
//  & "C:\Program Files\nodejs\npm.cmd" run start
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";

import { AuthScreen } from "./src/screens/AuthScreen";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <AuthScreen />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7e7cf",
  },
});
