import { PublicKey } from "@solana/web3.js";
import { Action } from "../../../types/action";
import { SolanaAgentKit } from "../../../agent";
import { z } from "zod";
import { mint_token2022 } from "../../../tools";

const mintToken2022Action: Action = {
  name: "MINT_TOKEN_2022",
  similes: [
    "mint new tokens",
    "create tokens",
    "issue tokens",
    "generate tokens",
  ],
  description: `Mint a Token 2022 to a specified destination address.`,
  examples: [
    [
      {
        input: {
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          destination: "8x2dR8Mpzuz2YqyZyZjUbYWKSWesBo5jMx2Q9Y86udVk",
          decimals: 6,
          amount: 100,
        },
        output: {
          status: "success",
          message: "Minting completed successfully",
          amount: 100,
          recipient: "8x2dR8Mpzuz2YqyZyZjUbYWKSWesBo5jMx2Q9Y86udVk",
          token: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          transaction:
            "5UfgJ5vVZxUxefDGqzqkVLHzHxVTyYH9StYyHKgvHYmXJgqJKxEqy9k4Rz9LpXrHF9kUZB7",
        },
        explanation: "Mint 100 tokens to the recipient address",
      },
    ],
    [
      {
        input: {
          mint: "8z1FnrcutaAmNZ57wbAb6fqNNBcTiMQWRZQb3sg8cYkv",
          destination: "EXBdeRCdiNChKyD7akt64n9HgSXEpUtpPEhmbnm4L6iH",
          decimals: 9,
          amount: 1,
        },
        output: {
          status: "success",
          message: "Minting completed successfully",
          amount: 1,
          recipient: "EXBdeRCdiNChKyD7akt64n9HgSXEpUtpPEhmbnm4L6iH",
          token: "8z1FnrcutaAmNZ57wbAb6fqNNBcTiMQWRZQb3sg8cYkv",
          transaction:
            "3UfgJ5vVZxUxefDGqzqkVLHzHxVTyYH9StYyHKgvHYmXJgqJKxEqy9k4Rz9LpXrHF9kUZB7",
        },
        explanation: "Mint 1 token to the recipient address with 9 decimals",
      },
    ],
  ],
  schema: z.object({
    mint: z.string().min(32, "Invalid mint address"),
    destination: z.string().min(32, "Invalid destination address"),
    decimals: z
      .number()
      .int()
      .nonnegative("Decimals must be a non-negative integer"),
    amount: z.number().positive("Amount must be positive").optional(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const mintAddress = new PublicKey(input.mint);
    const destinationAddress = new PublicKey(input.destination);
    const decimals = input.decimals;
    const amount = input.amount || 1;

    const tx = await mint_token2022(
      agent,
      mintAddress,
      destinationAddress,
      decimals,
      amount,
    );

    return {
      status: "success",
      message: "Minting completed successfully",
      amount: amount,
      recipient: input.destination,
      token: input.mint,
      transaction: tx,
    };
  },
};

export default mintToken2022Action;
