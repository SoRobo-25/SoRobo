import { PublicKey } from "@solana/web3.js";
import { Action } from "../../types/action";
import { SolanaAgentKit } from "../../agent";
import { z } from "zod";
import { fluxBeamSwap } from "../../tools";

const fluxbeamSwapTokenAction: Action = {
  name: "FLUXBEAM_SWAP_TOKEN_ACTION",
  similes: [
    "swap tokens on fluxbeam",
    "exchange tokens",
    "trade on fluxbeam",
    "convert token A to token B",
  ],
  description: `Swaps one token for another using the FluxBeam DEX.
  Specify the input token, output token, amount, and optional slippage tolerance.`,
  examples: [
    [
      {
        input: {
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          outputMint: "So11111111111111111111111111111111111111112",
          inputAmount: 500,
          slippageBps: 300,
        },
        output: {
          status: "success",
          signature: "5TgK9...",
        },
        explanation: "Swap 500 USDC for SOL with a 3% slippage tolerance",
      },
    ],
  ],
  schema: z.object({
    inputMint: z.string(),
    outputMint: z.string(),
    inputAmount: z.number(),
    slippageBps: z.number().optional(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const signature = await fluxBeamSwap(
      agent,
      new PublicKey(input.inputMint),
      new PublicKey(input.outputMint),
      input.inputAmount,
      input.slippageBps ?? 300, // Default slippage to 3%
    );

    return {
      status: "success",
      signature,
    };
  },
};

export default fluxbeamSwapTokenAction;
