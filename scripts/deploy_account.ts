/**
 * Deploy a Schnorr account on testnet, fees paid by a SponsoredFPC.
 * Run once before using `yarn solve`.
 *
 * Usage:
 *   cp .env.example .env   # fill in ACCOUNT_SECRET_KEY
 *   yarn deploy-account
 */
import { NO_FROM } from "@aztec/aztec.js/account";
import { SponsoredFeePaymentMethod } from "@aztec/aztec.js/fee";

import { TESTNET_GAS_SETTINGS, createPlayerContext } from "./shared.js";

async function main() {
  const { account, sponsoredFpcAddress } = await createPlayerContext();

  const address = account.address;
  console.log(`Deploying account ${address.toString()} ...`);

  const paymentMethod = new SponsoredFeePaymentMethod(sponsoredFpcAddress);
  const deployMethod = await account.getDeployMethod();
  await deployMethod.send({
    from: NO_FROM,
    fee: { paymentMethod, gasSettings: TESTNET_GAS_SETTINGS },
  });

  console.log(`Deployed account ${address.toString()}`);
}

await main().catch((error: unknown) => {
  console.error("Failed to deploy account:", error);
  process.exitCode = 1;
});
