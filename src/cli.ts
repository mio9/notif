import { program } from "commander";
import { DEFAULT_CONFIG_PATH, ConfigError, loadConfig } from "./config.ts";
import {
  destinationFromCliHttp,
  destinationFromCliLog,
  destinationsFromConfigEntries,
  destinationsFromNames,
} from "./destinations/factory.ts";
import type {
  CliHttpDestination,
  CliLogDestination,
  Destination,
} from "./destinations/types.ts";

export type ParsedCli = {
  destinations: Destination[];
  showHelp: boolean;
};

function parseHeader(header: string): [string, string] {
  const separatorIndex = header.indexOf(":");

  if (separatorIndex === -1) {
    throw new Error(`Invalid header "${header}". Expected format "Key: Value"`);
  }

  const key = header.slice(0, separatorIndex).trim();
  const value = header.slice(separatorIndex + 1).trim();

  if (key.length === 0) {
    throw new Error(`Invalid header "${header}". Header name is required`);
  }

  return [key, value];
}

export async function parseCli(argv: string[]): Promise<ParsedCli> {
  let configPath: string | undefined;
  const httpUrls: string[] = [];
  const logPaths: string[] = [];
  const destNames: string[] = [];
  let httpMethod = "POST";
  const httpHeaders: Record<string, string> = {};

  program
    .name("notif")
    .description("Read stdin and send payload to configured destinations")
    .option("--config <path>", "Path to YAML config file")
    .option("--dest <name>", "Use named config destination", (value, previous: string[]) => {
      previous.push(value);
      return previous;
    }, [])
    .option("--http <url>", "Add HTTP destination", (value, previous: string[]) => {
      previous.push(value);
      return previous;
    }, [])
    .option("--log <path>", "Add log file destination", (value, previous: string[]) => {
      previous.push(value);
      return previous;
    }, [])
    .option("--method <method>", "HTTP method for subsequent --http flags", "POST")
    .option("--header <key:value>", "HTTP header for subsequent --http flags", (value, previous: string[]) => {
      previous.push(value);
      return previous;
    }, []);

  program.parse(argv.length > 0 ? argv : process.argv);

  const options = program.opts<{
    config?: string;
    dest: string[];
    http: string[];
    log: string[];
    method: string;
    header: string[];
  }>();

  configPath = options.config;
  destNames.push(...options.dest);
  httpUrls.push(...options.http);
  logPaths.push(...options.log);
  httpMethod = options.method;

  for (const header of options.header) {
    const [key, value] = parseHeader(header);
    httpHeaders[key] = value;
  }

  const destinations: Destination[] = [];
  const explicitConfig = configPath !== undefined;
  let config: Awaited<ReturnType<typeof loadConfig>> = null;
  let configDestinationCount = 0;

  try {
    config = await loadConfig(configPath);
  } catch (error) {
    const hasCliDestinations = httpUrls.length > 0 || logPaths.length > 0;

    if (!explicitConfig && hasCliDestinations && error instanceof ConfigError) {
      console.error(`Ignoring invalid ${error.configPath}: ${error.message}`);
    } else {
      throw error;
    }
  }

  if (config) {
    const configDestinations = destNames.length > 0
      ? destinationsFromNames(config.destinations, destNames)
      : destinationsFromConfigEntries(config.destinations);

    configDestinationCount = configDestinations.length;
    destinations.push(...configDestinations);

    if (
      configDestinationCount === 0
      && httpUrls.length === 0
      && logPaths.length === 0
    ) {
      throw new ConfigError("Config has no destinations", configPath ?? DEFAULT_CONFIG_PATH);
    }
  } else if (configPath) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  for (const url of httpUrls) {
    const cliHttp: CliHttpDestination = {
      url,
      method: httpMethod,
      headers: { ...httpHeaders },
    };
    destinations.push(destinationFromCliHttp(cliHttp));
  }

  for (const path of logPaths) {
    const cliLog: CliLogDestination = { path };
    destinations.push(destinationFromCliLog(cliLog));
  }

  if (destinations.length === 0) {
    program.outputHelp();
    return { destinations: [], showHelp: true };
  }

  return { destinations, showHelp: false };
}

export { DEFAULT_CONFIG_PATH };
