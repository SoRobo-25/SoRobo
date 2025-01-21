import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { SolanaAgentKit } from "../../agent";
import { fluxbeamUpdateV2Metadata } from "../../tools";
import { Action } from "../../types";

export const fluxbeamUpdateV2TokenMetadataAction: Action = {
  name: "FLUXBEAM_UPDATE_V2_METADATA_ACTION",
  similes: [
    "update token2022 metadata",
    "change token v2 details",
    "modify token2022 information",
    "edit token v2 metadata",
    "update token2022 fields",
  ],
  description: `Updates the metadata of a token v2 (token2022) token. Can update name, symbol, URI, 
                and update authority. All fields are optional but requires priority fee. 
                Requires current update authority permission.`,
  examples: [
    [
      {
        input: {
          mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
          priorityFee: 100000,
          newName: "New Token Name",
          newSymbol: "NTN",
          newUri: "https://arweave.net/newmetadata.json",
          newUpdateAuthority: "NewAuthorityAddress123",
        },
        output: {
          status: "success",
          signature: "transaction_signature_here",
        },
        explanation:
          "Update all metadata fields and authority for a token v2 token",
      },
      {
        input: {
          mint: "TokenMintAddress123",
          priorityFee: 50000,
          newName: "New Token Name",
        },
        output: {
          status: "success",
          signature: "transaction_signature_here",
        },
        explanation: "Update only the name field for a token v2 token",
      },
    ],
  ],
  schema: z.object({
    mint: z.string(),
    priorityFee: z.number(),
    newName: z.string().optional(),
    newSymbol: z.string().optional(),
    newUri: z.string().optional(),
    newUpdateAuthority: z.string().optional(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const signature = await fluxbeamUpdateV2Metadata(
      agent,
      new PublicKey(input.mint),
      input.priorityFee,
      input.newName,
      input.newSymbol,
      input.newUri,
      input.newUpdateAuthority
        ? new PublicKey(input.newUpdateAuthority)
        : undefined,
    );
    return {
      status: "success",
      signature,
    };
  },
};

export default fluxbeamUpdateV2TokenMetadataAction;
