import {
  createUpdateMetadataAccountV2Instruction,
  Metadata,
  UpdateMetadataAccountArgsV2,
} from "@metaplex-foundation/mpl-token-metadata";
import { TOKEN_METADATA_PROGRAM_ID } from "@onsol/tldparser";
import { PublicKey } from "@solana/web3.js";
import {
  createUpdateFieldInstruction,
  TOKEN_2022_PROGRAM_ID,
  createUpdateAuthorityInstruction,
} from "@solana/spl-token";
import {
  Transaction,
  ComputeBudgetProgram,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { SolanaAgentKit } from "../agent";
import { pack } from "@solana/spl-token-metadata";
import { FEE_ACCOUNT } from "../constants";

function isDevnet(agent: SolanaAgentKit) {
  return agent.connection.rpcEndpoint.indexOf("devnet") > -1;
}

export function metadataProgram(agent: SolanaAgentKit): PublicKey {
  if (isDevnet(agent)) {
    return new PublicKey("M1tgEZCz7fHqRAR3G5RLxU6c6ceQiZyFK7tzzy4Rof4");
  }
  return TOKEN_METADATA_PROGRAM_ID;
}

/**
 * Returns the token metadata via mint
 * @param mint
 * @param metadataProgram
 */
async function getTokenMetadata(
  agent: SolanaAgentKit,
  mint: PublicKey,
  programId?: PublicKey,
): Promise<any> {
  const metadataProgramId = programId ?? (await metadataProgram(agent));
  return getTokenMetadataRaw(
    agent,
    await getMetadataPDA(agent, mint, metadataProgramId),
  );
}

/**
 * Returns the token metadata via mint
 * @param metadataAddress
 */
async function getTokenMetadataRaw(
  agent: SolanaAgentKit,
  metadataAddress: PublicKey,
) {
  return Metadata.fromAccountAddress(
    agent.connection,
    metadataAddress,
    "confirmed",
  );
}

/**
 * Returns the file metadata for given token metadata
 * @param metadata
 */
async function getTokenFileMetadata(metadata: Metadata) {
  if (!metadata || !metadata.data.uri.replace(/\0.*$/g, "")) {
    return;
  }

  return (await fetch(metadata.data.uri)).json();
}

/**
 * Returns the token mints metadata PDA
 * @param mint
 * @param metadataProgram
 */
export async function getMetadataPDA(
  agent: SolanaAgentKit,
  mint: PublicKey,
  programId?: PublicKey,
) {
  const metadataProgramId = programId ?? metadataProgram(agent);
  const [metaPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), metadataProgramId.toBuffer(), mint.toBuffer()],
    metadataProgramId,
  );
  return metaPDA;
}

export async function getUpdateToken22MetadataTransaction(
  agent: SolanaAgentKit,
  mint: PublicKey,
  metadata: any,
  authority: PublicKey,
  data: UpdateMetadataAccountArgsV2,
  priorityFee: number,
  metadataCID: string,
) {
  console.log("getUpdateToken22MetadataTransaction", {
    data,
    metadata,
  });

  const transaction = new Transaction();
  const unitLimit = 90_000;
  const unitPrice = Math.floor(priorityFee / unitLimit);

  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: unitLimit }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: unitPrice }),
    SystemProgram.transfer({
      fromPubkey: authority,
      toPubkey: FEE_ACCOUNT,
      lamports: 100_000_000,
    }),
    new TransactionInstruction({
      keys: [],
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      data: Buffer.from(metadataCID),
    }),
  );

  if (data.data?.name !== metadata.name) {
    console.debug(
      "getUpdateToken22MetadataTransaction::name - ",
      data.data?.name,
      metadata.name,
    );
    transaction.add(
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: new PublicKey(metadata.updateAuthority),
        field: "name",
        value: data.data?.name ?? "", // cast as a string as a
      }),
    );
  }

  if (data.data?.symbol !== metadata.symbol) {
    console.debug(
      "getUpdateToken22MetadataTransaction::symbol - ",
      data.data?.symbol,
      metadata.symbol,
    );
    transaction.add(
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: new PublicKey(metadata.updateAuthority),
        field: "symbol",
        value: data.data?.symbol ?? "",
      }),
    );
  }

  if (data.data?.uri !== metadata.uri) {
    console.debug("getUpdateToken22MetadataTransaction::uri - ", {
      data: data.data?.uri,
      meta: metadata.uri,
    });
    transaction.add(
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mint,
        updateAuthority: new PublicKey(metadata.updateAuthority),
        field: "uri",
        value: data?.data?.uri ?? "",
      }),
    );
  }

  console.debug(
    "Adjust authority",
    data.updateAuthority,
    metadata.updateAuthority,
  );
  if (data.updateAuthority !== metadata.updateAuthority) {
    console.debug(
      "getUpdateToken22MetadataTransaction::authority - ",
      metadata.updateAuthority,
      data.updateAuthority,
    );
    const args = {
      metadata: mint,
      newAuthority: null,
      oldAuthority: new PublicKey(metadata.updateAuthority),
      programId: TOKEN_2022_PROGRAM_ID,
    };

    if (data.updateAuthority) {
      args.newAuthority = new PublicKey(data.updateAuthority);
    }

    transaction.add(createUpdateAuthorityInstruction(args));
  }

  const oldMetadataLength =
    pack({
      additionalMetadata: metadata?.additionalMetadata || [],
      mint: PublicKey.default,
      symbol: metadata.symbol,
      name: metadata.name,
      uri: metadata.uri,
    }).length + 4;

  const newMetadataLength =
    pack({
      additionalMetadata: [],
      mint: PublicKey.default,
      symbol: data?.data?.symbol ?? "",
      name: data?.data?.name ?? "",
      uri: data?.data?.uri ?? "",
    }).length + 4;

  const mintLamports = await agent.connection.getMinimumBalanceForRentExemption(
    newMetadataLength - oldMetadataLength,
  );
  if (mintLamports > 0) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: authority,
        toPubkey: new PublicKey(mint),
        lamports: mintLamports,
      }),
    );
  }

  const bhash = await agent.connection.getLatestBlockhash("confirmed");
  transaction.feePayer = authority;
  transaction.recentBlockhash = bhash.blockhash;

  return transaction;
}

export async function getUpdateMetadataTransaction(
  agent: SolanaAgentKit,
  metadata: PublicKey,
  authority: PublicKey,
  data: UpdateMetadataAccountArgsV2,
  priorityFee: number,
  metadataCID: string,
  programId?: PublicKey,
) {
  const metadataProgramId = programId ?? (await metadataProgram(agent));
  const transaction = new Transaction();

  const unitLimit = 100_000;
  const unitPrice = Math.floor(priorityFee / unitLimit);

  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: unitLimit }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: unitPrice }),
    SystemProgram.transfer({
      fromPubkey: authority,
      toPubkey: FEE_ACCOUNT,
      lamports: 20000000,
    }),
    new TransactionInstruction({
      keys: [],
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      data: Buffer.from(metadataCID),
    }),
    createUpdateMetadataAccountV2Instruction(
      {
        metadata: metadata,
        updateAuthority: authority,
      },
      {
        updateMetadataAccountArgsV2: data,
      },
      metadataProgramId,
    ),
  );

  const bhash = await agent.connection.getLatestBlockhash("confirmed");
  transaction.feePayer = authority;
  transaction.recentBlockhash = bhash.blockhash;

  return transaction;
}
