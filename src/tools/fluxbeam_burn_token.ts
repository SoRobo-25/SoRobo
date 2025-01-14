import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenPDA,
  sendTransaction,
  signTransaction,
} from "../utils/FluxbeamClient";
import {
  createBurnCheckedInstruction,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SolanaAgentKit } from "../agent";

/**
 * Burns a specified amount of tokens
 * @param agent SolanaAgentKit instance
 * @param mint Token mint address
 * @param amount Amount of tokens to burn
 * @param program Optional token program ID (defaults to TOKEN_2022_PROGRAM_ID)
 * @returns Transaction signature
 */
export async function fluxbeamBurnToken(
  agent: SolanaAgentKit,
  mint: PublicKey,
  amount: number,
  v2: boolean = true,
): Promise<string> {
  try {
    const program = v2 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
    const decimals = (
      await getMint(agent.connection, mint, "finalized", program)
    ).decimals;
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

    const txn = await signTransaction(agent, transaction);

    const response = await sendTransaction(agent, txn);

    return response.signature;
  } catch (error: any) {
    throw new Error(`Burn token failed: ${error.message}`);
  }
}
