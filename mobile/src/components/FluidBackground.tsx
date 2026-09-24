import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Defs, Ellipse, LinearGradient as SvgLinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

// Website-matched: white paper + blush washes (website/src/index.css body background)
type FluidBackgroundVariant = "profile" | "music" | "discover";

export function FluidBackground({ variant = "profile" }: { variant?: FluidBackgroundVariant }) {
  const { width, height } = useWindowDimensions();
  // variant subtly shifts glow positions, like website does per-section
  const shift = variant === "music" ? 0.02 : variant === "discover" ? -0.02 : 0;

  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={styles.svgBackdrop}>
        <Defs>
          <SvgLinearGradient id="paperBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="100%" stopColor="#ffffff" />
          </SvgLinearGradient>
          {/* website blush: linear + 3 radials at 4% 8%, 50% 55%, 96% 92% */}
          <RadialGradient id="blushA" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ff3d5c" stopOpacity={0.09} />
            <Stop offset="65%" stopColor="#ff3d5c" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="blushB" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ff3d5c" stopOpacity={0.06} />
            <Stop offset="70%" stopColor="#ff3d5c" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="blushC" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ff3d5c" stopOpacity={0.085} />
            <Stop offset="65%" stopColor="#ff3d5c" stopOpacity={0} />
          </RadialGradient>
          <SvgLinearGradient id="blushTop" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#ff3d5c" stopOpacity={0.06} />
            <Stop offset="100%" stopColor="#ff3d5c" stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>

        <Rect x="0" y="0" width={width} height={height} fill="url(#paperBase)" />
        {/* top wash */}
        <Rect x="0" y="0" width={width} height={Math.min(1100, height * 0.7)} fill="url(#blushTop)" opacity={0.9} />

        {/* three blush orbs - positions mirror website :root background */}
        <Ellipse cx={width * (0.04 + shift)} cy={height * (0.08 + shift)} rx={width * 0.62} ry={width * 0.62} fill="url(#blushA)" />
        <Ellipse cx={width * (0.5 + shift)} cy={height * (0.55 - shift)} rx={width * 0.72} ry={width * 0.72} fill="url(#blushB)" />
        <Ellipse cx={width * (0.96 - shift)} cy={height * (0.92 - shift)} rx={width * 0.64} ry={width * 0.64} fill="url(#blushC)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFill, overflow: "hidden", backgroundColor: "#ffffff" },
  svgBackdrop: { ...StyleSheet.absoluteFill },
});
