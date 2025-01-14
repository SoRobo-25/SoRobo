import { PublicKey } from "@solana/web3.js";
import { Action } from "../../types/action";
import { SolanaAgentKit } from "../../agent";
import { z } from "zod";
import { fluxbeamSubmitFeePayment, fluxbeamSubmitFeeClaim } from "../../tools";

const feePaymentAction: Action = {
  name: "FEE_PAYMENT_ACTION",
  similes: [
    "pay fees",
    "submit fee payment",
    "process fees",
    "handle transaction fees",
    "pay gas",
  ],
  description: `Submit fee payments for Fluxbeam transactions.
  Can be used to pay transaction fees or claim accumulated fees.`,
  examples: [
    [
      {
        input: {
          type: "payment",
          quote: {
            /* quote object */
          },
          priorityFee: 100000,
        },
        output: {
          status: "success",
          signature: "4wPn3r...",
        },
        explanation: "Submit a fee payment for a transaction",
      },
      {
        input: {
          type: "claim",
          payer: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          mint: "So11111111111111111111111111111111111111112",
          priorityFee: 100000,
        },
        output: {
          status: "success",
          signature: "5tKm4q...",
        },
        explanation: "Claim accumulated fees from a token mint",
      },
    ],
  ],
  schema: z.union([
    z.object({
      type: z.literal("payment"),
      quote: z.any(),
      priorityFee: z.number(),
    }),
    z.object({
      type: z.literal("claim"),
      payer: z.string(),
      mint: z.string(),
      priorityFee: z.number(),
    }),
  ]),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    let signature: string;

    if (input.type === "payment") {
      signature = await fluxbeamSubmitFeePayment(
        agent,
        { quote: input.quote },
        input.priorityFee,
      );
    } else {
      signature = await fluxbeamSubmitFeeClaim(
        agent,
        new PublicKey(input.payer),
        new PublicKey(input.mint),
        input.priorityFee,
      );
    }

    return {
      status: "success",
      signature,
    };
  },
};

export default feePaymentAction;
