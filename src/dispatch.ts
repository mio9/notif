import type { Destination } from "./destinations/types.ts";

export type DispatchFailure = {
  label: string;
  error: Error;
};

export type DispatchResult = {
  failures: DispatchFailure[];
};

export async function dispatchAll(
  destinations: Destination[],
  payload: string,
): Promise<DispatchResult> {
  const results = await Promise.allSettled(
    destinations.map((destination) => destination.send(payload)),
  );

  const failures: DispatchFailure[] = [];

  for (let index = 0; index < results.length; index++) {
    const result = results[index];
    const destination = destinations[index];
    if (result?.status === "rejected" && destination) {
      const error = result.reason instanceof Error
        ? result.reason
        : new Error(String(result.reason));
      failures.push({ label: destination.label, error });
    }
  }

  return { failures };
}
