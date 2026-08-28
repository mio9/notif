import { parse as parseYaml } from "yaml";
import type { ConfigEntry, NotifConfig } from "./destinations/types.ts";

const DEFAULT_CONFIG_PATH = "notif.yaml";

export class ConfigError extends Error {
  constructor(
    message: string,
    readonly configPath: string,
  ) {
    super(message);
    this.name = "ConfigError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseName(value: unknown, index: number): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`destinations[${index}]: "name" must be a non-empty string`);
  }

  return value;
}

function parseHttpEntry(value: unknown, index: number): ConfigEntry {
  if (!isRecord(value) || value.type !== "http") {
    throw new Error(`destinations[${index}]: expected type "http"`);
  }

  if (typeof value.url !== "string" || value.url.length === 0) {
    throw new Error(`destinations[${index}]: "url" must be a non-empty string`);
  }

  if (value.method !== undefined && typeof value.method !== "string") {
    throw new Error(`destinations[${index}]: "method" must be a string`);
  }

  if (value.headers !== undefined) {
    if (!isRecord(value.headers)) {
      throw new Error(`destinations[${index}]: "headers" must be an object`);
    }

    for (const [headerKey, headerValue] of Object.entries(value.headers)) {
      if (typeof headerValue !== "string") {
        throw new Error(`destinations[${index}]: header "${headerKey}" must be a string`);
      }
    }
  }

  return {
    type: "http",
    name: parseName(value.name, index),
    url: value.url,
    method: typeof value.method === "string" ? value.method : undefined,
    headers: value.headers as Record<string, string> | undefined,
  };
}

function parseLogEntry(value: unknown, index: number): ConfigEntry {
  if (!isRecord(value) || value.type !== "log") {
    throw new Error(`destinations[${index}]: expected type "log"`);
  }

  if (typeof value.path !== "string" || value.path.length === 0) {
    throw new Error(`destinations[${index}]: "path" must be a non-empty string`);
  }

  return {
    type: "log",
    name: parseName(value.name, index),
    path: value.path,
  };
}

function parseConfigEntry(value: unknown, index: number): ConfigEntry {
  if (!isRecord(value) || typeof value.type !== "string") {
    throw new Error(`destinations[${index}]: "type" must be "http" or "log"`);
  }

  if (value.type === "http") {
    return parseHttpEntry(value, index);
  }

  if (value.type === "log") {
    return parseLogEntry(value, index);
  }

  throw new Error(`destinations[${index}]: unknown type "${value.type}"`);
}

export function parseConfig(raw: unknown): NotifConfig {
  if (!isRecord(raw)) {
    throw new Error("Config must be a YAML object");
  }

  if (!Array.isArray(raw.destinations)) {
    throw new Error('Config must include a "destinations" array');
  }

  const destinations = raw.destinations.map(parseConfigEntry);
  const names = new Set<string>();

  for (const entry of destinations) {
    if (!entry.name) {
      continue;
    }

    if (names.has(entry.name)) {
      throw new Error(`Duplicate destination name "${entry.name}"`);
    }

    names.add(entry.name);
  }

  return { destinations };
}

export async function loadConfig(configPath?: string): Promise<NotifConfig | null> {
  const path = configPath ?? DEFAULT_CONFIG_PATH;
  const file = Bun.file(path);

  if (!(await file.exists())) {
    return null;
  }

  const text = await file.text();

  if (text.trim().length === 0) {
    throw new ConfigError("Config file is empty", path);
  }

  let raw: unknown;

  try {
    raw = parseYaml(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ConfigError(`Invalid YAML: ${message}`, path);
  }

  if (raw === null || raw === undefined) {
    throw new ConfigError("Config file is empty", path);
  }

  try {
    return parseConfig(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ConfigError(message, path);
  }
}

export { DEFAULT_CONFIG_PATH };
