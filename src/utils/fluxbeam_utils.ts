import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  Signer,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { SolanaAgentKit } from "../agent";
import { confirmTransaction } from "@raydium-io/raydium-sdk-v2";

/**
 * Returns the token mints account for a given user
 * @param owner
 * @param mint
 * @param program
 * @param allowOwnerOffCurve
 */
export async function getAssociatedTokenPDA(
  mint: PublicKey,
  owner: PublicKey,
  program = TOKEN_2022_PROGRAM_ID,
  allowOwnerOffCurve = false,
) {
  return getAssociatedTokenAddressSync(
    mint,
    owner,
    allowOwnerOffCurve,
    program,
  );
}

export async function accountExists(agent: SolanaAgentKit, account: PublicKey) {
  const acc = await agent.connection
    .getAccountInfo(account, "confirmed")
    .catch((e) => {});
  return !!acc;
}

// Send a versioned transaction with less boilerplate
// https://www.quicknode.com/guides/solana-development/transactions/how-to-use-versioned-transactions-on-solana
// TODO: maybe we should expose this? To discuss.
export const makeAndSendAndConfirmTransaction = async (
  connection: Connection,
  instructions: Array<TransactionInstruction>,
  signers: Array<Signer>,
  payer: Keypair,
) => {
  const latestBlockhash = (await connection.getLatestBlockhash("max"))
    .blockhash;

  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: latestBlockhash,
    instructions,
  }).compileToV0Message();
  const transaction = new VersionedTransaction(messageV0);
  transaction.sign(signers);

  const signature = await connection.sendTransaction(transaction);

  await confirmTransaction(connection, signature);

  return signature;
};
