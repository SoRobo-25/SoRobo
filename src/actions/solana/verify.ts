import { Action } from "../../types/action";
import { z } from "zod";
import { getProgramVerificationStatus, verifySolanaProgram } from "../../tools";

export const verifyProgramAction: Action = {
  name: "VERIFY_PROGRAM",
  similes: [
    "verify program",
    "check program",
    "validate program",
    "verify solana program",
    "check contract",
    "verify smart contract",
  ],
  description: `Verify a Solana program by comparing its on-chain bytecode with the source code from a GitHub repository.`,
  examples: [
    [
      {
        input: {
          programId: "FWEYpBAf9WsemQiNbAewhyESfR38GBBHLrCaU3MpEKWv",
          github: "https://github.com/solana-developers/verified-program",
          commit: "5b82b86f02afbde330dff3e1847bed2d42069f4e",
        },
        output: {
          status: "success",
          message: "Program verification completed",
          details: {
            programId: "FWEYpBAf9WsemQiNbAewhyESfR38GBBHLrCaU3MpEKWv",
            repository: "https://github.com/solana-developers/verified-program",
            commit: "5b82b86f02afbde330dff3e1847bed2d42069f4e",
            verificationResult: {
              verified: true,
              message: "Program verified successfully",
            },
          },
        },
        explanation: "Verify the example program with specific commit hash",
      },
    ],
    [
      {
        input: {
          programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
          github:
            "https://github.com/solana-labs/solana-program-library/tree/070934ae4f2975d602caa6bd1e88b2c010e4cab5",
          commit: "070934ae4f2975d602caa6bd1e88b2c010e4cab5",
        },
        output: {
          status: "success",
          message: "Program verification completed",
          details: {
            programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
            repository: "https://github.com/solana-labs/solana-program-library",
            commit: "070934ae4f2975d602caa6bd1e88b2c010e4cab5",
            verificationResult: {
              verified: true,
              message: "Token program verified successfully",
            },
          },
        },
        explanation: "Verify the Solana Token program from SPL",
      },
    ],
  ],
  schema: z.object({
    programId: z.string().min(32, "Invalid Solana program ID"),
    github: z.string().url("Invalid GitHub repository URL"),
    commit: z.string().optional(),
  }),
  handler: async (input: Record<string, any>) => {
    try {
      // Clean up GitHub URL if it contains tree/branch information
      const githubUrl = input.github.split("/tree/")[0];

      const verificationResult = await verifySolanaProgram(
        githubUrl,
        input.programId,
        input.commit,
      );

      const parsedResult = JSON.parse(verificationResult);

      return {
        status: "success",
        message: "Program verification completed",
        details: {
          programId: input.programId,
          repository: githubUrl,
          commit: input.commit || "latest",
          verificationResult: parsedResult,
        },
      };
    } catch (error: any) {
      return {
        status: "error",
        message: error.message,
        code: "VERIFICATION_ERROR",
        details: {
          programId: input.programId,
          repository: input.github,
          error: error.stack,
        },
      };
    }
  },
};

export const checkVerificationStatusAction: Action = {
  name: "CHECK_VERIFICATION_STATUS",
  similes: [
    "check program status",
    "verify program status",
    "check verification",
    "get program verification",
    "is program verified",
    "program verification status",
  ],
  description: `Check the verification status of a Solana program using its program ID.`,
  examples: [
    [
      {
        input: {
          programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        },
        output: {
          status: "success",
          message: "Verification status retrieved successfully",
          details: {
            programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
            verified: true,
            repository: "https://github.com/solana-labs/solana-program-library",
            commit: "070934ae4f2975d602caa6bd1e88b2c010e4cab5",
          },
        },
        explanation: "Check verification status of the Solana Token program",
      },
    ],
    [
      {
        input: {
          programId: "FWEYpBAf9WsemQiNbAewhyESfR38GBBHLrCaU3MpEKWv",
        },
        output: {
          status: "success",
          message: "Verification status retrieved successfully",
          details: {
            programId: "FWEYpBAf9WsemQiNbAewhyESfR38GBBHLrCaU3MpEKWv",
            verified: true,
            repository: "https://github.com/solana-developers/verified-program",
            commit: "5b82b86f02afbde330dff3e1847bed2d42069f4e",
          },
        },
        explanation: "Check verification status of an example verified program",
      },
    ],
  ],
  schema: z.object({
    programId: z.string().min(32, "Invalid Solana program ID"),
  }),
  handler: async (input: Record<string, any>) => {
    try {
      const verificationStatus = await getProgramVerificationStatus(
        input.programId,
      );

      return {
        status: "success",
        message: "Verification status retrieved successfully",
        verificationStatus,
      };
    } catch (error: any) {
      return {
        status: "error",
        message: error.message,
        code: "STATUS_CHECK_ERROR",
        details: {
          programId: input.programId,
          error: error.stack,
        },
      };
    }
  },
};
