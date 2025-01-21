import {
  fetchMetadataFromSeeds,
  updateV1,
} from "@metaplex-foundation/mpl-token-metadata";
import { SolanaAgentKit } from "../../agent";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import {
  createSignerFromKeypair,
  keypairIdentity,
} from "@metaplex-foundation/umi";
import * as bs58 from "bs58";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createUpdateFieldInstruction,
  createUpdateAuthorityInstruction,
  pack,
} from "@solana/spl-token-metadata";
import { FEE_ACCOUNT } from "../../constants";
import {
  sendTransaction,
  signTransaction,
  getToken22Metadata,
} from "../../utils/FluxbeamClient";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export async function fluxbeamUpdateV1Metadata(
  agent: SolanaAgentKit,
  mint: PublicKey,
  newName: string,
  newSymbol: string,
  newUri: string,
) {
  try {
    // Create UMI instance from agent
    const umi = createUmi(agent.connection.rpcEndpoint).use(mplToolbox());
    umi.use(keypairIdentity(fromWeb3JsKeypair(agent.wallet)));
    const myKeypair = agent.wallet;
    const updateAuthority = createSignerFromKeypair(
      umi,
      fromWeb3JsKeypair(myKeypair),
    ); //signer
    const initialMetadata = await fetchMetadataFromSeeds(umi, {
      mint: fromWeb3JsPublicKey(mint),
    });
    const txId = await updateV1(umi, {
      mint: fromWeb3JsPublicKey(mint),
      authority: updateAuthority,
      data: {
        ...initialMetadata,
        symbol: newSymbol,
        name: newName,
        uri: newUri,
      },
    }).sendAndConfirm(umi);

    const txSignature = bs58.default.encode(txId.signature);

    return txSignature;
  } catch (error) {
    throw Error(`failed to update metadata for token v1 asset: ${error}`);
  }
}

export async function fluxbeamUpdateV2Metadata(
  agent: SolanaAgentKit,
  mint: PublicKey,
  priorityFee: number,
  newName?: string,
  newSymbol?: string,
  newUri?: string,
  newUpdateAuthority?: PublicKey,
) {
  try {
    const metadata = await getToken22Metadata(agent, mint);
    // Early validation of updateAuthority
    if (!metadata.updateAuthority) {
      throw new Error("Update authority is not defined for this token");
    }

    const currentUpdateAuthority = new PublicKey(metadata.updateAuthority);
    const transaction = new Transaction();
    const unitLimit = 90_000;
    const unitPrice = Math.floor(priorityFee / unitLimit);

    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: unitLimit }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: unitPrice }),
      SystemProgram.transfer({
        fromPubkey: agent.wallet_address,
        toPubkey: FEE_ACCOUNT,
        lamports: 100,
      }),
    );

    if (newName && newName !== metadata.name) {
      console.debug(
        "getUpdateToken22MetadataTransaction::name - ",
        newName,
        metadata.name,
      );
      transaction.add(
        new TransactionInstruction({
          keys: [],
          programId: new PublicKey(
            "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
          ),
          data: Buffer.from(newName),
        }),
      );
      transaction.add(
        createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mint,
          updateAuthority: new PublicKey(currentUpdateAuthority),
          field: "name",
          value: newName,
        }),
      );
    }

    if (newSymbol && newSymbol !== metadata.symbol) {
      console.debug(
        "getUpdateToken22MetadataTransaction::symbol - ",
        newSymbol,
        metadata.symbol,
      );
      transaction.add(
        createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mint,
          updateAuthority: new PublicKey(currentUpdateAuthority),
          field: "symbol",
          value: newSymbol,
        }),
      );
    }

    if (newUri && newUri !== metadata.uri) {
      console.debug("getUpdateToken22MetadataTransaction::uri - ", {
        data: newUri,
        meta: metadata.uri,
      });
      transaction.add(
        createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mint,
          updateAuthority: new PublicKey(currentUpdateAuthority),
          field: "uri",
          value: newUri,
        }),
      );
    }

    console.debug(
      "Adjust authority",
      newUpdateAuthority,
      currentUpdateAuthority,
    );
    if (
      newUpdateAuthority &&
      newUpdateAuthority.toString() !== metadata.updateAuthority.toString()
    ) {
      console.debug(
        "getUpdateToken22MetadataTransaction::authority - ",
        currentUpdateAuthority,
        newUpdateAuthority,
      );
      const args = {
        metadata: mint,
        newAuthority: newUpdateAuthority,
        oldAuthority: new PublicKey(currentUpdateAuthority),
        programId: TOKEN_2022_PROGRAM_ID,
      };

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
        symbol: newSymbol ?? metadata.symbol,
        name: newName ?? metadata.name,
        uri: newUri ?? metadata.uri,
      }).length + 4;

    const mintLamports =
      await agent.connection.getMinimumBalanceForRentExemption(
        newMetadataLength - oldMetadataLength,
      );
    if (mintLamports > 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: agent.wallet_address,
          toPubkey: new PublicKey(mint),
          lamports: mintLamports,
        }),
      );
    }
    const txn = await signTransaction(agent, transaction);
    const response = await sendTransaction(agent, txn);

    return response.signature;
  } catch (error) {
    throw Error(
      `failed to update metadata for token v2 (token2022) asset: ${error}`,
    );
  }
}
