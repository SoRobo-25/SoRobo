import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";

export class SolanaFluxbeamWrapSOLTool extends Tool {
  name = "solana_fluxbeam_wrap_sol";
  description = `This tool wraps SOL into wSOL for the specified amount in lamports.

  Inputs (input is a JSON string):
  amount: number, eg 1000000 (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      if (!parsedInput.amount || typeof parsedInput.amount !== "number") {
        throw new Error(
          "Invalid input: 'amount' is required and must be a number.",
        );
      }

      const signature = await this.solanaKit.fluxbeamWrapSOL(
        this.solanaKit,
        parsedInput.amount,
      );

      return JSON.stringify({
        status: "success",
        message: "SOL wrapped successfully",
        transaction: signature,
        amount: parsedInput.amount,
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

export class SolanaFluxbeamUnwrapSOLTool extends Tool {
  name = "solana_fluxbeam_unwrap_sol";
  description = `This tool unwraps wSOL back into SOL for the user's wallet. No additional inputs required.`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(): Promise<string> {
    try {
      const signature = await this.solanaKit.fluxbeamUnwrapSOL(this.solanaKit);

      return JSON.stringify({
        status: "success",
        message: "wSOL unwrapped successfully",
        transaction: signature,
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
