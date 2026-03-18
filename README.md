# EthCC CTF Aztec Boilerplate

Minimal Aztec CTF starter with:

- a shared `FlagEmitter` contract
- one example challenge contract: `easy_flag`
- local tests against an Aztec local network
- testnet scripts for account deployment and solving

## Prerequisites

### System requirements

- **Node.js** `>=22.0.0`
- **Yarn** `>=1.22.0`
- **Aztec CLI** — installs `aztec`, `nargo`, and all related tooling

### Install the Aztec CLI

The recommended way is the official install script. It pins the exact version used by this repo (defined in `package.json` under `config.aztecVersion`):

```bash
VERSION=$(node -p "require('./package.json').config.aztecVersion") \
  bash -i <(curl -sL https://install.aztec.network)
```

Or install a specific version directly:

```bash
VERSION=4.1.0-rc.2 bash -i <(curl -sL https://install.aztec.network)
```

After installation, verify the tools are on your `PATH`:

```bash
aztec --version
```

### Install JS dependencies

```bash
yarn install
```

## Layout

```text
src/nr/flag_emitter/   Shared flag registry and capture checks
src/nr/easy_flag/      Example challenge contract
src/ts/solve.test.ts   Local integration test for the challenge
scripts/deploy_account.ts
scripts/solve.ts
scripts/shared.ts
```

## Build

Compile Noir contracts and regenerate TypeScript artifacts:

```bash
yarn ccc
```

`yarn ccc` runs the full contract build pipeline:

- `yarn clean`
- `yarn compile`
- `yarn codegen`

## Environment

Copy `.env.example` to `.env`.

- `SPONSORED_FPC_SALT`: Sponsored FPC salt used by the testnet scripts
- `ACCOUNT_SECRET_KEY`: private key for your CTF account on testnet
- `TESTNET_NODE_URL` `(*)`: testnet RPC URL used by scripts. Defaults to Aztec public testnet RPC.
- `LOCAL_NETWORK_NODE_URL` `(*)`: local network RPC URL used by tests. Defaults to `http://localhost:8080`.

> _`(*)` means optional._

## Local Testing

### 1. Start the local network

In a separate terminal, start the Aztec sandbox. This spins up a local Aztec node, sequencer, and PXE on `http://localhost:8080`:

```bash
aztec start --local-network
```

Wait until you see `Aztec Server listening on port 8080` (or similar) before running tests.

### 2. Run the tests

Run both Noir unit tests and TypeScript integration tests:

```bash
yarn test
```

Run only the Noir tests:

```bash
yarn test:nr
```

Run only the TypeScript integration tests (against the local network):

```bash
yarn test:js
```

The TypeScript tests connect to `http://localhost:8080` by default. Override via the `LOCAL_NETWORK_NODE_URL` environment variable if your sandbox is running elsewhere:

```bash
LOCAL_NETWORK_NODE_URL=http://localhost:9090 yarn test:js
```

## Testnet Scripts

Deploy your Schnorr account:

```bash
yarn deploy-account
```

Run the example solve script:

```bash
yarn solve
```

The shared script helpers automatically:

- create the embedded wallet
- derive the player account from `.env`
- register the Sponsored FPC
- expose the common `FlagEmitter` address

## Notes For New Challenges

When adding a challenge:

1. Add the Noir contract under `src/nr/`
2. Regenerate artifacts with `yarn ccc`
3. Add a local integration test in `src/ts/`
4. Add a dedicated solve script under `scripts/`

Keep common script logic in `scripts/shared.ts`; keep per-challenge logic inside each solve script.

## License

MIT. See `LICENSE`.
