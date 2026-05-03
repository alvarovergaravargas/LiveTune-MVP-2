export type LiveVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  liveBroadcastContent: string;
};

export type LiveSearchResponse = {
  query: string;
  stationId?: string;
  items: LiveVideo[];
  error?: string;
};

export type ListeningHistoryItem = {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  thumbnailUrl: string;
  stationId: string;
  stationName: string;
  playedAt: string;
};
