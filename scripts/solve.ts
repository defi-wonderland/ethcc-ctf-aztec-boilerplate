/**
 * Sample solution for the EasyFlagCapture challenge on Aztec testnet.
 *
 * Prerequisites:
 *   1. yarn ccc            — compile contracts and generate artifacts
 *   2. yarn deploy-account — deploy your account on testnet (once only)
 *
 * Usage:
 *   yarn solve
 */
import { Fr } from "@aztec/aztec.js/fields";
import { SponsoredFeePaymentMethod } from "@aztec/aztec.js/fee";
import { getContractInstanceFromInstantiationParams } from "@aztec/stdlib/contract";

import {
  EasyFlagCaptureContract,
  EasyFlagCaptureContractArtifact,
} from "../src/artifacts/EasyFlagCapture.js";
import {
  FLAG_EMITTER_ADDRESS,
  TESTNET_GAS_SETTINGS,
  createPlayerContext,
  isChallengeCaptured,
} from "./shared.js";
import { AztecAddress } from "@aztec/stdlib/aztec-address";

const { wallet, player, sponsoredFpcAddress } = await createPlayerContext();

// Infer the shared challenge instance from its deployment parameters.
const challengeInstance = await getContractInstanceFromInstantiationParams(
  EasyFlagCaptureContractArtifact,
  {
    constructorArgs: [FLAG_EMITTER_ADDRESS],
    deployer: AztecAddress.ZERO,
    salt: Fr.ZERO,
  },
);
await wallet.registerContract(
  challengeInstance,
  EasyFlagCaptureContractArtifact,
);
const { address: challengeAddress } = challengeInstance;

const challenge = EasyFlagCaptureContract.at(challengeAddress, wallet);

console.log(`player    = ${player.toString()}`);
console.log(`challenge = ${challengeAddress.toString()}`);
console.log(`emitter   = ${FLAG_EMITTER_ADDRESS.toString()}`);

const paymentMethod = new SponsoredFeePaymentMethod(sponsoredFpcAddress);

await challenge.methods.capture_flag().send({
  from: player,
  fee: { paymentMethod, gasSettings: TESTNET_GAS_SETTINGS },
});

const captured = await isChallengeCaptured(wallet, challengeAddress, player);
console.log(`captured  = ${captured}`);
