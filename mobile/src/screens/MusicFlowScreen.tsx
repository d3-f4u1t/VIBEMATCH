import { useEffect, useRef, useState } from "react";
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

import {
  addArtistToUser,
  getUserArtists,
  removeArtistFromUser,
  searchArtists,
  type ArtistSearchResult,
} from "../lib/artists";
import {
  addTrackToUser,
  getUserTracks,
  removeTrackFromUser,
  searchTracks,
  type TrackSearchResult,
} from "../lib/tracks";
import type { TokenResponse } from "../types/auth";

type MusicSetupScreenProps = {
  session: TokenResponse;
  onSignOut: () => void;
  onComplete: () => void;
};

type Artist = ArtistSearchResult;
type Track = TrackSearchResult;
type MusicStep = "artists" | "tracks";

const SUGGESTED_ARTISTS: Artist[] = [
  {
    id: "sza",
    name: "SZA",
    meta: "r&b · alt soul · mood",
    gradientStart: "rgba(255,79,136,0.86)",
    gradientEnd: "rgba(255,122,89,0.76)",
  },
  {
    id: "frank-ocean",
    name: "Frank Ocean",
    meta: "late night · introspective",
    gradientStart: "rgba(130,247,166,0.86)",
    gradientEnd: "rgba(255,79,136,0.72)",
  },
  {
    id: "fka-twigs",
    name: "FKA twigs",
    meta: "art pop · left field · intensity",
    gradientStart: "rgba(126,95,255,0.82)",
    gradientEnd: "rgba(255,122,89,0.72)",
  },
  {
    id: "the-weeknd",
    name: "The Weeknd",
    meta: "night drive · dark pop · sleek",
    gradientStart: "rgba(255,122,89,0.80)",
    gradientEnd: "rgba(255,79,136,0.76)",
  },
];

