import { NextRequest, NextResponse } from "next/server";
import { buildSearchQuery, getStation } from "@/lib/stations";
import type { LiveSearchResponse, LiveVideo } from "@/lib/types";

export const dynamic = "force-dynamic";

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    publishedAt?: string;
    channelId?: string;
    title?: string;
    description?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
    channelTitle?: string;
    liveBroadcastContent?: string;
  };
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function mapYouTubeItem(item: YouTubeSearchItem): LiveVideo | null {
  const videoId = item.id?.videoId;
  const snippet = item.snippet;
  if (!videoId || !snippet) return null;

  return {
    videoId,
    title: decodeHtml(snippet.title ?? "Untitled live stream"),
    channelTitle: decodeHtml(snippet.channelTitle ?? "Unknown channel"),
    channelId: snippet.channelId ?? "",
    description: decodeHtml(snippet.description ?? ""),
    thumbnailUrl:
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.medium?.url ??
      snippet.thumbnails?.default?.url ??
      "",
    publishedAt: snippet.publishedAt ?? "",
    liveBroadcastContent: snippet.liveBroadcastContent ?? "live"
  };
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get("station") ?? "lofi-focus";
  const station = getStation(stationId);
  const query = searchParams.get("q") || buildSearchQuery(station.id);

  if (!apiKey) {
    const response: LiveSearchResponse = {
      stationId: station.id,
      query,
      items: [],
      error:
        "Missing YOUTUBE_API_KEY. Create .env.local using .env.example and restart the dev server."
    };
    return NextResponse.json(response, { status: 500 });
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    eventType: "live",
    videoEmbeddable: "true",
    videoSyndicated: "true",
    safeSearch: "moderate",
    maxResults: "18",
    key: apiKey
  });

  const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;

  try {
    const youtubeResponse = await fetch(youtubeUrl, {
      method: "GET",
      cache: "no-store"
    });

    const payload = await youtubeResponse.json();

    if (!youtubeResponse.ok) {
      const response: LiveSearchResponse = {
        stationId: station.id,
        query,
        items: [],
        error: payload?.error?.message ?? "YouTube API request failed."
      };
      return NextResponse.json(response, { status: youtubeResponse.status });
    }

    const seen = new Set<string>();
    const items = Array.isArray(payload.items)
      ? payload.items
          .map(mapYouTubeItem)
          .filter((item: LiveVideo | null): item is LiveVideo => Boolean(item))
          .filter((item: LiveVideo) => {
            if (seen.has(item.videoId)) return false;
            seen.add(item.videoId);
            return true;
          })
      : [];

    const response: LiveSearchResponse = {
      stationId: station.id,
      query,
      items
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: LiveSearchResponse = {
      stationId: station.id,
      query,
      items: [],
      error: error instanceof Error ? error.message : "Unexpected server error."
    };
    return NextResponse.json(response, { status: 500 });
  }
}
