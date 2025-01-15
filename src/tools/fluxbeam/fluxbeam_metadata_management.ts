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
import { PublicKey } from "@solana/web3.js";

export async function fluxbeamUpdateV1Metadata(
  agent: SolanaAgentKit,
  mint: PublicKey,
  name: string,
  symbol: string,
  uri: string,
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
      data: { ...initialMetadata, symbol: symbol, name: name, uri: uri },
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
  name: string,
  symbol: string,
  uri: string,
) {
  try {
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
      authority: updateAuthority,
      mint: fromWeb3JsPublicKey(mint),
      data: { ...initialMetadata, symbol: symbol, name: name, uri: uri },
    }).sendAndConfirm(umi);

    const txSignature = bs58.default.encode(txId.signature);

    return txSignature;
  } catch (error) {
    throw Error(
      `failed to update metadata for token v2 (token2022) asset: ${error}`,
    );
  } // mint: fromWeb3JsPublicKey(mint),
}
