import { PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenPDA } from "../utils/fluxbeam_utils";
import {
  createBurnCheckedInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { SolanaAgentKit } from "../agent";

/**
 * Burns a specified amount of tokens
 * @param agent SolanaAgentKit instance
 * @param mint Token mint address
 * @param amount Amount of tokens to burn
 * @param decimals Token decimals
 * @param program Optional token program ID (defaults to TOKEN_2022_PROGRAM_ID)
 * @returns Transaction signature
 */
export async function fluxbeamBurnTokens(
  agent: SolanaAgentKit,
  mint: PublicKey,
  amount: number,
  decimals: number,
  program = TOKEN_2022_PROGRAM_ID,
): Promise<string> {
  try {
    const srcAta = await getAssociatedTokenPDA(
      mint,
      agent.wallet_address,
      program,
    );
    const transaction = new Transaction();
    transaction.add(
      createBurnCheckedInstruction(
        srcAta,
        mint,
        agent.wallet_address,
        amount,
        decimals,
        [],
        program,
      ),
    );

    const bhash = await agent.connection.getLatestBlockhash("confirmed");
    transaction.feePayer = agent.wallet_address;
    transaction.recentBlockhash = bhash.blockhash;

    // Sign and send transaction
    const signature = await agent.connection.sendTransaction(
      transaction,
      [agent.wallet],
      { skipPreflight: false, preflightCommitment: "confirmed", maxRetries: 5 },
    );

    return signature;
  } catch (error: any) {
    throw new Error(`Burn token failed: ${error.message}`);
  }
}
