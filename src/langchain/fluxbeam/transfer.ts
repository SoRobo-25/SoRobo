import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";

export class SolanaFluxbeamTransferSplTokenTool extends Tool {
  name = "solana_transfer_spl_token";
  description = `This tool transfers SPL tokens from the agent's wallet to another wallet.

  Inputs (input is a JSON string):
  mint: string, eg "So11111111111111111111111111111111111111112" (required)
  dstOwner: string, eg "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgMsCVZ93TK" (required)
  amount: number, eg 1 or 0.01 (required)
  program?: string, eg "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" (optional, defaults to TOKEN_2022_PROGRAM_ID)
  allowOwnerOffCurve?: boolean, eg true or false (optional, defaults to false)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const signature = await this.solanaKit.fluxbeamTransferSplToken(
        this.solanaKit,
        new PublicKey(parsedInput.mint),
        new PublicKey(parsedInput.dstOwner),
        parsedInput.amount,
        parsedInput.v2 || true,
        parsedInput.allowOwnerOffCurve || false,
      );

      return JSON.stringify({
        status: "success",
        message: "SPL token transfer executed successfully",
        transaction: signature,
        mint: parsedInput.mint,
        dstOwner: parsedInput.dstOwner,
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

export class SolanaFluxbeamTransferSolTool extends Tool {
  name = "solana_transfer_sol";
  description = `This tool transfers SOL from the agent's wallet to another wallet.

  Inputs (input is a JSON string):
  dstOwner: string, eg "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgMsCVZ93TK" (required)
  amount: number, eg 1000000 (required, amount in lamports)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const signature = await this.solanaKit.fluxbeamTransferSol(
        this.solanaKit,
        new PublicKey(parsedInput.dstOwner),
        parsedInput.amount,
      );

      return JSON.stringify({
        status: "success",
        message: "SOL transfer executed successfully",
        transaction: signature,
        dstOwner: parsedInput.dstOwner,
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
