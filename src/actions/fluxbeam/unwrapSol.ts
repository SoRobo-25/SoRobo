import { z } from "zod";
import { SolanaAgentKit } from "../../agent";
import { fluxbeamUnwrapSOL } from "../../tools";
import { Action } from "../../types";

// Unwrap SOL Action
const unwrapSolAction: Action = {
  name: "UNWRAP_SOL_ACTION",
  similes: ["unwrap SOL", "convert wSOL to SOL", "get native SOL"],
  description: "Unwraps wSOL back to native SOL",
  examples: [
    [
      {
        input: {},
        output: {
          status: "success",
          signature: "dAz6...",
        },
        explanation: "Unwrap all wSOL to native SOL",
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: SolanaAgentKit) => {
    const signature = await fluxbeamUnwrapSOL(agent);
    return {
      status: "success",
      signature,
    };
  },
};

export default unwrapSolAction;
