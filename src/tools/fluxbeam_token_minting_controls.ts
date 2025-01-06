import {
  AccountState,
  AuthorityType,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createEnableRequiredMemoTransfersInstruction,
  createInitializeDefaultAccountStateInstruction,
  createInitializeImmutableOwnerInstruction,
  createInitializeInstruction,
  createInitializeInterestBearingMintInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintCloseAuthorityInstruction,
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  createInitializePermanentDelegateInstruction,
  createInitializeTransferFeeConfigInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  createThawAccountInstruction,
  getAssociatedTokenAddressSync,
  getMintLen,
} from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { SolanaAgentKit } from "../agent";
import { pack } from "@solana/spl-token-metadata";
import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { FEE_ACCOUNT } from "../constants";

export class CreateMintV1 {
  name: string;
  symbol: string;
  metadataUri: string;
  decimals: number;
  totalSupply: bigint;

  mintAuthority: PublicKey;
  freezeAuthority: PublicKey | null;

  sellerFeeBasisPoints: number = 0;

  //Do we mint the total supply to the user
  mintTotalSupply: boolean;

  creators: [] | null = null;

  constructor(
    name: string,
    symbol: string,
    metadataUri: string,
    totalSupply: bigint,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey | null,
    decimals = 6,
    mintTotalSupply = true,
  ) {
    this.name = name;
    this.symbol = symbol;
    this.metadataUri = metadataUri;
    this.totalSupply = totalSupply;
    this.decimals = decimals;
    this.mintTotalSupply = mintTotalSupply;
    this.mintAuthority = mintAuthority;
    this.freezeAuthority = freezeAuthority;
  }

  setSellerFeeBasisPoints(bp: number) {
    this.sellerFeeBasisPoints = bp;
  }

  setCreators(creators: []) {
    this.creators = creators;
  }
}

export class CreateMint extends CreateMintV1 {
  extensions: ExtensionType[] = [];
  extensionConfig = {};

  metadata: any;

  setMetadata(meta: any) {
    this.metadata = meta;
  }

  metadataLength(): number {
    if (!this.metadata) {
      return 0;
    }

    return (
      pack({
        additionalMetadata: this.metadata?.additionalMetadata || [],
        mint: PublicKey.default,
        symbol: this.metadata.symbol,
        name: this.metadata.name,
        uri: this.metadata.uri,
      }).length + 4
    );
  }

  addExtension(ext: ExtensionType, config: object = {}) {
    this.extensions.push(ext);
    //@ts-ignore
    this.extensionConfig[ext] = config;
  }
}

