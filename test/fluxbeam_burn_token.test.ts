import { PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "../src";
import { fluxbeamBurnToken } from "../src/tools";


const testBurnTokenControls = async () => {
  const agent = new SolanaAgentKit(
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    },
  );

  const mint = new PublicKey("6DdtiLQc3519D6tyCQQphcszZtRf5ZEhichUFvJjvJc2");
  const signature3 = await fluxbeamBurnToken(
    agent,
    mint,
    50000000000
  )
  console.log(`this is signature for burn token method txn${signature3}`);
};

// createMintToken()
testBurnTokenControls()
