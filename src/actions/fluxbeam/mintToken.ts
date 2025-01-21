import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { SolanaAgentKit } from "../../agent";
import { fluxbeamMintToAccount } from "../../tools";
import { Action } from "../../types";

const fluxbeamMintToAccountAction: Action = {
  name: "MINT_TO_ACCOUNT_ACTION",
  similes: [
    "mint tokens",
    "create new tokens",
    "issue tokens",
    "mint to wallet",
    "add tokens to account",
  ],
  description: `Mints tokens to a specified owner's associated token account. 
  If the associated token account doesn't exist, it will be created automatically.
  Supports both regular SPL tokens and Token-2022 tokens.`,
  examples: [
    [
      {
        input: {
          owner: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          tokenMint: "So11111111111111111111111111111111111111112",
          amount: "1000000",
          v2: true,
        },
        output: {
          status: "success",
          signature:
            "5KtP9KbhJsBzS3rSXWqtqwtSJJNgfQFJxVdNCsM5QrUMBUEHrm28GU7dw7v6vh1CyCygtZhptVHhHgywY34iDtYf",
        },
        explanation:
          "Mint 1 token (with 6 decimals) to owner's associated token account using Token-2022 program",
      },
      {
        input: {
          owner: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          tokenMint: "So11111111111111111111111111111111111111112",
          amount: "1000000",
          v2: false,
        },
        output: {
          status: "success",
          signature:
            "5KtP9KbhJsBzS3rSXWqtqwtSJJNgfQFJxVdNCsM5QrUMBUEHrm28GU7dw7v6vh1CyCygtZhptVHhHgywY34iDtYf",
        },
        explanation:
          "Mint 1 token (with 6 decimals) to owner's associated token account using regular SPL Token program",
      },
    ],
  ],
  schema: z.object({
    owner: z.string().refine((val) => {
      try {
        new PublicKey(val);
        return true;
      } catch {
        return false;
      }
    }, "Invalid owner public key"),
    tokenMint: z.string().refine((val) => {
      try {
        new PublicKey(val);
        return true;
      } catch {
        return false;
      }
    }, "Invalid token mint public key"),
    amount: z
      .string()
      .or(z.number())
      .transform((val) => BigInt(val)),
    v2: z.boolean().optional().default(true),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    try {
      const signature = await fluxbeamMintToAccount(
        agent,
        new PublicKey(input.owner),
        new PublicKey(input.tokenMint),
        BigInt(input.amount),
        input.v2,
      );

      return {
        status: "success",
        signature,
      };
    } catch (error: any) {
      return {
        status: "error",
        error: `Failed to mint tokens: ${error.message}`,
      };
    }
  },
};

export default fluxbeamMintToAccountAction;