export async function getCreateMintTransaction(
  agent: SolanaAgentKit,
  owner: PublicKey,
  tokenMint: PublicKey,
  config: CreateMint,
  priorityFee: number,
  metadataCID: string,
) {
  const mintLen = getMintLen(config.extensions);
  const mintLamports = await agent.connection.getMinimumBalanceForRentExemption(
    mintLen + config.metadataLength(),
  );

  const ata = getAssociatedTokenAddressSync(
    tokenMint,
    owner,
    true,
    TOKEN_2022_PROGRAM_ID,
  );

  const ON_CHAIN_METADATA = {
    name: config.name,
    symbol: config.symbol,
    uri: config.metadataUri,
    sellerFeeBasisPoints: 0,
    uses: null,
    creators: null,
    collection: null,
  } as DataV2;

  const unitLimit = 120_000;
  const unitPrice = Math.floor(priorityFee / unitLimit);
  const txn = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: unitLimit }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: unitPrice }),
    SystemProgram.createAccount({
      fromPubkey: owner,
      newAccountPubkey: tokenMint,
      space: mintLen,
      lamports: mintLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    SystemProgram.transfer({
      fromPubkey: owner,
      toPubkey: FEE_ACCOUNT,
      lamports: 20000000,
    }),
    new TransactionInstruction({
      keys: [],
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      data: Buffer.from(metadataCID),
    }),
  );

  let isDefaultFrozen = false;
  config.extensions.forEach((ext: string | number) => {
    //@ts-ignore
    const cfg = config.extensionConfig[ext];
    // eslint-disable-next-line no-console
    console.log(`${ext}`, cfg);

    switch (ext) {
      case ExtensionType.TransferFeeConfig:
        ON_CHAIN_METADATA.sellerFeeBasisPoints = cfg.feeBasisPoints; //Update so it reflects same as royalties
        txn.add(
          createInitializeTransferFeeConfigInstruction(
            tokenMint,
            cfg.transfer_fee_config_authority
              ? cfg.transfer_fee_config_authority
              : config.mintAuthority, //Config Auth
            cfg.withdraw_withheld_authority
              ? cfg.withdraw_withheld_authority
              : config.mintAuthority, //Withdraw Auth
            cfg.feeBasisPoints,
            cfg.maxFee,
            TOKEN_2022_PROGRAM_ID,
          ),
        );
        break;
      case ExtensionType.InterestBearingConfig:
        txn.add(
          createInitializeInterestBearingMintInstruction(
            tokenMint,
            owner, //Rate Auth
            cfg.rate * 100,
            TOKEN_2022_PROGRAM_ID,
          ),
        );
        break;
      case ExtensionType.PermanentDelegate:
        txn.add(
          createInitializePermanentDelegateInstruction(
            tokenMint,
            new PublicKey(cfg.address),
            TOKEN_2022_PROGRAM_ID,
          ),
        );
        break;
      case ExtensionType.NonTransferable:
        txn.add(
          createInitializeNonTransferableMintInstruction(
            tokenMint,
            TOKEN_2022_PROGRAM_ID,
          ),
        );
        break;
      case ExtensionType.ImmutableOwner:
        txn.add(
          createInitializeImmutableOwnerInstruction(
            tokenMint,
            TOKEN_2022_PROGRAM_ID,
          ),
        );
        break;
      case ExtensionType.MemoTransfer:
        txn.add(
          createEnableRequiredMemoTransfersInstruction(
            tokenMint,
            owner,
            [],
            TOKEN_2022_PROGRAM_ID,
          ),
        );
        if (config.mintTotalSupply) {
          txn.add(
            new TransactionInstruction({
              keys: [{ pubkey: owner, isSigner: true, isWritable: true }],
              data: Buffer.from("Mint To Memo", "utf-8"),
              programId: new PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
              ),
            }),
          );
        }
        break;
      case ExtensionType.DefaultAccountState:
        isDefaultFrozen = cfg.state === AccountState.Frozen;
        txn.add(
          createInitializeDefaultAccountStateInstruction(
            tokenMint,
            cfg.state,
            TOKEN_2022_PROGRAM_ID,
          ),
        );
        break;
      case ExtensionType.MintCloseAuthority:
        txn.add(
          createInitializeMintCloseAuthorityInstruction(
            tokenMint,
            config.mintAuthority,
            TOKEN_2022_PROGRAM_ID,
          ),
        );
        break;
      case ExtensionType.MetadataPointer:
        txn.add(
          createInitializeMetadataPointerInstruction(
            tokenMint,
            config.mintAuthority,
            tokenMint,
            TOKEN_2022_PROGRAM_ID,
          ),
        );
        break;
      default:
        console.error("Unsupported extension", ext);
        break;
    }
  });

  //Init the mint
  txn.add(
    createInitializeMintInstruction(
      tokenMint,
      config.decimals,
      config.mintAuthority,
      config.freezeAuthority,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  if (config.metadata) {
    txn.add(
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: tokenMint,
        updateAuthority: config.mintAuthority,
        mint: tokenMint,
        mintAuthority: config.mintAuthority,
        name: config.metadata.name,
        symbol: config.metadata.symbol,
        uri: config.metadata.uri,
      }),
    );
  }

  if (config.mintTotalSupply) {
    txn.add(
      createAssociatedTokenAccountInstruction(
        owner,
        ata,
        owner,
        tokenMint,
        TOKEN_2022_PROGRAM_ID,
      ),
    );

    if (isDefaultFrozen) {
      txn.add(
        createThawAccountInstruction(
          ata,
          tokenMint,
          owner,
          [],
          TOKEN_2022_PROGRAM_ID,
        ),
      );
    }

    txn.add(
      createMintToInstruction(
        tokenMint,
        ata,
        owner,
        config.totalSupply,
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    );
  }

  const bhash = await agent.connection.getLatestBlockhash("confirmed");
  txn.feePayer = owner;
  txn.recentBlockhash = bhash.blockhash;

  // Sign and send transaction
  const signature = await agent.connection.sendTransaction(txn, [agent.wallet]);

  return signature;
}

export async function getMintToTransaction(
  agent: SolanaAgentKit,
  owner: PublicKey,
  tokenMint: PublicKey,
  amount: bigint,
  program = TOKEN_2022_PROGRAM_ID,
) {
  const txn = new Transaction();
  const ata = getAssociatedTokenAddressSync(tokenMint, owner, true, program);

  const dstIfo = await agent.connection.getAccountInfo(ata, "confirmed");
  if (!dstIfo) {
    txn.add(
      createAssociatedTokenAccountInstruction(
        owner,
        ata,
        owner,
        tokenMint,
        program,
      ),
    );
  }

  txn.add(createMintToInstruction(tokenMint, ata, owner, amount, [], program));

  const { blockhash } = await agent.connection.getLatestBlockhash("confirmed");
  txn.feePayer = owner;
  txn.recentBlockhash = blockhash;
  // Sign and send transaction
  const signature = await agent.connection.sendTransaction(txn, [agent.wallet]);

  return signature;
}

export async function getSetAuthorityTransaction(
  agent: SolanaAgentKit,
  owner: PublicKey,
  mint: PublicKey,
  authority: AuthorityType,
  newAuthority: PublicKey | null,
  programID = TOKEN_2022_PROGRAM_ID,
  priorityFee: number = 100_000_000_000,
) {
  const txn = new Transaction();
  txn.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 10_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: Math.floor(priorityFee / 10_000),
    }),
  );
  txn.add(
    createSetAuthorityInstruction(
      mint,
      owner,
      authority,
      newAuthority,
      [],
      programID,
    ),
  );

  const { blockhash } = await agent.connection.getLatestBlockhash("confirmed");
  txn.feePayer = owner;
  txn.recentBlockhash = blockhash;

  const signature = await agent.connection.sendTransaction(txn, [agent.wallet]);

  return signature;
}

export async function getRevokeAuthorityTransaction(
  agent: SolanaAgentKit,
  owner: PublicKey,
  mint: PublicKey,
  authority: AuthorityType,
  programID = TOKEN_2022_PROGRAM_ID,
  priorityFee: number = 100_000_000_000,
) {
  return getSetAuthorityTransaction(
    agent,
    owner,
    mint,
    authority,
    null,
    programID,
    priorityFee,
  );
}
