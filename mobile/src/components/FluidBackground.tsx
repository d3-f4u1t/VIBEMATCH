import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function FluidBackground() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <LinearGradient
        colors={["#0D0A12", "#1F1220", "#130D15", "#0D0A11"]}
        locations={[0, 0.28, 0.68, 1]}
        style={styles.gradient}
      />
      <View style={[styles.blob, styles.blobOne]} />
      <View style={[styles.blob, styles.blobTwo]} />
      <View style={[styles.blob, styles.blobThree]} />
      <View style={styles.blurPatchOne} />
      <View style={styles.blurPatchTwo} />
      <View style={styles.blurPatchThree} />
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: "absolute",
    borderRadius: 9999,
  },
  blobOne: {
    top: -28,
    left: -92,
    width: 280,
    height: 220,
    backgroundColor: "rgba(255,79,136,0.28)",
  },
  blobTwo: {
    top: 18,
    right: -34,
    width: 190,
    height: 160,
    backgroundColor: "rgba(255,122,89,0.20)",
  },
  blobThree: {
    bottom: 92,
    right: 12,
    width: 150,
    height: 150,
    backgroundColor: "rgba(255,79,136,0.14)",
  },
  blurPatchOne: {
    position: "absolute",
    top: 54,
    left: 42,
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: "rgba(255,255,255,0.03)",
    opacity: 0.34,
  },
  blurPatchTwo: {
    position: "absolute",
    top: 68,
    right: 38,
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "rgba(255,255,255,0.025)",
    opacity: 0.28,
  },
  blurPatchThree: {
    position: "absolute",
    bottom: 126,
    right: 44,
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "rgba(255,255,255,0.02)",
    opacity: 0.2,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 5, 9, 0.16)",
  },
});
