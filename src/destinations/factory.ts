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
        name: entry.name,
        url: entry.url,
        method: entry.method,
        headers: entry.headers,
      });
    case "log":
      return createLogDestination({ name: entry.name, path: entry.path });
  }
}

export function destinationsFromConfigEntries(entries: ConfigEntry[]): Destination[] {
  return entries.map(destinationFromConfigEntry);
}

export function destinationsFromNames(entries: ConfigEntry[], names: string[]): Destination[] {
  const byName = new Map<string, ConfigEntry>();

  for (const entry of entries) {
    if (entry.name) {
      byName.set(entry.name, entry);
    }
  }

  const destinations: Destination[] = [];

  for (const name of names) {
    const entry = byName.get(name);

    if (!entry) {
      const available = [...byName.keys()].join(", ") || "(none)";
      throw new Error(`Unknown destination "${name}". Available: ${available}`);
    }

    destinations.push(destinationFromConfigEntry(entry));
  }

  return destinations;
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
