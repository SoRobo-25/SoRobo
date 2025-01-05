import { PublicKey } from "@solana/web3.js";
import { Action } from "../types/action";
import { SolanaAgentKit } from "../agent";
import { z } from "zod";
import { swapFluxBeam } from "../tools";

export const fluxbeamSwapAction: Action = {
  name: "FLUXBEAM_SWAP",
  similes: [
    "swap tokens on fluxbeam",
    "exchange tokens using fluxbeam",
    "trade on fluxbeam",
    "convert tokens via fluxbeam",
    "use fluxbeam dex",
  ],
  description: `This tool allows you to swap tokens using the FluxBeam DEX on Solana.`,
  examples: [
    [
      {
        input: {
          outputMint: "So11111111111111111111111111111111111111112",
          inputAmount: 100,
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        },
        output: {
          status: "success",
          message: "Swap executed successfully on FluxBeam",
          transaction:
            "3KvgJ5vVZxUxefDGqzqkVLHzHxVTyYH9StYyHKgvHYmXJgqJKxEqy9k4Rz9LpXrHF9kUZB7",
          inputAmount: 100,
          inputToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          outputToken: "So11111111111111111111111111111111111111112",
        },
        explanation: "Swap 100 USDC for SOL using FluxBeam DEX",
      },
    ],
    [
      {
        input: {
          outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          inputAmount: 1,
          slippageBps: 100,
        },
        output: {
          status: "success",
          message: "Swap executed successfully on FluxBeam",
          transaction:
            "2UfgJ5vVZxUxefDGqzqkVLHzHxVTyYH9StYyHKgvHYmXJgqJKxEqy9k4Rz9LpXrHF9kUZB7",
          inputAmount: 1,
          inputToken: "SOL",
          outputToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        },
        explanation: "Swap 1 SOL for USDC with 1% slippage on FluxBeam",
      },
    ],
  ],
  schema: z.object({
    outputMint: z.string().min(32, "Invalid output mint address"),
    inputAmount: z.number().positive("Input amount must be positive"),
    inputMint: z.string().min(32, "Invalid input mint address").optional(),
    slippageBps: z.number().min(0).max(10000).optional(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    try {
      const tx = await swapFluxBeam(
        agent,
        new PublicKey(input.outputMint),
        input.inputAmount,
        input.inputMint ? new PublicKey(input.inputMint) : undefined,
        input.slippageBps,
      );

      return {
        status: "success",
        message: "Swap executed successfully on FluxBeam",
        transaction: tx,
        inputAmount: input.inputAmount,
        inputToken: input.inputMint || "SOL",
        outputToken: input.outputMint,
      };
    } catch (error: any) {
      return {
        status: "error",
        message: `FluxBeam swap failed: ${error.message}`,
        error: error.message,
      };
    }
  },
};
