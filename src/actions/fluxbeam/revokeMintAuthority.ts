import { AuthorityType } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { SolanaAgentKit } from "../../agent";
import { fluxbeamRevokeAuthority } from "../../tools/fluxbeam/fluxbeam_token_minting_controls";
import { Action } from "../../types";

// Revoke Authority Action
const revokeAuthorityAction: Action = {
  name: "REVOKE_AUTHORITY_ACTION",
  similes: [
    "remove authority",
    "revoke token authority",
    "remove token permissions",
  ],
  description: "Revokes an authority from a token mint by setting it to null",
  examples: [
    [
      {
        input: {
          owner: "EPjFW...",
          mint: "So11...",
          authority: "MintTokens",
          v2: true,
          priorityFee: 100000000,
        },
        output: {
          status: "success",
          signature: "eBy7...",
        },
        explanation: "Revoke mint authority from token",
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
    v2: z.boolean().optional(),
    priorityFee: z.number().optional(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const signature = await fluxbeamRevokeAuthority(
      agent,
      new PublicKey(input.owner),
      new PublicKey(input.mint),
      input.authority as AuthorityType,
      input.v2,
      input.priorityFee,
    );
    return {
      status: "success",
      signature,
    };
  },
};

export default revokeAuthorityAction;
