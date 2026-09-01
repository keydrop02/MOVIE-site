import { z } from "zod";

export const idParamSchema = z.coerce.number().int().positive();

export const pageSchema = z.coerce.number().int().min(1).max(500).default(1);

export const qSchema = z
  .object({
    query: z.string().min(1).max(200).default(""),
    page: pageSchema,
    type: z.enum(["all", "movie", "tv", "anime"]).optional(),
  })
  .passthrough();

export const discoverParamsSchema = z.object({
  page: pageSchema,
  genre: z.coerce.number().int().positive().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  rating: z.coerce.number().min(0).max(10).optional(),
  minVotes: z.coerce.number().int().min(0).optional(),
  sort: z.string().max(80).optional(),
  language: z.string().max(20).optional(),
  country: z.string().length(2).optional(),
  provider: z.coerce.number().int().positive().optional(),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(200),
  page: pageSchema,
});

export const listCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().default(""),
});

export const listUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
});

export const listItemSchema = z.object({
  tmdbId: z.coerce.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  title: z.string().min(1).max(300),
  posterPath: z.string().max(500).nullable().optional(),
});
