/**
 * Runs once when the Next.js server boots. Dev-mode streaming renders pipe
 * many parallel responses through shared zlib Gzip streams, tripping Node's
 * 10-listener leak heuristic even though nothing actually leaks — raise the
 * ceiling so the console stays readable.
 */
import { EventEmitter } from "node:events";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    EventEmitter.defaultMaxListeners = 50;
  }
}
