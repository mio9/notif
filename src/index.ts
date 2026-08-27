#!/usr/bin/env bun

import { parseCli } from "./cli.ts";
import { dispatchAll } from "./dispatch.ts";
import { readStdin } from "./stdin.ts";

async function main(): Promise<number> {
  let parsed;

  try {
    parsed = await parseCli(process.argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    return 1;
  }

  if (parsed.showHelp) {
    return 1;
  }

  const payload = await readStdin();
  const result = await dispatchAll(parsed.destinations, payload);

  if (result.failures.length === 0) {
    return 0;
  }

  for (const failure of result.failures) {
    console.error(`${failure.label}: ${failure.error.message}`);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