export function MusicSetupScreen({
  session,
  onSignOut: _onSignOut,
  onComplete,
}: MusicSetupScreenProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 430);
  const topInset =
    Platform.OS === "android" ? (NativeStatusBar.currentHeight ?? 0) + 18 : 18;
  const artistInputRef = useRef<TextInput | null>(null);
  const trackInputRef = useRef<TextInput | null>(null);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  const [step, setStep] = useState<MusicStep>("artists");
  const [artistSearch, setArtistSearch] = useState("");
  const [trackSearch, setTrackSearch] = useState("");
  const [trackResultLimit, setTrackResultLimit] = useState(4);
  const [remoteArtists, setRemoteArtists] = useState<Artist[]>([]);
  const [remoteTracks, setRemoteTracks] = useState<Track[]>([]);
  const [artistSearchLoading, setArtistSearchLoading] = useState(false);
  const [trackSearchLoading, setTrackSearchLoading] = useState(false);
  const [artistSearchError, setArtistSearchError] = useState("");
  const [trackSearchError, setTrackSearchError] = useState("");
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
  const [selectedArtistsLoading, setSelectedArtistsLoading] = useState(true);
  const [selectedTracksLoading, setSelectedTracksLoading] = useState(true);
  const [artistSaveError, setArtistSaveError] = useState("");
  const [trackSaveError, setTrackSaveError] = useState("");
  const [mutatingArtistId, setMutatingArtistId] = useState<string | null>(null);
  const [mutatingTrackId, setMutatingTrackId] = useState<string | null>(null);

  useEffect(() => {
    const trimmedSearch = artistSearch.trim();

    if (trimmedSearch.length < 2) {
      setRemoteArtists([]);
      setArtistSearchLoading(false);
      setArtistSearchError("");
      return;
    }

    let isCancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        setArtistSearchLoading(true);
        setArtistSearchError("");
        const artists = await searchArtists(trimmedSearch);

        if (!isCancelled) {
          setRemoteArtists(artists);
        }
      } catch (error) {
        if (!isCancelled) {
          setRemoteArtists([]);
          setArtistSearchError(
            error instanceof Error ? error.message : "Artist search failed."
          );
        }
      } finally {
        if (!isCancelled) {
          setArtistSearchLoading(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [artistSearch]);

  useEffect(() => {
    const trimmedTrackSearch = trackSearch.trim();

    if (trimmedTrackSearch.length < 2) {
      setRemoteTracks([]);
      setTrackSearchLoading(false);
      setTrackSearchError("");
      return;
    }

    let isCancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        setTrackSearchLoading(true);
        setTrackSearchError("");
        const tracks = await searchTracks(
          session.user.id,
          trimmedTrackSearch,
          trackResultLimit
        );

        if (!isCancelled) {
          setRemoteTracks(tracks);
        }
      } catch (error) {
        if (!isCancelled) {
          setRemoteTracks([]);
          setTrackSearchError(
            error instanceof Error ? error.message : "Song search failed."
          );
        }
      } finally {
        if (!isCancelled) {
          setTrackSearchLoading(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [session.user.id, trackResultLimit, trackSearch]);

  useEffect(() => {
    setTrackResultLimit(4);
  }, [trackSearch]);

  useEffect(() => {
    let isCancelled = false;

    const loadSelectedArtists = async () => {
      try {
        setSelectedArtistsLoading(true);
        setArtistSaveError("");
        const artists = await getUserArtists(
          session.user.id,
          session.access_token
        );

        if (!isCancelled) {
          setSelectedArtists(artists);
        }
      } catch (error) {
        if (!isCancelled) {
          setArtistSaveError(
            error instanceof Error ? error.message : "Could not load saved artists."
          );
        }
      } finally {
        if (!isCancelled) {
          setSelectedArtistsLoading(false);
        }
      }
    };

    loadSelectedArtists();

    return () => {
      isCancelled = true;
    };
  }, [session.access_token, session.user.id]);

  useEffect(() => {
    let isCancelled = false;

    const loadSelectedTracks = async () => {
      try {
        setSelectedTracksLoading(true);
        setTrackSaveError("");
        const tracks = await getUserTracks(session.user.id, session.access_token);

        if (!isCancelled) {
          setSelectedTracks(tracks);
        }
      } catch (error) {
        if (!isCancelled) {
          setTrackSaveError(
            error instanceof Error ? error.message : "Could not load saved songs."
          );
        }
      } finally {
        if (!isCancelled) {
          setSelectedTracksLoading(false);
        }
      }
    };

    loadSelectedTracks();

    return () => {
      isCancelled = true;
    };
  }, [session.access_token, session.user.id]);

  if (!fontsLoaded) {
    return null;
  }

  const baseArtists =
    artistSearch.trim().length >= 2 ? remoteArtists : SUGGESTED_ARTISTS;

  const filteredArtists = baseArtists.filter((artist) => {
    const matchesSearch =
      artistSearch.trim().length === 0 ||
      artist.name.toLowerCase().includes(artistSearch.trim().toLowerCase()) ||
      artist.meta.toLowerCase().includes(artistSearch.trim().toLowerCase());

    const alreadySelected = selectedArtists.some(
      (selectedArtist) => selectedArtist.id === artist.id
    );

    return matchesSearch && !alreadySelected;
  });

  const filteredTracks = remoteTracks.filter((track) => {
    const alreadySelected = selectedTracks.some(
      (selectedTrack) => selectedTrack.id === track.id
    );

    return !alreadySelected;
  });

  const canLoadMoreTracks =
    trackSearch.trim().length >= 2 &&
    !trackSearchLoading &&
    filteredTracks.length >= trackResultLimit;

  const handleAddArtist = async (artist: Artist) => {
    if (selectedArtists.some((selectedArtist) => selectedArtist.id === artist.id)) {
      return;
    }

    if (selectedArtists.length >= 5) {
      setArtistSaveError("You can only select up to 5 artists.");
      return;
    }

    try {
      setMutatingArtistId(artist.id);
      setArtistSaveError("");
      await addArtistToUser(session.user.id, session.access_token, artist);
      setSelectedArtists((current) => [...current, artist]);
    } catch (error) {
      setArtistSaveError(
        error instanceof Error ? error.message : "Could not save artist."
      );
    } finally {
      setMutatingArtistId(null);
    }
  };

  const handleRemoveArtist = async (artistId: string) => {
    try {
      setMutatingArtistId(artistId);
      setArtistSaveError("");
      await removeArtistFromUser(session.user.id, session.access_token, artistId);
      setSelectedArtists((current) =>
        current.filter((artist) => artist.id !== artistId)
      );
    } catch (error) {
      setArtistSaveError(
        error instanceof Error ? error.message : "Could not remove artist."
      );
    } finally {
      setMutatingArtistId(null);
    }
  };

  const handleAddTrack = async (track: Track) => {
    if (selectedTracks.some((selectedTrack) => selectedTrack.id === track.id)) {
      return;
    }

    if (selectedTracks.length >= 7) {
      setTrackSaveError("You can only select up to 7 songs.");
      return;
    }

    try {
      setMutatingTrackId(track.id);
      setTrackSaveError("");
      await addTrackToUser(session.user.id, session.access_token, track);
      setSelectedTracks((current) => [...current, track]);
    } catch (error) {
      setTrackSaveError(error instanceof Error ? error.message : "Could not save song.");
    } finally {
      setMutatingTrackId(null);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    try {
      setMutatingTrackId(trackId);
      setTrackSaveError("");
      await removeTrackFromUser(session.user.id, session.access_token, trackId);
      setSelectedTracks((current) =>
        current.filter((track) => track.id !== trackId)
      );
    } catch (error) {
      setTrackSaveError(
        error instanceof Error ? error.message : "Could not remove song."
      );
    } finally {
      setMutatingTrackId(null);
    }
  };

  const canMoveToTracks = selectedArtists.length >= 3;
  const canFinishMusic = selectedTracks.length >= 4;

  return (
    <View style={styles.screen}>
      <View style={[styles.fixedTopPanelWrap, { paddingTop: topInset }]}>
        <View style={[styles.topPanel, { width: contentWidth }]}>
          <View style={styles.titleWrap}>
            <Text style={styles.topPanelTitle}>Build your taste</Text>
            <Text style={styles.topPanelSubcopy}>
              {step === "artists" ? "artist setup" : "song setup"}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.iconGhost,
              pressed && styles.iconGhostPressed,
            ]}
            onPress={() =>
              step === "artists"
                ? artistInputRef.current?.focus()
                : trackInputRef.current?.focus()
            }
          >
            <View style={styles.searchIcon}>
              <View style={styles.searchIconCircle} />
              <View style={styles.searchIconHandle} />
            </View>
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
          <Text style={styles.kicker}>Taste profile</Text>

          {step === "artists" ? (
            <>
              <Text style={styles.title}>
                Start with artists that actually define you.
              </Text>
              <Text style={styles.helperText}>
                Pick at least 3 artists before moving to songs.
              </Text>

              <View style={styles.searchBar}>
                <TextInput
                  ref={artistInputRef}
                  value={artistSearch}
                  onChangeText={setArtistSearch}
                  placeholder="Search artists"
                  placeholderTextColor="#9D97A5"
                  style={styles.searchInput}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <View style={styles.searchDot} />
              </View>

              <View style={[styles.sectionCard, styles.sectionSpacing]}>
                <Text style={styles.sectionTitle}>Selected artists</Text>
                {artistSaveError ? (
                  <Text style={styles.inlineErrorText}>{artistSaveError}</Text>
                ) : null}
                <View style={styles.chipRow}>
                  {selectedArtistsLoading ? (
                    <Text style={styles.emptyStateText}>Loading saved artists...</Text>
                  ) : selectedArtists.length > 0 ? (
                    selectedArtists.map((artist, index) => (
                      <Pressable
                        key={artist.id}
                        style={[
                          styles.chip,
                          index % 2 === 0 ? styles.chipPink : styles.chipMint,
                          mutatingArtistId === artist.id && styles.chipDisabled,
                        ]}
                        onPress={() => void handleRemoveArtist(artist.id)}
                        disabled={mutatingArtistId === artist.id}
                      >
                        <Text style={styles.chipText}>{artist.name}</Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.emptyStateText}>
                      Pick at least 3 artists to shape your taste profile.
                    </Text>
                  )}

                  {selectedArtists.length < 5 ? (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>+ add</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Suggested artists</Text>

                <View style={styles.artistList}>
                  {artistSearchLoading ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>Searching artists...</Text>
                    </View>
                  ) : artistSearchError ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>{artistSearchError}</Text>
                    </View>
                  ) : filteredArtists.length > 0 ? (
                    filteredArtists.map((artist) => (
                      <View key={artist.id} style={styles.artistRow}>
                        <View style={styles.artistAvatarFrame}>
                          <View
                            style={[
                              styles.artistAvatar,
                              { backgroundColor: artist.gradientStart },
                            ]}
                          />
                          <View
                            style={[
                              styles.artistAvatarOverlay,
                              { backgroundColor: artist.gradientEnd },
                            ]}
                          />
                        </View>

                        <View style={styles.artistMeta}>
                          <Text style={styles.artistName}>{artist.name}</Text>
                          <Text style={styles.artistDescription}>{artist.meta}</Text>
                        </View>

                        <Pressable
                          style={({ pressed }) => [
                            styles.plusButton,
                            mutatingArtistId === artist.id && styles.plusButtonDisabled,
                            pressed && styles.plusButtonPressed,
                          ]}
                          onPress={() => void handleAddArtist(artist)}
                          disabled={mutatingArtistId === artist.id}
                        >
                          <Text style={styles.plusButtonText}>
                            {mutatingArtistId === artist.id ? "..." : "+"}
                          </Text>
                        </Pressable>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        {artistSearch.trim().length >= 2
                          ? "No artists found for that search yet."
                          : "No more matches for that search yet."}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>
                Now choose the songs that feel most like you.
              </Text>
              <Text style={styles.helperText}>
                Add at least 4 songs to complete your music profile.
              </Text>

              <View style={[styles.sectionCard, styles.sectionSpacing]}>
                <Text style={styles.sectionTitle}>Selected songs</Text>
                {trackSaveError ? (
                  <Text style={styles.inlineErrorText}>{trackSaveError}</Text>
                ) : null}
                <View style={styles.trackChipWrap}>
                  {selectedTracksLoading ? (
                    <Text style={styles.emptyStateText}>Loading saved songs...</Text>
                  ) : selectedTracks.length > 0 ? (
                    selectedTracks.map((track) => (
                      <Pressable
                        key={track.id}
                        style={[
                          styles.trackChip,
                          mutatingTrackId === track.id && styles.chipDisabled,
                        ]}
                        onPress={() => void handleRemoveTrack(track.id)}
                        disabled={mutatingTrackId === track.id}
                      >
                        <Text style={styles.trackChipTitle} numberOfLines={1}>
                          {track.title}
                        </Text>
                        <Text style={styles.trackChipMeta} numberOfLines={1}>
                          {track.artistName}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.emptyStateText}>
                      Add at least 4 songs that feel most like you.
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Suggested songs</Text>

                <View style={styles.searchBar}>
                  <TextInput
                    ref={trackInputRef}
                    value={trackSearch}
                    onChangeText={setTrackSearch}
                    placeholder="Search songs"
                    placeholderTextColor="#9D97A5"
                    style={styles.searchInput}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  <View style={styles.searchDot} />
                </View>

                <View style={styles.artistList}>
                  {trackSearch.trim().length < 2 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        Search for a song title to get track matches.
                      </Text>
                    </View>
                  ) : trackSearchLoading ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>Searching songs...</Text>
                    </View>
                  ) : trackSearchError ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>{trackSearchError}</Text>
                    </View>
                  ) : filteredTracks.length > 0 ? (
                    filteredTracks.map((track) => (
                      <View key={track.id} style={styles.artistRow}>
                        <View style={styles.trackBullet}>
                          <View style={styles.trackBulletInner} />
                        </View>

                        <View style={styles.artistMeta}>
                          <Text style={styles.artistName}>{track.title}</Text>
                          <Text style={styles.artistDescription}>
                            {track.artistName}
                            {track.releaseTitle ? ` · ${track.releaseTitle}` : ""}
                          </Text>
                        </View>

                        <Pressable
                          style={({ pressed }) => [
                            styles.plusButton,
                            mutatingTrackId === track.id && styles.plusButtonDisabled,
                            pressed && styles.plusButtonPressed,
                          ]}
                          onPress={() => void handleAddTrack(track)}
                          disabled={mutatingTrackId === track.id}
                        >
                          <Text style={styles.plusButtonText}>
                            {mutatingTrackId === track.id ? "..." : "+"}
                          </Text>
                        </Pressable>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        No songs found for that search yet.
                      </Text>
                    </View>
                  )}
                </View>

                {canLoadMoreTracks ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.loadMoreButton,
                      pressed && styles.plusButtonPressed,
                    ]}
                    onPress={() =>
                      setTrackResultLimit((currentLimit) => currentLimit + 4)
                    }
                  >
                    <Text style={styles.loadMoreButtonText}>Load 4 more</Text>
                  </Pressable>
                ) : null}
              </View>
            </>
          )}

          <View style={styles.footerActions}>
            {step === "tracks" ? (
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryActionButton,
                  pressed && styles.plusButtonPressed,
                ]}
                onPress={() => setStep("artists")}
              >
                <Text style={styles.secondaryActionText}>Back to artists</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.primaryActionButton,
                ((step === "artists" && !canMoveToTracks) ||
                  (step === "tracks" && !canFinishMusic)) &&
                  styles.primaryActionDisabled,
                pressed && styles.plusButtonPressed,
              ]}
              onPress={() => {
                if (step === "artists" && canMoveToTracks) {
                  setStep("tracks");
                  return;
                }

                if (step === "tracks" && canFinishMusic) {
                  onComplete();
                }
              }}
              disabled={
                (step === "artists" && !canMoveToTracks) ||
                (step === "tracks" && !canFinishMusic)
              }
            >
              <Text style={styles.primaryActionText}>
                {step === "artists"
                  ? canMoveToTracks
                    ? "Continue to songs"
                    : `Select ${Math.max(0, 3 - selectedArtists.length)} more artist${3 - selectedArtists.length === 1 ? "" : "s"}`
                  : canFinishMusic
                    ? "Music profile complete"
                    : `Select ${Math.max(0, 4 - selectedTracks.length)} more song${4 - selectedTracks.length === 1 ? "" : "s"}`}
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
  searchIcon: {
    width: 16,
    height: 16,
    position: "relative",
  },
  searchIconCircle: {
    position: "absolute",
    top: 1,
    left: 1,
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  searchIconHandle: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 6,
    height: 1.5,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
    borderRadius: 999,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  content: {
    minHeight: "100%",
  },
  kicker: {
    color: "rgba(255,248,251,0.72)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 31,
    letterSpacing: -1.2,
    fontFamily: "SpaceGrotesk_700Bold",
    maxWidth: 300,
  },
  helperText: {
    color: "rgba(255,248,251,0.66)",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "SpaceGrotesk_400Regular",
    marginTop: 10,
    marginBottom: 2,
    maxWidth: 320,
  },
  searchBar: {
    height: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    marginTop: 14,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    paddingVertical: 0,
  },
  searchDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#82F7A6",
    marginLeft: 12,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sectionSpacing: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    color: "#FFFFFF",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipPink: {
    backgroundColor: "rgba(255,79,136,0.20)",
  },
  chipMint: {
    backgroundColor: "rgba(130,247,166,0.18)",
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  chipDisabled: {
    opacity: 0.6,
  },
  trackChipWrap: {
    gap: 10,
  },
  trackChip: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  trackChipTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    marginBottom: 4,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  trackChipMeta: {
    color: "rgba(255,248,251,0.60)",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  artistList: {
    gap: 10,
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  artistAvatarFrame: {
    width: 42,
    height: 42,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  artistAvatar: {
    ...StyleSheet.absoluteFillObject,
  },
  artistAvatarOverlay: {
    position: "absolute",
    top: 10,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 999,
    opacity: 0.72,
  },
  trackBullet: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,79,136,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,122,89,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  trackBulletInner: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(255,122,89,0.88)",
  },
  artistMeta: {
    flex: 1,
  },
  artistName: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 4,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  artistDescription: {
    color: "rgba(255,248,251,0.58)",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(130,247,166,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  plusButtonPressed: {
    opacity: 0.82,
  },
  plusButtonDisabled: {
    opacity: 0.6,
  },
  plusButtonText: {
    color: "#82F7A6",
    fontSize: 18,
    lineHeight: 18,
    fontFamily: "SpaceGrotesk_700Bold",
    marginTop: -1,
  },
  emptyState: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    color: "rgba(255,248,251,0.62)",
    fontSize: 13,
    textAlign: "center",
    fontFamily: "SpaceGrotesk_400Regular",
  },
  inlineErrorText: {
    color: "#FFB7BD",
    fontSize: 12,
    marginBottom: 10,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  footerActions: {
    gap: 12,
    marginTop: 18,
  },
  secondaryActionButton: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  primaryActionButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,79,136,0.9)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryActionDisabled: {
    opacity: 0.55,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  loadMoreButton: {
    marginTop: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
  },
});
