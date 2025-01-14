import { PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "../src";
import { fluxBeamCreatePool } from "../src/tools";
import { TOKENS } from "../src/constants";

(async () => {
  // Initialize SolanaAgentKit instance
  const solanaAgent = new SolanaAgentKit(
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    },
  );

  const tokenA = TOKENS.SOL; // SOL token
  const tokenB = TOKENS.USDC; 
  const tokenAAmount = 0.001; // 1 token A
  const tokenBAmount = 0.1; // 100 token B

    // Call the function
    const signature = await fluxBeamCreatePool(
      solanaAgent,
      tokenA,
      tokenAAmount,
      tokenB,
      tokenBAmount,
    );

    // Log the result
    console.log("Pool created successfully! Transaction signature:", signature);
})();
