import type { BaseWallet } from "../types/wallet";
import {
  ConfirmOptions,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

/**
 * Check if a transaction object is a VersionedTransaction or not
 *
 * @param tx
 * @returns bool
 */
export const isVersionedTransaction = (
  tx: Transaction | VersionedTransaction,
): tx is VersionedTransaction => {
  return "version" in tx;
};

/**
 * A wallet implementation using a Keypair for signing transactions
 */
export default class KeypairWallet implements BaseWallet {
  publicKey: PublicKey;
  private payer: Keypair;

  /**
   * Constructs a KeypairWallet with a given Keypair
   * @param keypair - The Keypair to use for signing transactions
   */
  constructor(keypair: Keypair) {
    this.publicKey = keypair.publicKey;
    this.payer = keypair;
  }

  defaultOptions: ConfirmOptions = {
    preflightCommitment: "processed",
    commitment: "processed",
  };

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T> {
    if (isVersionedTransaction(transaction)) {
      transaction.sign([this.payer]);
    } else {
      transaction.partialSign(this.payer);
    }

    return transaction;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[],
  ): Promise<T[]> {
    return txs.map((t) => {
      if (isVersionedTransaction(t)) {
        t.sign([this.payer]);
      } else {
        t.partialSign(this.payer);
      }
      return t;
    });
  }
}
