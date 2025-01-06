import { SolanaAgentKit } from "../agent";
import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import { getAssociatedTokenPDA } from "../utils/fluxbeam_utils";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

export async function fluxbeamTransferSplToken(
  agent: SolanaAgentKit,
  mint: PublicKey,
  dstOwner: PublicKey,
  amount: number,
  decimals: number,
  program = TOKEN_2022_PROGRAM_ID,
  allowOwnerOffCurve = false,
) {
  const srcAta = await getAssociatedTokenPDA(
    mint,
    agent.wallet_address,
    program,
    allowOwnerOffCurve,
  );
  const dstAta = await getAssociatedTokenPDA(
    mint,
    dstOwner,
    program,
    allowOwnerOffCurve,
  );

  const transaction = new Transaction();

  const dstIfo = await agent.connection.getAccountInfo(dstAta, "confirmed");
  if (!dstIfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        agent.wallet_address,
        dstAta,
        dstOwner,
        mint,
        program,
      ),
    );
  }

  transaction.add(
    createTransferCheckedInstruction(
      srcAta, //Src Ata
      mint, //Mint
      dstAta,
      agent.wallet_address,
      amount, //TODO check decimals??
      decimals,
      [],
      program,
    ),
  );

  const bhash = await agent.connection.getLatestBlockhash("confirmed");
  transaction.feePayer = agent.wallet_address;
  transaction.recentBlockhash = bhash.blockhash;

  // Sign and send transaction
  const signature = await agent.connection.sendTransaction(transaction, [
    agent.wallet,
  ]);

  return signature;
}

export async function fluxbeamTransfer(
  agent: SolanaAgentKit,
  dstOwner: PublicKey,
  amount: number,
) {
  const transaction = new Transaction();

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: agent.wallet_address,
      toPubkey: dstOwner,
      lamports: amount,
    }),
  );

  const bhash = await agent.connection.getLatestBlockhash("confirmed");
  transaction.feePayer = agent.wallet_address;
  transaction.recentBlockhash = bhash.blockhash;

  // Sign and send transaction
  const signature = await agent.connection.sendTransaction(transaction, [
    agent.wallet,
  ]);

  return signature;
}
