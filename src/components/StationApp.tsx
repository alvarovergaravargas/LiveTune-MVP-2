"use client";

import { useEffect, useMemo, useState } from "react";
import { STATIONS } from "@/lib/stations";
import type { ListeningHistoryItem, LiveSearchResponse, LiveVideo } from "@/lib/types";

const STORAGE_KEYS = {
  favorites: "livetune:favorites",
  blocked: "livetune:blockedChannels",
  history: "livetune:history",
  lastStation: "livetune:lastStation"
};

function readStringArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function readHistory(): ListeningHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.history);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function getEmbedUrl(videoId: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1"
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

function formatDate(value: string) {
  if (!value) return "Live now";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getVideoKey(video: LiveVideo) {
  return `${video.channelId}:${video.videoId}`;
}

export default function StationApp() {
  const [selectedStationId, setSelectedStationId] = useState(STATIONS[0].id);
  const [videos, setVideos] = useState<LiveVideo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [blockedChannels, setBlockedChannels] = useState<string[]>([]);
  const [history, setHistory] = useState<ListeningHistoryItem[]>([]);
  const [failedVideos, setFailedVideos] = useState<string[]>([]);

  const selectedStation = useMemo(
    () => STATIONS.find((station) => station.id === selectedStationId) ?? STATIONS[0],
    [selectedStationId]
  );

  const visibleVideos = useMemo(
    () => videos.filter((video) => !blockedChannels.includes(video.channelId) && !failedVideos.includes(getVideoKey(video))),
    [videos, blockedChannels, failedVideos]
  );

  const activeVideo = visibleVideos[activeIndex];
  const nextVideos = visibleVideos.filter((_, index) => index !== activeIndex).slice(0, 8);

  useEffect(() => {
    setFavorites(readStringArray(STORAGE_KEYS.favorites));
    setBlockedChannels(readStringArray(STORAGE_KEYS.blocked));
    setHistory(readHistory());

    const lastStation = window.localStorage.getItem(STORAGE_KEYS.lastStation);
    if (lastStation && STATIONS.some((station) => station.id === lastStation)) {
      setSelectedStationId(lastStation);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.blocked, JSON.stringify(blockedChannels));
  }, [blockedChannels]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.lastStation, selectedStationId);
  }, [selectedStationId]);

  useEffect(() => {
    setActiveIndex(0);
  }, [blockedChannels, failedVideos]);

  function addToHistory(video: LiveVideo) {
    const item: ListeningHistoryItem = {
      videoId: video.videoId,
      title: video.title,
      channelTitle: video.channelTitle,
      channelId: video.channelId,
      thumbnailUrl: video.thumbnailUrl,
      stationId: selectedStation.id,
      stationName: selectedStation.name,
      playedAt: new Date().toISOString()
    };

    setHistory((current) => {
      const withoutDuplicate = current.filter((entry) => entry.videoId !== item.videoId);
      return [item, ...withoutDuplicate].slice(0, 25);
    });
  }

  async function loadStation(options?: { forceRefresh?: boolean }) {
    setIsLoading(true);
    setError(null);
    setFailedVideos([]);

    try {
      const params = new URLSearchParams({ station: selectedStation.id });
      if (options?.forceRefresh) params.set("refresh", String(Date.now()));

      const response = await fetch(`/api/youtube/live?${params.toString()}`);
      const payload = (await response.json()) as LiveSearchResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not load station.");
      }

      const filtered = payload.items.filter((item) => !blockedChannels.includes(item.channelId));
      setQuery(payload.query);
      setVideos(filtered);
      setActiveIndex(0);

      if (filtered.length > 0) {
        addToHistory(filtered[0]);
      } else if (payload.items.length > 0) {
        setError("All results for this station are from blocked channels. Unblock a channel or refresh the queue.");
      } else {
        setError("No live streams were found for this station. Try another station or refresh the queue.");
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unexpected error.");
      setVideos([]);
      setActiveIndex(0);
    } finally {
      setIsLoading(false);
    }
  }

  function selectStation(stationId: string) {
    setSelectedStationId(stationId);
    setVideos([]);
    setActiveIndex(0);
    setQuery("");
    setError(null);
    setFailedVideos([]);
  }

  function setActiveVideo(index: number) {
    setActiveIndex(index);
    const video = visibleVideos[index];
    if (video) addToHistory(video);
  }

  function nextVideo() {
    if (visibleVideos.length === 0) return;
    const nextIndex = (activeIndex + 1) % visibleVideos.length;
    setActiveVideo(nextIndex);
  }

  function previousVideo() {
    if (visibleVideos.length === 0) return;
    const nextIndex = activeIndex === 0 ? visibleVideos.length - 1 : activeIndex - 1;
    setActiveVideo(nextIndex);
  }

  function toggleFavorite(video: LiveVideo) {
    setFavorites((current) =>
      current.includes(video.channelId)
        ? current.filter((id) => id !== video.channelId)
        : [...current, video.channelId]
    );
  }

  function blockChannel(video: LiveVideo) {
    setBlockedChannels((current) =>
      current.includes(video.channelId) ? current : [...current, video.channelId]
    );
    setFavorites((current) => current.filter((id) => id !== video.channelId));
    setError(`Blocked ${video.channelTitle}. It will no longer appear in your queue.`);
  }

  function unblockChannel(channelId: string) {
    setBlockedChannels((current) => current.filter((id) => id !== channelId));
  }

  function markLiveFailed() {
    if (!activeVideo) return;
    setFailedVideos((current) => [...current, getVideoKey(activeVideo)]);
    setError("Marked this live as not working for this session. Trying the next available result.");
    setTimeout(nextVideo, 0);
  }

  return (
    <main className="page">
      <section className="hero hero-radio">
        <div>
          <div className="eyebrow">LiveTune · Week 2 Radio Experience</div>
          <h1>Curated live radio for every mood.</h1>
          <p>
            Choose a predefined station and move through a cleaner, distraction-free queue of YouTube live music streams.
            Save the channels you like, block the ones you do not, and keep a local listening history.
          </p>
        </div>

        <div className="panel status-card">
          <strong>{selectedStation.name}</strong>
          <span>{selectedStation.description}</span>
          <div className="status-metrics">
            <small>{visibleVideos.length} in queue</small>
            <small>{favorites.length} favorites</small>
            <small>{blockedChannels.length} blocked</small>
          </div>
        </div>
      </section>

      <section className="stations-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Stations</span>
            <h2>Pick your station</h2>
          </div>
          <button className="secondary-button" onClick={() => loadStation({ forceRefresh: true })} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh queue"}
          </button>
        </div>

        <div className="station-grid">
          {STATIONS.map((station) => (
            <button
              key={station.id}
              className={`station-card panel ${station.id === selectedStation.id ? "selected" : ""}`}
              onClick={() => selectStation(station.id)}
            >
              <span className="station-energy">{station.energy}</span>
              <strong>{station.name}</strong>
              <small>{station.tagline}</small>
              <p>{station.description}</p>
              <div className="tag-row">
                {station.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="station-actions">
          <button className="primary-button" onClick={() => loadStation()} disabled={isLoading}>
            {isLoading ? "Tuning station..." : `Start ${selectedStation.name}`}
          </button>
          <button className="secondary-button" onClick={() => loadStation({ forceRefresh: true })} disabled={isLoading}>
            New live results
          </button>
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      <section className="radio-layout">
        <article className="panel player-card immersive-player">
          {activeVideo ? (
            <>
              <div className="player-topbar">
                <span className="badge">● Live</span>
                <span>{selectedStation.name}</span>
              </div>

              <div className="player-frame">
                <iframe
                  key={activeVideo.videoId}
                  src={getEmbedUrl(activeVideo.videoId)}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <div className="now-playing">
                <div className="now-heading">
                  <div>
                    <span className="subtle-label">Now playing</span>
                    <h2>{activeVideo.title}</h2>
                  </div>
                  <div className="channel-pill">{activeVideo.channelTitle}</div>
                </div>

                <div className="meta">
                  {formatDate(activeVideo.publishedAt)}{query ? ` · Search: ${query}` : ""}
                </div>

                <div className="actions">
                  <button className="secondary-button" onClick={previousVideo} disabled={visibleVideos.length < 2}>
                    Previous
                  </button>
                  <button className="primary-button" onClick={nextVideo} disabled={visibleVideos.length < 2}>
                    Next station
                  </button>
                  <button className="secondary-button" onClick={() => toggleFavorite(activeVideo)}>
                    {favorites.includes(activeVideo.channelId) ? "★ Favorite" : "☆ Save channel"}
                  </button>
                  <button className="secondary-button danger-button" onClick={() => blockChannel(activeVideo)}>
                    Block channel
                  </button>
                  <button className="secondary-button" onClick={markLiveFailed}>
                    Live not working
                  </button>
                  <a
                    className="secondary-button link-button"
                    href={`https://www.youtube.com/watch?v=${activeVideo.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open on YouTube
                  </a>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-player">
              <div>
                <span className="badge neutral-badge">Ready</span>
                <h2>No station loaded yet</h2>
                <p>Select a station above and press Start station.</p>
              </div>
            </div>
          )}
        </article>

        <aside className="side-stack">
          <section className="panel queue">
            <div className="queue-header">
              <h3>Live queue</h3>
              <span>{visibleVideos.length} results</span>
            </div>
            {visibleVideos.length === 0 ? (
              <p className="meta">Your live results will appear here.</p>
            ) : (
              visibleVideos.map((video, index) => (
                <button
                  key={video.videoId}
                  className={`video-item ${index === activeIndex ? "active" : ""}`}
                  onClick={() => setActiveVideo(index)}
                >
                  {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" /> : <div className="thumbnail-empty" />}
                  <div>
                    <strong>{video.title}</strong>
                    <span>{video.channelTitle}</span>
                  </div>
                </button>
              ))
            )}
          </section>

          <section className="panel mini-panel">
            <h3>Up next</h3>
            {nextVideos.length === 0 ? (
              <p className="meta">Load a station to preview upcoming lives.</p>
            ) : (
              nextVideos.slice(0, 3).map((video) => (
                <div className="mini-row" key={`next-${video.videoId}`}>
                  <span>▶</span>
                  <div>
                    <strong>{video.channelTitle}</strong>
                    <small>{video.title}</small>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="panel mini-panel">
            <h3>Favorites</h3>
            {favorites.length === 0 ? (
              <p className="meta">Saved channels will appear here.</p>
            ) : (
              favorites.map((channelId) => {
                const known = [...videos, ...history].find((item) => item.channelId === channelId);
                return (
                  <div className="mini-row" key={channelId}>
                    <span>★</span>
                    <div>
                      <strong>{known?.channelTitle ?? channelId}</strong>
                      <small>Saved channel</small>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          <section className="panel mini-panel">
            <h3>Blocked channels</h3>
            {blockedChannels.length === 0 ? (
              <p className="meta">No blocked channels yet.</p>
            ) : (
              blockedChannels.map((channelId) => {
                const known = [...videos, ...history].find((item) => item.channelId === channelId);
                return (
                  <div className="mini-row with-action" key={channelId}>
                    <span>⊘</span>
                    <div>
                      <strong>{known?.channelTitle ?? channelId}</strong>
                      <small>Hidden from your queue</small>
                    </div>
                    <button onClick={() => unblockChannel(channelId)}>Unblock</button>
                  </div>
                );
              })
            )}
          </section>

          <section className="panel mini-panel">
            <h3>Local history</h3>
            {history.length === 0 ? (
              <p className="meta">Your recently played lives will be saved locally.</p>
            ) : (
              history.slice(0, 6).map((item) => (
                <div className="mini-row" key={`${item.videoId}-${item.playedAt}`}>
                  <span>♫</span>
                  <div>
                    <strong>{item.stationName}</strong>
                    <small>{item.channelTitle} · {new Date(item.playedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                  </div>
                </div>
              ))
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}
