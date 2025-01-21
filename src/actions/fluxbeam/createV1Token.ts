import { z } from "zod";
import { SolanaAgentKit } from "../../agent";
import { fluxbeamCreateTokenV1 } from "../../tools";
import { Action } from "../../types";

// Create Token V1 Action
const fluxbeamCreateV1TokenAction: Action = {
  name: "FLUXBEAM_CREATE_TOKEN_V1_ACTION",
  similes: ["create token v1", "mint new token v1", "initialize token v1"],
  description: "Creates a new SPL token with metadata (v1)",
  examples: [
    [
      {
        input: {
          name: "My Token",
          symbol: "MTK",
          decimals: 9,
          initialSupply: 1000000,
          uri: "https://...",
        },
        output: {
          status: "success",
          signature: "aXw3...",
        },
        explanation: "Create new token with initial supply",
      },
    ],
  ],
  schema: z.object({
    name: z.string(),
    symbol: z.string(),
    decimals: z.number().optional(),
    initialSupply: z.number().optional(),
    imagePath: z.string().optional(),
    uri: z.string().optional(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const signature = await fluxbeamCreateTokenV1(
      agent,
      input.name,
      input.symbol,
      input.decimals,
      input.initialSupply,
      input.imagePath,
      input.uri,
    );
    return {
      status: "success",
      signature,
    };
  },
};

export default fluxbeamCreateV1TokenAction;
