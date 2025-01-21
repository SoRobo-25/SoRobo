import { Keypair, PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "../src";
import {
  CreateMintV2,
  fluxbeamBurnToken,
  fluxbeamCreateTokenV1,
  fluxbeamCreateTokenV2,
} from "../src/tools";
import { ExtensionType } from "@solana/spl-token";

const testCreateTokenV2 = async () => {
  const agent = new SolanaAgentKit(
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    },
  );
  // Generate a new keypair for the mint
  const mintKeypair = Keypair.generate();

  // Pass the public key to the function
  //   const tokenMint = mintKeypair.publicKey;

  const signature = await fluxbeamCreateTokenV2(
    agent,
    agent.wallet_address,
    mintKeypair, // we have to pass in the mint keypair to sign the txn not just the mint public key otherwise it says "Missing signature for public key"
    "myV2Flowertoken",
    "MVFT",
    BigInt(100000000000),
    agent.wallet_address,
    agent.wallet_address,
    9,
    true,
    100_000,
    [
      //Also take note that a mint with metadata MUST have the metadata-pointer extension initialized
      {
         type:ExtensionType.MetadataPointer,
         cfg:{}
      },
      {
        type: ExtensionType.TransferFeeConfig,
        cfg: {
          feeBasisPoints: 500, // 5% fee
          maxFee: BigInt(5_000), // Maximum fee in lamports
          transfer_fee_config_authority: agent.wallet_address,
          withdraw_withheld_authority: agent.wallet_address,
        },
      },
      // No additional configuration needed
      {
        type: ExtensionType.InterestBearingConfig,
        cfg: {
          rate: 0.05, // 5% interest rate
        },
      },
    ],
    "this is the first (okay second) token2022 token i'm making",
    undefined,
    undefined,
    "https://gateway.irys.xyz/FUj4bG5fZFfuFC5E6GnnYGAFqcz5wYVHRmhnduc3bAqw",
  );
  console.log(`this is signature for create mint v2 txn ${signature}`);
};

testCreateTokenV2();
