import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { SolanaAgentKit } from "../../agent";
import { fluxbeamUpdateV1Metadata } from "../../tools";
import { Action } from "../../types";

export const fluxbeamUpdateV1TokenMetadataAction: Action = {
  name: "FLUXBEAM_UPDATE_V1_METADATA_ACTION",
  similes: [
    "update token metadata",
    "change token details",
    "modify token v1 metadata",
    "edit token information",
    "update token v1 details",
  ],
  description: `Updates the metadata of a token v1 asset, including name, symbol, and URI. 
                Requires update authority permission.`,
  examples: [
    [
      {
        input: {
          mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
          newName: "Updated Token Name",
          newSymbol: "UTN",
          newUri: "https://arweave.net/newmetadata.json",
        },
        output: {
          status: "success",
          signature: "transaction_signature_here",
        },
        explanation: "Update all metadata fields for a token v1 asset",
      },
    ],
  ],
  schema: z.object({
    mint: z.string(),
    newName: z.string(),
    newSymbol: z.string(),
    newUri: z.string(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const signature = await fluxbeamUpdateV1Metadata(
      agent,
      new PublicKey(input.mint),
      input.newName,
      input.newSymbol,
      input.newUri,
    );
    return {
      status: "success",
      signature,
    };
  },
};

export default fluxbeamUpdateV1TokenMetadataAction;
