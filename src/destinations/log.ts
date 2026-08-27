import type { Destination } from "./types.ts";

export type LogDestinationOptions = {
  path: string;
};

export function createLogDestination(options: LogDestinationOptions): Destination {
  const path = options.path;

  return {
    label: `log:${path}`,
    async send(payload: string) {
      const line = `${new Date().toISOString()} ${payload}\n`;
      const file = Bun.file(path);

      if (!(await file.exists())) {
        await Bun.write(path, line);
        return;
      }

      const writer = file.writer({ append: true });
      writer.write(line);
      await writer.end();
    },
  };
}
