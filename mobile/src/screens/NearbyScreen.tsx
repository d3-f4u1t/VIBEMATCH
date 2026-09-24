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
  if (nearbyCards.length === 0) {
    return (
      <View style={styles.sectionBody}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No nearby vibes yet</Text>
          <Text style={styles.emptyBody}>
            Nearby is a preview of your discover stack for now — no GPS yet.
            Swipe in Feed and matches will show up here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionBody}>
      <View style={styles.feedStageCard}>
        <View style={styles.mapCard}>
          <View style={styles.mapLineOne} />
          <View style={styles.mapLineTwo} />
          <View style={styles.mapMarkerOne} />
          <View style={styles.mapMarkerTwo} />
          <Text style={styles.mapPlaceholder}>Preview — GPS coming soon</Text>
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
                  {Math.round(match.similarity * 100)}% match
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.contextCard}>
          <Text style={styles.contextCardTitle}>Why these people?</Text>
          <Text style={styles.contextCardBody}>
            Same list as your discover feed, ranked by music similarity.
            Distances are placeholders until location is enabled.
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
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(11,11,12,0.12)",
  },
  emptyTitle: {
    color: "#0b0b0c",
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  emptyBody: {
    color: "rgba(11,11,12,0.66)",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  feedStageCard: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(11,11,12,0.12)",
    gap: 24,
  },
  mapCard: {
    height: 180,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(11,11,12,0.12)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  mapLineOne: {
    position: "absolute",
    width: "140%",
    height: 1,
    backgroundColor: "rgba(11,11,12,0.12)",
    transform: [{ rotate: "35deg" }],
  },
  mapLineTwo: {
    position: "absolute",
    width: "140%",
    height: 1,
    backgroundColor: "#ffffff",
    transform: [{ rotate: "-25deg" }],
  },
  mapMarkerOne: {
    position: "absolute",
    top: 40,
    left: 60,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#f9eff2",
    shadowColor: "rgba(11,11,12,0.14)",
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
    backgroundColor: "#ff3d5c",
    shadowColor: "#ff3d5c",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  mapPlaceholder: {
    color: "rgba(11,11,12,0.52)",
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
    borderColor: "rgba(11,11,12,0.12)",
  },
  nearbyMiniName: {
    color: "#0b0b0c",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold",
    marginTop: 4,
  },
  nearbyMiniDistance: {
    color: "rgba(11,11,12,0.52)",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  contextCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(11,11,12,0.12)",
  },
  contextCardTitle: {
    color: "#0b0b0c",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  contextCardBody: {
    color: "rgba(11,11,12,0.66)",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_400Regular",
  },
});
