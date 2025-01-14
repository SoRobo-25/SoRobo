import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../agent";

export class SolanaFluxbeamCreateMintV1Tool extends Tool {
  name = "solana_create_mint_v1";
  description = `This tool creates a mint on the Solana blockchain.

    Inputs (input is a JSON string):
    name: string, token name (required)
    symbol: Symbol of the token
    decimals: Number of decimals eg. 9
    initialSupply: number (required)
    imagePath: path to the image
    uri: URI for the token metadata
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const signature = await this.solanaKit.fluxbeamCreateMintV1(
        this.solanaKit,
        parsedInput.name,
        parsedInput.symbol,
        parsedInput.decimals,
        parsedInput.uri,
        parsedInput.imagePath,
        parsedInput.initialSupply,
      );

      return JSON.stringify({
        status: "success",
        message: "Mint created successfully",
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
