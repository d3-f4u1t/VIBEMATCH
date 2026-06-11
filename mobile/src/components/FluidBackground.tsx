import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, {
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

type FluidBackgroundVariant = "profile" | "music" | "discover";

type GlowConfig = {
  pinkCx: number;
  pinkCy: number;
  pinkRx: number;
  coralCx: number;
  coralCy: number;
  coralRx: number;
  plumCx: number;
  plumCy: number;
  plumRx: number;
  hazeCx: number;
  hazeCy: number;
  hazeRx: number;
  hazeRy: number;
  mistCx: number;
  mistCy: number;
  mistRx: number;
  mistRy: number;
};

const GLOW_VARIANTS: Record<FluidBackgroundVariant, GlowConfig> = {
  profile: {
    pinkCx: 0.16,
    pinkCy: 0.18,
    pinkRx: 0.42,
    coralCx: 0.86,
    coralCy: 0.14,
    coralRx: 0.25,
    plumCx: 0.78,
    plumCy: 0.83,
    plumRx: 0.21,
    hazeCx: 0.5,
    hazeCy: 0.36,
    hazeRx: 0.62,
    hazeRy: 0.2,
    mistCx: 0.48,
    mistCy: 0.2,
    mistRx: 0.76,
    mistRy: 0.16,
  },
  music: {
    pinkCx: 0.2,
    pinkCy: 0.12,
    pinkRx: 0.38,
    coralCx: 0.82,
    coralCy: 0.2,
    coralRx: 0.28,
    plumCx: 0.68,
    plumCy: 0.76,
    plumRx: 0.24,
    hazeCx: 0.52,
    hazeCy: 0.34,
    hazeRx: 0.66,
    hazeRy: 0.22,
    mistCx: 0.52,
    mistCy: 0.18,
    mistRx: 0.78,
    mistRy: 0.17,
  },
  discover: {
    pinkCx: 0.14,
    pinkCy: 0.16,
    pinkRx: 0.4,
    coralCx: 0.88,
    coralCy: 0.12,
    coralRx: 0.24,
    plumCx: 0.8,
    plumCy: 0.76,
    plumRx: 0.25,
    hazeCx: 0.54,
    hazeCy: 0.3,
    hazeRx: 0.68,
    hazeRy: 0.22,
    mistCx: 0.5,
    mistCy: 0.18,
    mistRx: 0.8,
    mistRy: 0.16,
  },
};

type FluidBackgroundProps = {
  variant?: FluidBackgroundVariant;
};

export function FluidBackground({
  variant = "profile",
}: FluidBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const glow = GLOW_VARIANTS[variant];

  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={styles.svgBackdrop}
      >
        <Defs>
          <SvgLinearGradient id="sharedBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#24111F" />
            <Stop offset="48%" stopColor="#130B15" />
            <Stop offset="100%" stopColor="#09070D" />
          </SvgLinearGradient>

          <RadialGradient id="sharedPinkGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FF4D94" stopOpacity="0.72" />
            <Stop offset="52%" stopColor="#FF4D94" stopOpacity="0.34" />
            <Stop offset="100%" stopColor="#FF4F88" stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="sharedCoralGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FF7B4F" stopOpacity="0.5" />
            <Stop offset="58%" stopColor="#FF7B4F" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#FF7A59" stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="sharedPlumGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FF4D94" stopOpacity="0.3" />
            <Stop offset="60%" stopColor="#FF4D94" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#FF4F88" stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="sharedWhiteHaze" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.028" />
            <Stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.008" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="sharedTopMist" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.036" />
            <Stop offset="62%" stopColor="#FFFFFF" stopOpacity="0.01" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width={width} height={height} fill="url(#sharedBase)" />

        <Ellipse
          cx={width * glow.pinkCx}
          cy={height * glow.pinkCy}
          rx={width * glow.pinkRx}
          ry={width * glow.pinkRx}
          fill="url(#sharedPinkGlow)"
        />
        <Ellipse
          cx={width * glow.coralCx}
          cy={height * glow.coralCy}
          rx={width * glow.coralRx}
          ry={width * glow.coralRx}
          fill="url(#sharedCoralGlow)"
        />
        <Ellipse
          cx={width * glow.plumCx}
          cy={height * glow.plumCy}
          rx={width * glow.plumRx}
          ry={width * glow.plumRx}
          fill="url(#sharedPlumGlow)"
        />
        <Ellipse
          cx={width * glow.hazeCx}
          cy={height * glow.hazeCy}
          rx={width * glow.hazeRx}
          ry={height * glow.hazeRy}
          fill="url(#sharedWhiteHaze)"
        />
        <Ellipse
          cx={width * glow.mistCx}
          cy={height * glow.mistCy}
          rx={width * glow.mistRx}
          ry={height * glow.mistRy}
          fill="url(#sharedTopMist)"
        />
      </Svg>

      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  svgBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,1,5,0.12)",
  },
});
