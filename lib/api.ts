import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("Invalid request parameters", 400, error.flatten());
  }
  if (error instanceof Error) {
    const status = (error as { status?: number }).status;
    if (status) return jsonError(error.message, status);
    return jsonError("Something went wrong", 500);
  }
  return jsonError("Something went wrong", 500);
}
