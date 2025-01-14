import { z } from "zod";
import { SolanaAgentKit } from "../../agent";
import { fluxbeamWrapSOL } from "../../tools";
import { Action } from "../../types";

// Wrap SOL Action
const wrapSolAction: Action = {
  name: "WRAP_SOL_ACTION",
  similes: ["wrap SOL", "convert SOL to wSOL", "get wrapped SOL"],
  description: "Wraps native SOL into wrapped SOL (wSOL)",
  examples: [
    [
      {
        input: {
          amount: 1,
        },
        output: {
          status: "success",
          signature: "cZy5...",
        },
        explanation: "Wrap 1 SOL into wSOL",
      },
    ],
  ],
  schema: z.object({
    amount: z.number().positive(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const signature = await fluxbeamWrapSOL(agent, input.amount);
    return {
      status: "success",
      signature,
    };
  },
};

export default wrapSolAction;
