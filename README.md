# notif
🗣️🔊
> Notif without "why"

CLI tool that refracts data from stdin to one or more destinations in parallel. 
Useful for notifying when your long running commands has completed. *(this is the sole reason why this project exists)*


## Install

### Building from source
```bash
bun install
bun build src/index.ts --outfile notif

# (optional)
mv notif /usr/local/bin # or wherever you want to install it
```

This builds the `notif` binary in the current directory, then move the binary to a directory on your $PATH.


### Package managers



## Quick start

Send a message to a log file:

```bash
echo "deploy finished" | notif --log ./events.log
```

Send to an HTTP endpoint:

```bash
echo "deploy finished" | notif --http https://httpbin.org/post
```

Use a config file:

```bash
cp notif.yaml.example notif.yaml
echo "deploy finished" | notif
```

## How it works

1. Read all of stdin as a single string payload.
2. Resolve destinations from config and/or CLI flags.
3. Send the payload to every destination in parallel.
4. Exit `0` if all succeed, `1` if any fail (errors printed to stderr).

Typical usage is in a shell pipeline:

```bash
./deploy.sh 2>&1 | notif --dest webhook --dest local-log
```

## CLI reference

| Flag | Description |
|------|-------------|
| `--config <path>` | Path to YAML config. Defaults to `notif.yaml` in the current directory when that file exists. |
| `--dest <name>` | Use a named destination from config. Repeatable. When omitted, all config destinations are used. |
| `--http <url>` | Add an HTTP destination. Repeatable. |
| `--log <path>` | Append to a log file. Repeatable. |
| `--method <method>` | HTTP method for subsequent `--http` flags. Default: `POST`. |
| `--header <key:value>` | HTTP header for subsequent `--http` flags. Repeatable. |
| `-h, --help` | Show help. |

Config destinations are loaded first. CLI `--http` and `--log` destinations are appended after them. At least one destination is required.

### Examples

Config only (auto-loads `notif.yaml`):

```bash
echo "hello" | notif
```

Select specific named destinations:

```bash
echo "hello" | notif --dest webhook --dest local-log
```

Mix config and inline destinations:

```bash
echo "hello" | notif --dest webhook --http https://backup.example.com/hook
```

Inline HTTP with custom method and headers:

```bash
echo "hello" | notif \
  --method PUT \
  --header "Authorization: Bearer token" \
  --header "Content-Type: text/plain" \
  --http https://example.com/hook
```

## Configuration

Config files are YAML. See [`notif.yaml.example`](notif.yaml.example) for a starting point.

```yaml
destinations:
  - name: webhook
    type: http
    url: https://example.com/hook
    method: POST
    headers:
      Content-Type: text/plain
  - name: local-log
    type: log
    path: ./notif.log
```

### Config rules

- **`destinations`** (required): list of destination entries.
- **`name`** (optional): unique identifier for a destination. Required when you want to refer to it with `--dest`.
- Destination **`name`** values must be unique within a config file.

When `--dest` is not passed, every entry in `destinations` is used. When `--dest` is passed, only the named entries are selected.

## Destination types

### `http`

Sends the raw stdin payload as the request body.

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `type` | yes | — | Must be `http`. |
| `name` | no | — | Name for `--dest` selection. |
| `url` | yes | — | Request URL. |
| `method` | no | `POST` | HTTP method. |
| `headers` | no | `{}` | Request headers as key/value strings. |

Non-2xx responses are treated as errors. The error message includes the status code and a snippet of the response body.

### `log`

Appends the payload to a file with an ISO 8601 timestamp prefix:

```
2026-08-28T13:05:53.946Z deploy finished
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `type` | yes | — | Must be `log`. |
| `name` | no | — | Name for `--dest` selection. |
| `path` | yes | — | File path to append to. Creates the file if it does not exist. |

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | All destinations accepted the payload. |
| `1` | No destinations configured, config parse error, unknown `--dest` name, or one or more destinations failed. |

On failure, each failed destination prints a line to stderr using its label (the destination `name` when set, otherwise a type-derived label such as `http:https://example.com/hook` or `log:./notif.log`).

## Development

Run from source without linking:

```bash
bun ./src/index.ts --help
```

After `bun link`, use the binary as normal:

```bash
notif --help
```

Project layout:

```
src/
  index.ts          Entry point
  cli.ts            Argument parsing
  config.ts         YAML config loading
  dispatch.ts       Parallel delivery
  stdin.ts          Stdin reader
  destinations/
    types.ts        Shared types
    factory.ts      Config/CLI → destination builders
    http.ts         HTTP destination
    log.ts          Log file destination
```
