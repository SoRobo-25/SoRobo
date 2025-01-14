import { PublicKey } from "@solana/web3.js";
import { Action } from "../../types/action";
import { SolanaAgentKit } from "../../agent";
import { z } from "zod";
import { fluxBeamCreatePool } from "../../tools";

const createPoolAction: Action = {
  name: "CREATE_POOL_ACTION",
  similes: [
    "create liquidity pool",
    "start pool",
    "initialize pool",
    "new trading pool",
    "setup token pool",
  ],
  description: `Creates a new liquidity pool on Fluxbeam with two tokens.
  Specify the token addresses and initial amounts to provide liquidity.`,
  examples: [
    [
      {
        input: {
          tokenA: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          tokenAAmount: 1000,
          tokenB: "So11111111111111111111111111111111111111112",
          tokenBAmount: 5,
        },
        output: {
          status: "success",
          signature: "3xKm2p...",
        },
        explanation: "Create a USDC-SOL pool with initial liquidity",
      },
    ],
  ],
  schema: z.object({
    tokenA: z.string(),
    tokenAAmount: z.number(),
    tokenB: z.string(),
    tokenBAmount: z.number(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const signature = await fluxBeamCreatePool(
      agent,
      new PublicKey(input.tokenA),
      input.tokenAAmount,
      new PublicKey(input.tokenB),
      input.tokenBAmount,
    );

    return {
      status: "success",
      signature,
    };
  },
};

export default createPoolAction;
