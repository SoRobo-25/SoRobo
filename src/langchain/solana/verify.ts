import { PublicKey } from "@solana/web3.js";
import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";

export class SolanaProgramVerificationTool extends Tool {
  name = "verify_solana_program";
  description = `Verify a Solana program using its GitHub repository and program ID.
  Input should be a JSON string with the following format:
  {
    "programId": string (required) - Solana program ID to verify,
    "github": string (required) - GitHub repository URL,
    "commit": string (optional) - Specific commit hash to verify
  }`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      if (!parsedInput.github || !parsedInput.programId) {
        throw new Error(
          "Missing required fields: 'github' and 'programId' are required",
        );
      }

      const program_id = new PublicKey(parsedInput.programId);
      if (!PublicKey.isOnCurve(program_id)) {
        throw new Error("Invalid program ID");
      }

      const data = await this.solanaKit.verifySolanaProgram(
        parsedInput.programId,
        parsedInput.github,
        parsedInput.commit,
      );

      return JSON.stringify({
        status: "success",
        details: {
          programId: parsedInput.programId,
          repository: parsedInput.github,
          commit: parsedInput.commit || "latest",
          verificationResult: data,
        },
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "VERIFICATION_ERROR",
        details: error.stack,
      });
    }
  }
}

export class SolanaProgramVerificationStatusTool extends Tool {
  name = "check_program_verification_status";
  description = `Check if a Solana program is verified or not.
  Input should be a JSON string with the following format:
  {
    "programId": string (required) - Solana program ID to check
  }`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      if (!parsedInput.programId) {
        throw new Error("Missing required field: 'programId' is required");
      }

      const program_id = new PublicKey(parsedInput.programId);
      if (!PublicKey.isOnCurve(program_id)) {
        throw new Error("Invalid program ID");
      }

      const data = await this.solanaKit.getProgramVerificationStatus(
        parsedInput.programId,
      );

      return JSON.stringify({
        status: "success",
        message: "Verification status retrieved",
        data,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: "STATUS_CHECK_ERROR",
      });
    }
  }
}
