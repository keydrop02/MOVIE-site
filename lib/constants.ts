export const SITE = {
  name: "Movieo",
  tagline: "Discover movies & shows",
  description:
    "An editorial cinematic discovery platform for movies and TV shows.",
  url: "https://movieo.example.com",
} as const;

export const MEDIA_SORTS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "popularity.asc", label: "Least Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "vote_average.asc", label: "Lowest Rated" },
  { value: "release_date.desc", label: "Newest" },
  { value: "release_date.asc", label: "Oldest" },
  { value: "vote_count.desc", label: "Most Voted" },
  { value: "title.asc", label: "Alphabetical" },
] as const;

/** Spotlight providers shown on the home "Browse by Provider" rail. */
export const SPOTLIGHT_PROVIDERS: Record<string, string> = {
  "8": "Netflix",
  "9": "Amazon Prime Video",
  "10": "Amazon Prime",
  "337": "Disney Plus",
  "350": "Apple TV+",
  "2": "Apple TV",
  "1899": "HBO Max",
  "15": "Hulu",
  "2303": "Paramount Plus",
  "386": "Peacock Premium",
  "283": "Crunchyroll",
  "43": "Starz",
  "526": "AMC+",
  "34": "MGM Plus",
  "188": "YouTube Premium",
  "192": "YouTube",
  "73": "Tubi TV",
  "300": "Pluto TV",
  "257": "fuboTV",
  "190": "Curiosity Stream",
};

export const TRENDING_WINDOW: "day" | "week" = "week";

/** TMDB keyword id that tags a title as anime. */
export const ANIME_KEYWORD = 210024;
