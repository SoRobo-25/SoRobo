import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../../../agent";
import { PublicKey } from "@solana/web3.js";

export class SolanaMintToken2022Tool extends Tool {
  name = "solana_mint_token2022";
  description = `mint a token(token2022)  to a destination address 

  Inputs ( input is a JSON string ):
  mint: string, eg 8z1FnrcutaAmNZ57wbAb6fqNNBcTiMQWRZQb3sg8cYkv,
  destination: string eg EXBdeRCdiNChKyD7akt64n9HgSXEpUtpPEhmbnm4L6iH,
  decimals: number, eg 9
  amount: number eg 2 (optional)
`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const mint = new PublicKey(parsedInput.mint);
      const destination = new PublicKey(parsedInput.destination);

      const tx = await this.solanaKit.mint_token2022(
        mint,
        destination,
        parsedInput.decimals,
        parsedInput.amount,
      );
      return JSON.stringify({
        status: "success",
        tx,
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
