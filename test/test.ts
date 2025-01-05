import { PublicKey } from "@solana/web3.js";
import { createSolanaTools, SolanaAgentKit } from "../src";
import { SolanaSwapFluxBeamTool } from "../src/langchain";
import { swapFluxBeam } from "../src/tools";

const x = async () => {
  const solanaAgent = new SolanaAgentKit(
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    },
  );

  const result = await swapFluxBeam(
    solanaAgent,
    new PublicKey("SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa"),
    0.01,
    new PublicKey("So11111111111111111111111111111111111111112"),
  );

  console.log(result);
};

x();
