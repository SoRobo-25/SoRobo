import { Action } from "../../../types/action";
import { SolanaAgentKit } from "../../../agent";
import { z } from "zod";
import { createNonTransferableTokenMint } from "../../../tools";

const createNonTransferableMintAction: Action = {
  name: "CREATE_NON_TRANSFERABLE_MINT",
  similes: [
    "create non-transferable token",
    "create non transferable NFT",
    "initialize non-transferable mint",
    "mint non-transferable tokens",
  ],
  description: `Create a non-transferable token mint with specified decimals and metadata.`,
  examples: [
    [
      {
        input: {
          decimals: 9,
          tokenName: "My Non-Transferable Token",
          tokenSymbol: "MNT",
          uri: "https://example.com/token-metadata",
          additionalMetadata: [["customField1", "customValue1"]],
        },
        output: {
          status: "success",
          message: "Non-transferable mint created successfully",
          mint: "8z1FnrcutaAmNZ57wbAb6fqNNBcTiMQWRZQb3sg8cYkv",
          transaction:
            "2Skosa48ky13c2qC6fqAPbNLDP29hUk16J9BTKhs32mgoeLSZKudSyexywacQfRXvq4Hj8WFUX1bcQWtSYa7sW2n",
        },
        explanation:
          "Create a non-transferable token mint with 9 decimals and metadata",
      },
    ],
  ],
  schema: z.object({
    decimals: z
      .number()
      .int()
      .nonnegative("Decimals must be a non-negative integer"),
    tokenName: z.string().min(1, "Token name is required"),
    tokenSymbol: z.string().min(1, "Token symbol is required"),
    uri: z.string().url("URI must be a valid URL"),
    additionalMetadata: z.array(z.tuple([z.string(), z.string()])).optional(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const decimals = input.decimals;
    const tokenName = input.tokenName;
    const tokenSymbol = input.tokenSymbol;
    const uri = input.uri;
    const additionalMetadata = input.additionalMetadata || [];

    const { mint, signature } = await createNonTransferableTokenMint(
      agent,
      decimals,
      tokenName,
      tokenSymbol,
      uri,
      additionalMetadata,
    );

    return {
      status: "success",
      message: "Non-transferable mint created successfully",
      mint: mint.toString(),
      transaction: signature,
    };
  },
};

export default createNonTransferableMintAction;
