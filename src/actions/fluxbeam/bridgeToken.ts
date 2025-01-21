import { Action } from "../../types/action";
import { SolanaAgentKit } from "../../agent";
import { z } from "zod";
import {
  Chain,
  fluxbeamBridgeTokens,
} from "../../tools/fluxbeam/fluxbeam_bridge_tokens";

const fluxbeamBridgeTokenAction: Action = {
  name: "FLUXBEAM_BRIDGE_TOKEN_ACTION",
  similes: [
    "bridge tokens",
    "transfer across chains",
    "send to other chain",
    "cross chain transfer",
    "bridge to ethereum",
    "bridge to polygon",
  ],
  description: `Bridge tokens from Solana to another blockchain using Fluxbeam.
  Supported destination chains include Ethereum, BSC, Polygon, Avalanche, Arbitrum, Optimism and Base.
  You can optionally specify a gas drop amount that must not exceed the chain's limit.`,
  examples: [
    [
      {
        input: {
          destination: "ethereum",
          destinationWalletAddress: "0x1234...5678",
          fromToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          toToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          amount: 100,
          gasDrop: 0.04,
        },
        output: {
          status: "success",
          signature: "5pB6Fy...",
        },
        explanation: "Bridge 100 USDC from Solana to Ethereum",
      },
    ],
  ],
  schema: z.object({
    destination: z.enum([
      "ethereum",
      "bsc",
      "polygon",
      "avalanche",
      "solana",
      "arbitrum",
      "optimism",
      "base",
    ]),
    destinationWalletAddress: z.string(),
    fromToken: z.string(),
    toToken: z.string(),
    amount: z.number(),
    gasDrop: z.number().optional(),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    const signature = await fluxbeamBridgeTokens(
      agent,
      input.destination as Chain,
      input.destinationWalletAddress,
      input.fromToken,
      input.toToken,
      input.amount,
      input.gasDrop,
    );

    return {
      status: "success",
      signature,
    };
  },
};

export default fluxbeamBridgeTokenAction;
