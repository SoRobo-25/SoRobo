import {
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  ExtensionType,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
} from "@solana/spl-token";
import { SolanaAgentKit } from "../../../agent";
import { getMintLen } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";
import { sendAndConfirmTransaction } from "@solana/web3.js";
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";
import { PublicKey } from "@solana/web3.js";
import { TransactionInstruction } from "@solana/web3.js";

/**
 * Create a Non Transferable Token Mint
 * @async
 * @param agent SolanaAgentKit instance
 * @param decimals Token decimals
 * @param tokenName Name of the Token
 * @param tokenSymbol Symbol of the Token
 * @param uri URI of the Token
 * @param additionalMetadata additional metadata as an array of tuples [["customField", "customValue"]] (optional)
 * @returns mint address and trnsaction signature
 */
export async function createNonTransferableTokenMint(
  agent: SolanaAgentKit,
  decimals: number,
  tokenName: string,
  tokenSymbol: string,
  uri: string,
  additionalMetadata?: [string, string][],
): Promise<{ mint: PublicKey; signature: string }> {
  try {
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    const metadata: TokenMetadata = {
      mint,
      name: tokenName,
      symbol: tokenSymbol,
      uri,
      additionalMetadata: additionalMetadata || [],
    };

    const extensions = [
      ExtensionType.NonTransferableAccount,
      ExtensionType.MetadataPointer,
    ];
    const mintLength = getMintLen(extensions);
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

    const mintLamports =
      await agent.connection.getMinimumBalanceForRentExemption(
        mintLength + metadataLen,
      );

    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: agent.wallet.publicKey,
      newAccountPubkey: mint,
      lamports: mintLamports,
      space: mintLength,
      programId: TOKEN_2022_PROGRAM_ID,
    });

    const initializeNonTransferableMintInstruction =
      createInitializeNonTransferableMintInstruction(
        mint,
        TOKEN_2022_PROGRAM_ID,
      );

    const initMetadataPointerInstruction =
      createInitializeMetadataPointerInstruction(
        mint,
        agent.wallet_address,
        mint, // Metadata account - points to itself
        TOKEN_2022_PROGRAM_ID,
      );

    const initializeMintInstruction = createInitializeMintInstruction(
      mint,
      decimals,
      agent.wallet_address,
      agent.wallet_address,
      TOKEN_2022_PROGRAM_ID,
    );

    const initMetadataInstruction = createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      mint,
      metadata: mint,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      mintAuthority: agent.wallet_address,
      updateAuthority: agent.wallet_address,
    });

    const setExtraMetadataInstructions: TransactionInstruction[] = [];
    additionalMetadata!.map((data) => {
      setExtraMetadataInstructions.push(
        createUpdateFieldInstruction({
          updateAuthority: agent.wallet_address,
          metadata: mint,
          field: data[0],
          value: data[1],
          programId: TOKEN_2022_PROGRAM_ID,
        }),
      );
    });

    const mintTransaction = new Transaction().add(
      createAccountInstruction,
      initializeNonTransferableMintInstruction,
      initMetadataPointerInstruction,
      initializeMintInstruction,
      initMetadataInstruction,
      ...setExtraMetadataInstructions,
    );

    const signature = await sendAndConfirmTransaction(
      agent.connection,
      mintTransaction,
      [agent.wallet, mintKeypair],
      { commitment: "finalized" },
    );
    return { mint, signature };
  } catch (error: any) {
    throw new Error(`Creating mint failed: ${error.message}`);
  }
}
