import { PublicKey } from "@solana/web3.js";
import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";
import { TOKENS, DEFAULT_OPTIONS } from "../../constants";

export class SolanaFluxBeamSwapTool extends Tool {
  name = "solana_fluxbeam_swap";
  description = `This tool swaps tokens using the FluxBeam DEX.

  Inputs (input is a JSON string):
  outputMint: string, eg "So11111111111111111111111111111111111111112" (required)
  inputAmount: number, eg 100 (required, amount in token decimals)
  inputMint?: string, eg "EPjFWdd5AufqSSQBj1RNkQu86VkzPzZPuTz2tnn8kq5" (optional, defaults to USDC)
  slippageBps?: number, eg 300 (optional, default 300 = 3% slippage tolerance)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const signature = await this.solanaKit.fluxBeamSwap(
        this.solanaKit,
        parsedInput.inputMint
          ? new PublicKey(parsedInput.inputMint)
          : TOKENS.USDC,
        new PublicKey(parsedInput.outputMint),
        parsedInput.inputAmount,
        parsedInput.slippageBps || DEFAULT_OPTIONS.SLIPPAGE_BPS,
      );

      return JSON.stringify({
        status: "success",
        message: "Token swap executed successfully",
        transaction: signature,
        outputMint: parsedInput.outputMint,
        inputAmount: parsedInput.inputAmount,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}
