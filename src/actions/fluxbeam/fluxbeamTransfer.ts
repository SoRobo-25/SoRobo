import { PublicKey } from "@solana/web3.js";
import { Action } from "../../types/action";
import { SolanaAgentKit } from "../../agent";
import { z } from "zod";
import { fluxbeamTransferSplToken, fluxbeamTransferSol } from "../../tools";

const transferAction: Action = {
  name: "TRANSFER_ACTION",
  similes: [
    "transfer tokens",
    "send tokens",
    "send SOL",
    "transfer SOL",
    "send money",
  ],
  description: `Transfer SOL or SPL tokens to another wallet.
  For SPL tokens, specify the mint address. For SOL transfers, just provide the amount.`,
  examples: [
    [
      {
        input: {
          type: "spl",
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          destination: "5KLm2...",
          amount: 100,
          v2: true,
        },
        output: {
          status: "success",
          signature: "5nKm4p...",
        },
        explanation: "Transfer 100 USDC tokens to another wallet",
      },
      {
        input: {
          type: "sol",
          destination: "5KLm2...",
          amount: 1.5,
        },
        output: {
          status: "success",
          signature: "6pNn3q...",
        },
        explanation: "Transfer 1.5 SOL to another wallet",
      },
    ],
  ],
  schema: z.union([
    z.object({
      type: z.literal("spl"),
      mint: z.string(),
      destination: z.string(),
      amount: z.number(),
      v2: z.boolean().optional().default(true),
    }),
    z.object({
      type: z.literal("sol"),
      destination: z.string(),
      amount: z.number(),
    }),
  ]),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    let signature: string;

    if (input.type === "spl") {
      signature = await fluxbeamTransferSplToken(
        agent,
        new PublicKey(input.mint),
        new PublicKey(input.destination),
        input.amount,
        input.v2,
      );
    } else {
      signature = await fluxbeamTransferSol(
        agent,
        new PublicKey(input.destination),
        input.amount,
      );
    }

    return {
      status: "success",
      signature,
    };
  },
};

export default transferAction;
