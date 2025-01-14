import { PublicKey } from "@solana/web3.js";
import { Action } from "../../types/action";
import { SolanaAgentKit } from "../../agent";
import { z } from "zod";
import { fluxbeamBurnToken } from "../../tools";

const burnTokenAction: Action = {
  name: "BURN_TOKEN_ACTION",
  similes: [
    "burn tokens",
    "destroy tokens",
    "remove tokens",
    "burn crypto",
    "reduce supply",
  ],
  description: `Burns a specified amount of tokens from your wallet.
  Can be used with both Token Program v1 and v2 tokens.`,
  examples: [
    [
      {
        input: {
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          amount: 100,
          v2: true,
        },
        output: {
          status: "success",
          signature: "2ZqD4f...",
        },
        explanation: "Burn 100 tokens from the specified mint",
      },
    ],
  ],
  schema: z.object({
    mint: z.string(),
    amount: z.number(),
    v2: z.boolean().optional().default(true),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const signature = await fluxbeamBurnToken(
      agent,
      new PublicKey(input.mint),
      input.amount,
      input.v2,
    );

    return {
      status: "success",
      signature,
    };
  },
};

export default burnTokenAction;
