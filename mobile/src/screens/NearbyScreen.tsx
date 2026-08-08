import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { MatchResult } from "../lib/matching";

type NearbyScreenProps = {
  nearbyCards: MatchResult[];
  onOpenDetail: (match: MatchResult) => void;
};

const NEARBY_DISTANCES = ["1.4 km", "2.1 km", "3.8 km", "5.2 km", "7.0 km", "12 km"];

const useMatchTone = (index: number) => {
  const tones = [
    { start: "#FF7B59", end: "#F26A8D" },
    { start: "#82F7A6", end: "#2D9CDB" },
    { start: "#BFD6F3", end: "#7B9BC7" },
    { start: "#FFD166", end: "#FF7B59" },
    { start: "#9B51E0", end: "#F26A8D" },
  ];
  return tones[index % tones.length];
};

export function NearbyScreen({ nearbyCards, onOpenDetail }: NearbyScreenProps) {
  return (
    <View style={styles.sectionBody}>
      <View style={styles.feedStageCard}>
        <View style={styles.mapCard}>
          <View style={styles.mapLineOne} />
          <View style={styles.mapLineTwo} />
          <View style={styles.mapMarkerOne} />
          <View style={styles.mapMarkerTwo} />
          <Text style={styles.mapPlaceholder}>Map layer</Text>
        </View>

        <View style={styles.nearbyCardsRow}>
          {nearbyCards.map((match, index) => {
            const tone = useMatchTone(index);

            return (
              <Pressable
                key={match.userId}
                style={styles.nearbyMiniCardWrap}
                onPress={() => onOpenDetail(match)}
              >
                <LinearGradient
                  colors={[tone.start, tone.end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.nearbyMiniCard}
                />
                <Text style={styles.nearbyMiniName}>{match.name.split(" ")[0]}</Text>
                <Text style={styles.nearbyMiniDistance}>
                  {NEARBY_DISTANCES[index] ?? "1.4 km"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.contextCard}>
          <Text style={styles.contextCardTitle}>Why these people?</Text>
          <Text style={styles.contextCardBody}>
            Shared late-night artists, city overlap, and matching listening pace
            keep these profiles near the top of your discover stack.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  feedStageCard: {
    backgroundColor: "rgba(8,8,11,0.48)",
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 24,
  },
  mapCard: {
    height: 180,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  mapLineOne: {
    position: "absolute",
    width: "140%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    transform: [{ rotate: "35deg" }],
  },
  mapLineTwo: {
    position: "absolute",
    width: "140%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    transform: [{ rotate: "-25deg" }],
  },
  mapMarkerOne: {
    position: "absolute",
    top: 40,
    left: 60,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#82F7A6",
    shadowColor: "#82F7A6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  mapMarkerTwo: {
    position: "absolute",
    bottom: 50,
    right: 80,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F26A8D",
    shadowColor: "#F26A8D",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  mapPlaceholder: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_700Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  nearbyCardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  nearbyMiniCardWrap: {
    width: "48%",
    gap: 6,
    marginBottom: 8,
  },
  nearbyMiniCard: {
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  nearbyMiniName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold",
    marginTop: 4,
  },
  nearbyMiniDistance: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  contextCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  contextCardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  contextCardBody: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_400Regular",
  },
});
