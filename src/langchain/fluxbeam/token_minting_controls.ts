import { TOKEN_2022_PROGRAM_ID, AuthorityType } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";

export class SolanaFluxbeamMintToAccountTool extends Tool {
  name = "solana_fluxbeam_mint_to_account";
  description = `This tool mints tokens to a specified account.

  Inputs (input is a JSON string):
  owner: string, eg "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgMsCVZ93TK" (required)
  tokenMint: string, eg "So11111111111111111111111111111111111111112" (required)
  amount: bigint, eg 1000000000000000n (required, amount in token decimals)
  program?: string, eg "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" (optional, defaults to TOKEN_2022_PROGRAM_ID)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const signature = await this.solanaKit.fluxbeamMintToAccount(
        new PublicKey(parsedInput.owner),
        new PublicKey(parsedInput.tokenMint),
        BigInt(parsedInput.amount),
        parsedInput.v2 || true,
      );

      return JSON.stringify({
        status: "success",
        message: "Tokens minted successfully",
        transaction: signature,
        owner: parsedInput.owner,
        tokenMint: parsedInput.tokenMint,
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

export class SolanaFluxbeamSetAuthorityTool extends Tool {
  name = "solana_fluxbeam_set_authority";
  description = `This tool sets a new authority for a token mint.

  Inputs (input is a JSON string):
  owner: string, eg "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgMsCVZ93TK" (required)
  mint: string, eg "So11111111111111111111111111111111111111112" (required)
  authority: string, eg "MintTokens" (required, AuthorityType as a string)
  newAuthority: string | null, eg "NewAuthorityPublicKey" or null (required)
  programID?: string, eg "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" (optional, defaults to TOKEN_2022_PROGRAM_ID)
  priorityFee?: number, eg 100000000000 (optional, default is 100 lamports)
  additional_signers: Keypair[] (optional)`;
  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const signature = await this.solanaKit.fluxbeamSetAuthority(
        new PublicKey(parsedInput.owner),
        new PublicKey(parsedInput.mint),
        parsedInput.authority as AuthorityType,
        parsedInput.newAuthority
          ? new PublicKey(parsedInput.newAuthority)
          : null,
        parsedInput.programID || TOKEN_2022_PROGRAM_ID,
        parsedInput.priorityFee || 100_000_000_000,
        parsedInput.additional_signers,
      );

      return JSON.stringify({
        status: "success",
        message: "Authority set successfully",
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

export class SolanaFluxbeamRevokeAuthorityTool extends Tool {
  name = "solana_fluxbeam_revoke_authority";
  description = `This tool revokes authority for a token mint.

  Inputs (input is a JSON string):
  owner: string, eg "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgMsCVZ93TK" (required)
  mint: string, eg "So11111111111111111111111111111111111111112" (required)
  authority: string, eg "MintTokens" (required, AuthorityType as a string)
  programID?: string, eg "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" (optional, defaults to TOKEN_2022_PROGRAM_ID)
  priorityFee?: number, eg 100000000000 (optional, default is 100 lamports)
  additional_signers: Keypair[] (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const signature = await this.solanaKit.fluxbeamRevokeAuthority(
        new PublicKey(parsedInput.owner),
        new PublicKey(parsedInput.mint),
        parsedInput.authority as AuthorityType,
        parsedInput.programID || TOKEN_2022_PROGRAM_ID,
        parsedInput.priorityFee || 100_000_000_000,
        parsedInput.additional_signers,
      );

      return JSON.stringify({
        status: "success",
        message: "Authority revoked successfully",
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
