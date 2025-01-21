import { PublicKey } from "@solana/web3.js";
import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";

export class SolanaFluxbeamBurnTokenTool extends Tool {
  name = "solana_burn_token";
  description = `This tool can be used to burn a specified amount of tokens.

  Inputs (input is a JSON string):
  mint: string, eg "So11111111111111111111111111111111111111112" (required)
  amount: number, eg 1 or 0.01 (required)
  decimals: number, eg 6 or 9 (required)
  v2: boolean eg true or false (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const signature = await this.solanaKit.fluxbeamBurnToken(
        new PublicKey(parsedInput.mint),
        parsedInput.amount,
        parsedInput.v2 || true,
      );

      return JSON.stringify({
        status: "success",
        message: "Token burn executed successfully",
        transaction: signature,
        mint: parsedInput.mint,
        amount: parsedInput.amount,
        decimals: parsedInput.decimals,
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
