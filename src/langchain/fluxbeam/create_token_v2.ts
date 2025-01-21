import { PublicKey } from "@solana/web3.js";
import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";

export class SolanaFluxbeamCreateTokenV2Tool extends Tool {
  name = "solana_create_token_v2";
  description = `This tool creates a token2022 token on the Solana blockchain.

  Inputs (input is a JSON string):
  owner: string, e.g., "OwnerPublicKey" (required)
  tokenMintKeypair: Keypair, e.g., "TokenMintKeypair" (required)
  name: string, token name (required)
  symbol: string, token symbol (required)
  metadataUri: string uri of token metadata,
  totalSupply: bigint,
  mintAuthority: PublicKey,
  freezeAuthority: PublicKey | null,
  decimals = 6,
  mintTotalSupply = true,
  priorityFee: number, e.g., 5000 (required)
  extensions: ExtensionConfig[] array of token extensions and their custom config objects (required)
  description?: string token description (optional)
  metadataUri?: string metadataURI (optional),
  imagePath?: string image path (optional),
  imageUri?: string, optional image URL (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const signature = await this.solanaKit.fluxbeamCreateTokenV2(
        new PublicKey(parsedInput.owner),
        parsedInput.tokenMintKeypair,
        parsedInput.name,
        parsedInput.symbol,
        parsedInput.description,
        parsedInput.metadataURI,
        parsedInput.totalSupply,
        parsedInput.mintAuthority,
        parsedInput.freezeAuthority,
        parsedInput.decimals || 6,
        parsedInput.mintTotalSupply || true,
        parsedInput.priorityFee,
        parsedInput.imageData,
        parsedInput.imageUri,
      );

      return JSON.stringify({
        status: "success",
        message: "Token created successfully",
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
