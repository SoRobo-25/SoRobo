import {
  AuthorityType,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PublicKey,
  ComputeBudgetProgram,
  Transaction,
  Keypair,
} from "@solana/web3.js";
import { SolanaAgentKit } from "../../agent";
import { sendTransaction, signTransaction } from "../../utils/FluxbeamClient";

/**
 * Mints tokens to the associated token account of a given owner.
 * If the associated token account does not exist, it is created.
 *
 * @param {SolanaAgentKit} agent - SolanaAgentKit instance
 * @param {PublicKey} owner - The public key of the token account owner.
 * @param {PublicKey} tokenMint - The public key of the token mint account.
 * @param {bigint} amount - The amount of tokens to mint.
 * @param {boolean} [v2=true] - Whether to use the Token 2022 program.
 * @returns {Promise<string>} - The transaction signature.
 */
export async function fluxbeamMintToAccount(
  agent: SolanaAgentKit,
  owner: PublicKey,
  tokenMint: PublicKey,
  amount: bigint,
  v2: boolean = true,
) {
  const program = v2 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const transaction = new Transaction();
  const ata = getAssociatedTokenAddressSync(tokenMint, owner, true, program);

  const dstIfo = await agent.connection.getAccountInfo(ata, "confirmed");
  if (!dstIfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        owner,
        ata,
        owner,
        tokenMint,
        program,
      ),
    );
  }

  transaction.add(
    createMintToInstruction(tokenMint, ata, owner, amount, [], program),
  );

  const txn = await signTransaction(agent, transaction);

  const response = await sendTransaction(agent, txn);

  return response.signature;
}

/**
 * Sets a new authority for a given mint account.
 *
 * @param {SolanaAgentKit} agent -SolanaAgentKit instance
 * @param {PublicKey} owner - The public key of the current authority.
 * @param {PublicKey} mint - The public key of the mint account.
 * @param {AuthorityType} authority - The type of authority to set (e.g., Mint, Freeze, Close).
 * @param {PublicKey|null} newAuthority - The public key of the new authority, or null to revoke.
 * @param {boolean} [v2=true] - Whether to use the Token 2022 program.
 * @param {number} [priorityFee=100_000_000] - The priority fee for the transaction (in microLamports).
 * @param {Keypair[]} [additional_signers=[]] - Additional signers required for the transaction.
 * @returns {Promise<string>} - The transaction signature.
 */
export async function fluxbeamSetAuthority(
  agent: SolanaAgentKit,
  owner: PublicKey,
  mint: PublicKey,
  authority: AuthorityType,
  newAuthority: PublicKey | null,
  v2: boolean = true,
  priorityFee: number = 100_000_000,
  additional_signers: Keypair[] = [],
) {
  const programID = v2 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const transaction = new Transaction();
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 10_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: Math.floor(priorityFee / 10_000),
    }),
  );
  transaction.add(
    createSetAuthorityInstruction(
      mint,
      owner,
      authority,
      newAuthority,
      [],
      programID,
    ),
  );
  const txn = await signTransaction(agent, transaction, additional_signers);

  const response = await sendTransaction(agent, txn);

  return response.signature;
}

/**
 * Revokes an authority from a given mint account by setting it to null.
 *
 * @param {SolanaAgentKit} agent - SolanaAgentKit instance
 * @param {PublicKey} owner - The public key of the current authority.
 * @param {PublicKey} mint - The public key of the mint account.
 * @param {AuthorityType} authority - The type of authority to revoke (e.g., Mint, Freeze, Close).
 * @param {boolean} [v2=true] - Whether to use the Token 2022 program.
 * @param {number} [priorityFee=100_000_000] - The priority fee for the transaction (in microLamports).
 * @param {Keypair[]} [additional_signers=[]] - Additional signers required for the transaction.
 * @returns {Promise<string>} - The transaction signature.
 */
export function fluxbeamRevokeAuthority(
  agent: SolanaAgentKit,
  owner: PublicKey,
  mint: PublicKey,
  authority: AuthorityType,
  v2: boolean = true,
  priorityFee: number = 1_000_000,
  additional_signers: Keypair[] = [],
) {
  return fluxbeamSetAuthority(
    agent,
    owner,
    mint,
    authority,
    null,
    v2,
    priorityFee,
    additional_signers,
  );
}
