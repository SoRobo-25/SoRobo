import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";

export class SolanaFluxbeamWrapSOLTool extends Tool {
  name = "solana_fluxbeam_wrap_sol";
  description = `Wraps SOL into wSOL for the specified amount in SOL

  Inputs (input is a JSON string):
  amount: number, eg 0.0012 (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      console.log(`this is the input ${input}`);
      const parsedInput = JSON.parse(input);
      // console.log(`this is the input ${input}}`);
      console.log(`this is the ${JSON.stringify(parsedInput)}`);
      const signature = await this.solanaKit.fluxbeamWrapSOL(
        parsedInput.amount,
      );
      return JSON.stringify({
        status: "success",
        message: "SOL wrapped successfully",
        transaction: signature,
        amount: parsedInput.amount,
      });
    } catch (error: any) {
      console.log(
        `this is the error stringified ${JSON.stringify({
          status: "error",
          message: error.message,
          code: error.code || "UNKNOWN_ERROR",
        })}`,
      );
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
  description = `This tool unwraps wSOL back into SOL for the user's wallet.
  
  Inputs (input is a JSON string):
  amount: number in SOL, eg 0.0012 (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const signature = await this.solanaKit.fluxbeamUnwrapSOL(
        parsedInput.amount,
      );

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
