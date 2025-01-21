import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import { SolanaAgentKit } from "../src";
import { fluxBeamSwap } from "../src/tools";
import { TOKENS } from "../src/constants";

(async () => {
  const solanaAgent = new SolanaAgentKit(
      process.env.SOLANA_PRIVATE_KEY!,
      process.env.RPC_URL!,
      {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
      },
    );

  // Test parameters
  const inputMint = new PublicKey("So11111111111111111111111111111111111111112"); 
  const outputMint = new PublicKey(
    "FLUXBmPhT3Fd1EDVFdg46YREqHBeNypn1h4EbnTzWERX",
  );
  const inputAmount = 0.003; // Amount in token decimals (e.g., 1 USDC = 1)
  const slippageBps = 200; // Slippage tolerance in basis points (2%)

    // Call fluxBeamSwap with test parameters
    const result = await fluxBeamSwap(
      solanaAgent,
      inputMint,
      outputMint,
      inputAmount,
      slippageBps,
    );

    console.log("Swap successful, signature:", result);
})();
