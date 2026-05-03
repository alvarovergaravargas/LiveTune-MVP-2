export type Station = {
  id: string;
  name: string;
  description: string;
  tagline: string;
  mood: string;
  energy: "Calm" | "Balanced" | "Energetic";
  queries: string[];
  tags: string[];
};

export const STATIONS: Station[] = [
  {
    id: "lofi-focus",
    name: "Lo-Fi Focus Radio",
    tagline: "Beats para estudiar y trabajar",
    description: "Una estación suave para concentración sostenida, lectura, documentación y sesiones largas de trabajo.",
    mood: "Focus",
    energy: "Balanced",
    queries: ["lofi hip hop radio live", "lofi beats to study live", "lofi focus music live", "study beats live radio"],
    tags: ["Lo-fi", "Focus", "Study"]
  },
  {
    id: "deep-work",
    name: "Deep Work Instrumental",
    tagline: "Instrumental para concentración profunda",
    description: "Música instrumental, ambiental y sin voces fuertes para análisis, escritura, programación o trabajo analítico.",
    mood: "Deep Work",
    energy: "Calm",
    queries: ["deep focus music live", "instrumental work music live", "study music live instrumental", "concentration music live"],
    tags: ["Instrumental", "Work", "No distractions"]
  },
  {
    id: "jazz-coffee",
    name: "Jazz Coffee Radio",
    tagline: "Ambiente de café para trabajar ligero",
    description: "Jazz suave para correos, tareas administrativas, documentación ligera y sesiones relajadas.",
    mood: "Relaxed Work",
    energy: "Balanced",
    queries: ["coffee jazz live", "smooth jazz live radio", "jazz cafe music live", "relaxing jazz live"],
    tags: ["Jazz", "Coffee", "Relax"]
  },
  {
    id: "ambient-calm",
    name: "Ambient Calm Station",
    tagline: "Texturas suaves y música espacial",
    description: "Ambientes largos y calmados para leer, pensar, crear ideas o bajar el ruido mental.",
    mood: "Calm",
    energy: "Calm",
    queries: ["ambient music live", "space ambient live", "calm ambient live", "meditation ambient live"],
    tags: ["Ambient", "Calm", "Reading"]
  },
  {
    id: "synthwave-night",
    name: "Synthwave Night Drive",
    tagline: "Energía nocturna y cyberpunk",
    description: "Retrowave y synthwave para tareas con energía: diseño, ideación, limpieza de pendientes o trabajo nocturno.",
    mood: "Night Energy",
    energy: "Energetic",
    queries: ["synthwave live radio", "retrowave live radio", "cyberpunk music live", "night drive synthwave live"],
    tags: ["Synthwave", "Energy", "Night"]
  },
  {
    id: "piano-study",
    name: "Piano Study Room",
    tagline: "Piano tranquilo para lectura y escritura",
    description: "Piano e instrumental clásico moderno para estudiar, leer documentos o escribir sin distracciones.",
    mood: "Study",
    energy: "Calm",
    queries: ["piano study music live", "relaxing piano live", "classical piano music live", "piano music for studying live"],
    tags: ["Piano", "Study", "Writing"]
  },
  {
    id: "sacred-ambient",
    name: "Sacred Ambient Radio",
    tagline: "Cantos, música sacra y contemplativa",
    description: "Música espiritual, canto gregoriano y ambientes contemplativos para trabajo sereno o lectura profunda.",
    mood: "Contemplative",
    energy: "Calm",
    queries: ["gregorian chant live", "catholic music live", "sacred music live", "instrumental worship live"],
    tags: ["Sacred", "Gregorian", "Calm"]
  },
  {
    id: "latin-chill",
    name: "Latin Chill Live",
    tagline: "Ambiente latino suave",
    description: "Música latina suave y chill para tareas casuales, organización personal o trabajo de baja intensidad.",
    mood: "Casual Work",
    energy: "Balanced",
    queries: ["latin chill live music", "spanish chill music live", "latin pop live radio", "bossa nova latin live"],
    tags: ["Latin", "Chill", "Casual"]
  }
];

export function getStation(stationId: string): Station {
  return STATIONS.find((station) => station.id === stationId) ?? STATIONS[0];
}

export function buildSearchQuery(stationId: string): string {
  const station = getStation(stationId);
  const query = station.queries[Math.floor(Math.random() * station.queries.length)];
  return query.trim();
}
