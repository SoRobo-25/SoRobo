import { AuthorityType } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { SolanaAgentKit } from "../../agent";
import { fluxbeamSetAuthority } from "../../tools/fluxbeam/fluxbeam_token_minting_controls";
import { Action } from "../../types";

// Set Authority Action
const setAuthorityAction: Action = {
  name: "SET_AUTHORITY_ACTION",
  similes: ["change authority", "update authority", "modify authority"],
  description: "Sets a new authority for a token mint",
  examples: [
    [
      {
        input: {
          owner: "EPjFW...",
          mint: "So11...",
          authority: "MintTokens",
          newAuthority: "NewAu...",
          v2: true,
          priorityFee: 100000000,
        },
        output: {
          status: "success",
          signature: "6nSt9...",
        },
        explanation: "Update mint authority",
      },
    ],
  ],
  schema: z.object({
    owner: z.string(),
    mint: z.string(),
    authority: z.enum([
      "MintTokens",
      "FreezeAccount",
      "AccountOwner",
      "CloseAccount",
    ]),
    newAuthority: z.string().nullable(),
    v2: z.boolean().optional(),
    priorityFee: z.number().optional(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const signature = await fluxbeamSetAuthority(
      agent,
      new PublicKey(input.owner),
      new PublicKey(input.mint),
      input.authority as AuthorityType,
      input.newAuthority ? new PublicKey(input.newAuthority) : null,
      input.v2,
      input.priorityFee,
    );
    return {
      status: "success",
      signature,
    };
  },
};

export default setAuthorityAction;
