import { createHttpDestination } from "./http.ts";
import { createLogDestination } from "./log.ts";
import type {
  CliHttpDestination,
  CliLogDestination,
  ConfigEntry,
  Destination,
} from "./types.ts";

export function destinationFromConfigEntry(entry: ConfigEntry): Destination {
  switch (entry.type) {
    case "http":
      return createHttpDestination({
        url: entry.url,
        method: entry.method,
        headers: entry.headers,
      });
    case "log":
      return createLogDestination({ path: entry.path });
  }
}

export function destinationsFromConfigEntries(entries: ConfigEntry[]): Destination[] {
  return entries.map(destinationFromConfigEntry);
}

export function destinationFromCliHttp(entry: CliHttpDestination): Destination {
  return createHttpDestination({
    url: entry.url,
    method: entry.method,
    headers: entry.headers,
  });
}

export function destinationFromCliLog(entry: CliLogDestination): Destination {
  return createLogDestination({ path: entry.path });
}
