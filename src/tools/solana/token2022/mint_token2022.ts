import { PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "../../../agent";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

/**
 * Mint a token(Token 2022) to a destination address
 * @async
 * @param agent SolanaAgentKit instance
 * @param mint token mint address
 * @param destination destination address
 * @param decimals token decimals
 * @param amount number of tokens to mint (optional)
 * @returns transaction signature
 */
export async function mint_token2022(
  agent: SolanaAgentKit,
  mint: PublicKey,
  destination: PublicKey,
  decimals: number,
  amount: number = 1,
): Promise<string> {
  try {
    const ata = (
      await getOrCreateAssociatedTokenAccount(
        agent.connection,
        agent.wallet,
        mint,
        destination,
        undefined,
        "confirmed",
        undefined,
        TOKEN_2022_PROGRAM_ID,
      )
    ).address;

    const signature = await mintTo(
      agent.connection,
      agent.wallet,
      mint,
      ata,
      agent.wallet,
      amount * 10 ** decimals,
      [agent.wallet],
      { commitment: "finalized" },
      TOKEN_2022_PROGRAM_ID,
    );
    return signature;
  } catch (error: any) {
    throw new Error(`mint token failed: ${error.message}`);
  }
}
