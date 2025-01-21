import { Keypair, PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { SolanaAgentKit } from "../../agent";
import { ExtensionConfig, fluxbeamCreateTokenV2 } from "../../tools";
import { Action } from "../../types";

// Create V2 Token Action (continued)
const fluxbeamCreateV2TokenAction: Action = {
  name: "FLUXBEAM_CREATE_MINT_V2_ACTION",
  similes: ["create token v2", "mint new token v2", "initialize token v2"],
  description: "Creates a new Token-2022 token with extensions",
  examples: [
    [
      {
        input: {
          owner: "EPjFW...",
          tokenMint: new Keypair(),
          name: "My Token V2",
          symbol: "MTK2",
          totalSupply: BigInt("1000000"),
          mintAuthority: "EPjFW...",
          freezeAuthority: null,
          decimals: 6,
          extensions: [],
          priorityFee: 100000,
          description: "My token description",
          metadataUri: "https://...",
        },
        output: {
          status: "success",
          signature: "bYx4...",
        },
        explanation: "Create new token-2022 token with extensions",
      },
    ],
  ],
  schema: z.object({
    owner: z.string(),
    tokenMint: z.instanceof(Keypair),
    name: z.string(),
    symbol: z.string(),
    totalSupply: z.bigint(),
    mintAuthority: z.string(),
    freezeAuthority: z.string().nullable(),
    decimals: z.number().optional(),
    mintTotalSupply: z.boolean().optional(),
    priorityFee: z.number(),
    extensions: z.array(z.custom<ExtensionConfig>()),
    description: z.string().optional(),
    metadataUri: z.string().optional(),
    imagePath: z.string().optional(),
    imageUri: z.string().optional(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const signature = await fluxbeamCreateTokenV2(
      agent,
      new PublicKey(input.owner),
      input.tokenMint,
      input.name,
      input.symbol,
      input.totalSupply,
      new PublicKey(input.mintAuthority),
      input.freezeAuthority ? new PublicKey(input.freezeAuthority) : null,
      input.decimals,
      input.mintTotalSupply,
      input.priorityFee,
      input.extensions,
      input.description,
      input.metadataUri,
      input.imagePath,
      input.imageUri,
    );
    return {
      status: "success",
      signature,
    };
  },
};

export default fluxbeamCreateV2TokenAction;
