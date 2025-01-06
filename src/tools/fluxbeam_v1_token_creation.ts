import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  createCreateMetadataAccountV3Instruction,
  CreateMetadataAccountV3InstructionAccounts,
  DataV2,
  PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { none, some } from "@metaplex-foundation/umi-options";
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { SolanaAgentKit } from "../agent";
import { FEE_ACCOUNT } from "../constants";

export interface CreateMintV1Config {
  name: string;
  symbol: string;
  metadataUri: string;
  decimals: number;
  totalSupply: bigint;
  mintAuthority: PublicKey;
  freezeAuthority: PublicKey | null;
  sellerFeeBasisPoints?: number;
  mintTotalSupply?: boolean; // do we want to mint the supply to the user?
  creators?: [] | null;
}

async function getCreateMintTransaction(
  agent: SolanaAgentKit,
  owner: PublicKey,
  tokenMint: PublicKey,
  config: CreateMintV1Config,
  priorityFee: number,
  metadataCID: string,
) {
  const mintLamports =
    await agent.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  const ata = getAssociatedTokenAddressSync(
    tokenMint,
    owner,
    true,
    TOKEN_PROGRAM_ID,
  );

  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), PROGRAM_ID.toBuffer(), tokenMint.toBuffer()],
    PROGRAM_ID,
  );

  const ON_CHAIN_METADATA = {
    name: config.name,
    symbol: config.symbol,
    uri: config.metadataUri,
    sellerFeeBasisPoints: config.sellerFeeBasisPoints,
    creators: config.creators,
    collection: null,
    uses: null,
  } as DataV2;

  const unitLimit = 100_000;
  const unitPrice = Math.floor(priorityFee / unitLimit);
  const txn = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: unitLimit }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: unitPrice,
    }),
    SystemProgram.transfer({
      fromPubkey: owner,
      toPubkey: FEE_ACCOUNT,
      lamports: 100_000_000,
    }),
    new TransactionInstruction({
      keys: [],
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      data: Buffer.from(metadataCID),
    }),
    SystemProgram.createAccount({
      fromPubkey: owner,
      newAccountPubkey: tokenMint,
      space: MINT_SIZE,
      lamports: mintLamports,
      programId: TOKEN_PROGRAM_ID,
    }),
  );

  txn.add(
    createInitializeMintInstruction(
      tokenMint,
      config.decimals,
      config.mintAuthority,
      config.freezeAuthority,
      TOKEN_PROGRAM_ID,
    ),
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: tokenMint,
        mintAuthority: config.mintAuthority,
        payer: owner,
        updateAuthority: owner,
      },
      {
        createMetadataAccountArgsV3: {
          data: ON_CHAIN_METADATA,
          isMutable: true,
          collectionDetails: null,
        },
      },
      PROGRAM_ID,
    ),
    createAssociatedTokenAccountInstruction(
      owner,
      ata,
      owner,
      tokenMint,
      TOKEN_PROGRAM_ID,
    ),
  );

  if (config.mintTotalSupply) {
    txn.add(
      createMintToInstruction(
        tokenMint,
        ata,
        owner,
        config.totalSupply,
        [],
        TOKEN_PROGRAM_ID,
      ),
    );
  }

  const bhash = await agent.connection.getLatestBlockhash("confirmed");
  txn.feePayer = owner;
  txn.recentBlockhash = bhash.blockhash;
  return txn;
}

/**
 * Returns the token mints metadata PDA
 * @param mint
 * @param metadataProgram
 */
function getMetadataPDA(mint: PublicKey, metadataProgram = PROGRAM_ID) {
  //@ts-ignore
  const [metaPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), metadataProgram.toBuffer(), mint.toBuffer()],
    metadataProgram,
  );
  return metaPDA;
}
