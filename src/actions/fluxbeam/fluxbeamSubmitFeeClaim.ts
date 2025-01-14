import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { SolanaAgentKit } from "../../agent";
import { fluxbeamSubmitFeeClaim } from "../../tools";
import { Action } from "../../types";

// Fee Claim Action
const submitFeeClaimAction: Action = {
  name: "SUBMIT_FEE_CLAIM_ACTION",
  similes: ["claim fees", "collect fees", "withdraw fees"],
  description: "Claims accumulated token fees",
  examples: [
    [
      {
        input: {
          payer: "EPjFW...",
          mint: "So11...",
          priorityFee: 100000,
        },
        output: {
          status: "success",
          signature: "5mRt8...",
        },
        explanation: "Claim fees for a token mint",
      },
    ],
  ],
  schema: z.object({
    payer: z.string(),
    mint: z.string(),
    priorityFee: z.number().positive(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const signature = await fluxbeamSubmitFeeClaim(
      agent,
      new PublicKey(input.payer),
      new PublicKey(input.mint),
      input.priorityFee,
    );
    return {
      status: "success",
      signature,
    };
  },
};

export default submitFeeClaimAction;
