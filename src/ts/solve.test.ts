import { describe, it, expect, beforeAll } from "vitest";
import { AztecAddress } from "@aztec/stdlib/aztec-address";
import { EmbeddedWallet } from "@aztec/wallets/embedded";
import { createAztecNodeClient } from "@aztec/aztec.js/node";
import { registerInitialLocalNetworkAccountsInWallet } from "@aztec/wallets/testing";

import { EasyFlagCaptureContract } from "../artifacts/EasyFlagCapture.js";
import { FlagEmitterContract } from "../artifacts/FlagEmitter.js";

describe("EasyFlagCapture", () => {
  let wallet: EmbeddedWallet;
  let player: AztecAddress;
  let challenge: EasyFlagCaptureContract;
  let flagEmitter: FlagEmitterContract;

  beforeAll(async () => {
    const node = createAztecNodeClient(
      process.env.LOCAL_NETWORK_NODE_URL ?? "http://localhost:8080",
    );
    wallet = await EmbeddedWallet.create(node, {
      pxeConfig: { dataDirectory: "pxe-test", proverEnabled: false },
    });

    [player] = await registerInitialLocalNetworkAccountsInWallet(wallet);

    // Deploy a fresh FlagEmitter and whitelist the challenge for local testing.
    const deployedFlagEmitter = await FlagEmitterContract.deploy(
      wallet,
      player,
    ).send({ from: player });
    flagEmitter = deployedFlagEmitter.contract;

    const deployedChallenge = await EasyFlagCaptureContract.deploy(
      wallet,
      flagEmitter.address,
    ).send({ from: player });
    challenge = deployedChallenge.contract;
    await flagEmitter.methods
      .set_challenge(challenge.address)
      .send({ from: player });
  });

  it("captures the flag", async () => {
    await challenge.methods.capture_flag().send({ from: player });

    expect(
      await flagEmitter.methods
        .is_captured(challenge.address, player)
        .simulate({ from: player }),
    ).toBe(true);
  });
});
