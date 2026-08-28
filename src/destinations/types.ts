export type Destination = {
  label: string;
  send(payload: string): Promise<void>;
};

export type HttpConfigEntry = {
  type: "http";
  name?: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
};

export type LogConfigEntry = {
  type: "log";
  name?: string;
  path: string;
};

export type ConfigEntry = HttpConfigEntry | LogConfigEntry;

export type NotifConfig = {
  destinations: ConfigEntry[];
};

export type CliHttpDestination = {
  url: string;
  method: string;
  headers: Record<string, string>;
};

export type CliLogDestination = {
  path: string;
};
