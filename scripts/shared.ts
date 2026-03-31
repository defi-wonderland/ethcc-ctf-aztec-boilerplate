import "dotenv/config";

import { AztecAddress } from "@aztec/aztec.js/addresses";
import { Fr } from "@aztec/aztec.js/fields";
import { getContractInstanceFromInstantiationParams } from "@aztec/stdlib/contract";
import { createAztecNodeClient, waitForNode } from "@aztec/aztec.js/node";
import { type Wallet } from "@aztec/aztec.js/wallet";
import { EmbeddedWallet } from "@aztec/wallets/embedded";
import { SponsoredFPCContract } from "@aztec/noir-contracts.js/SponsoredFPC";
import { GasFees, GasSettings } from "@aztec/stdlib/gas";

import { FlagEmitterContract } from "../src/artifacts/FlagEmitter.js";

export interface WalletContextOptions {
  nodeUrl?: string;
  pxeDataDirectory?: string;
  proverEnabled?: boolean;
}

export interface WalletContext {
  wallet: EmbeddedWallet;
  node: ReturnType<typeof createAztecNodeClient>;
}

export interface PlayerContext extends WalletContext {
  account: Awaited<ReturnType<EmbeddedWallet["createSchnorrAccount"]>>;
  player: AztecAddress;
  sponsoredFpcAddress: AztecAddress;
}

export const TESTNET_NODE_URL =
  process.env.TESTNET_NODE_URL ?? "https://rpc.testnet.aztec-labs.com/";
export const TESTNET_PXE_DATA_DIRECTORY = "pxe-testnet";

export async function createWalletContext(
  opts: WalletContextOptions = {},
): Promise<WalletContext> {
  const node = createAztecNodeClient(opts.nodeUrl ?? TESTNET_NODE_URL);
  await waitForNode(node);
  const wallet = await EmbeddedWallet.create(node, {
    pxeConfig: {
      dataDirectory: opts.pxeDataDirectory ?? TESTNET_PXE_DATA_DIRECTORY,
      proverEnabled: opts.proverEnabled ?? true,
    },
  });
  return { wallet, node };
}

export function getSecretKey(): Fr {
  const secretKey = process.env.ACCOUNT_SECRET_KEY;
  if (!secretKey) throw new Error("ACCOUNT_SECRET_KEY is not set");
  return Fr.fromHexString(secretKey);
}

export async function createPlayerContext(
  opts: WalletContextOptions = {},
): Promise<PlayerContext> {
  const { wallet, node } = await createWalletContext(opts);
  const account = await wallet.createSchnorrAccount(getSecretKey(), Fr.ZERO);
  const sponsoredFpcAddress = await registerSponsoredFPC(wallet);
  return {
    wallet,
    node,
    account,
    player: account.address,
    sponsoredFpcAddress,
  };
}

export function getFlagEmitterAddress(): AztecAddress {
  const address = process.env.FLAG_EMITTER_ADDRESS;
  if (!address) throw new Error("FLAG_EMITTER_ADDRESS is not set");
  return AztecAddress.fromString(address);
}

// Same address across all challenges on this network.
export const FLAG_EMITTER_ADDRESS = getFlagEmitterAddress();

export async function isChallengeCaptured(
  wallet: Wallet,
  challengeAddress: AztecAddress,
  player: AztecAddress,
): Promise<boolean> {
  const flagEmitter = FlagEmitterContract.at(FLAG_EMITTER_ADDRESS, wallet);
  const { result } = await flagEmitter.methods
    .is_captured(challengeAddress, player)
    .simulate({ from: player });
  return result;
}

export function getSponsoredFpcSalt(): Fr {
  const salt = process.env.SPONSORED_FPC_SALT?.trim();
  if (!salt) throw new Error("SPONSORED_FPC_SALT is not set");

  try {
    return Fr.fromHexString(salt);
  } catch {
    throw new Error("SPONSORED_FPC_SALT is invalid");
  }
}

export async function registerSponsoredFPC(
  wallet: EmbeddedWallet,
): Promise<AztecAddress> {
  const instance = await getContractInstanceFromInstantiationParams(
    SponsoredFPCContract.artifact,
    {
      salt: getSponsoredFpcSalt(),
    },
  );

  await wallet.registerContract(instance, SponsoredFPCContract.artifact);
  return instance.address;
}

/**
 * Builds dynamic testnet gas settings from the node's current minimum fees.
 * We set `maxPriorityFeesPerGas` equal to `maxFeesPerGas` so sponsored
 * transactions stay aggressively priceable on busy testnet conditions.
 */
export async function getDynamicTestnetGasSettings(
  node: ReturnType<typeof createAztecNodeClient>,
): Promise<GasSettings> {
  const currentMinFees = await node.getCurrentMinFees();
  const maxFeesPerGas = currentMinFees.mul(2n);
  return GasSettings.default({
    maxFeesPerGas,
    maxPriorityFeesPerGas: maxFeesPerGas,
  });
}
