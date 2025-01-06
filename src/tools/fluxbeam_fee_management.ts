import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createWithdrawWithheldTokensFromMintInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { SolanaAgentKit } from "../agent";

const baseURI = "https://api.fluxbeam.xyz/v1";
const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);
const FEE_ACCOUNTS = [
  new PublicKey("FEE1M4bRtos7Yi8cni9s6zpxDfZTSsARwrhqMJMLLKhv"),
  // new PublicKey("FEE2qEfVjE64bdT9SXRa4ALvm4tFcwg7WE8ArQDuTjuD"),
  // new PublicKey("FEE3veNwA943NP38BB968i3Zo1Mjxtn9bkHN8eK8UKHS"),
  // new PublicKey("FEE4hmPcfXNTgscRrqpjnQQiNjdQN4XGVVZQqHgFYcNT"),
  // new PublicKey("FEE5sDtT4N7AsGnsBNxB9EUEMTnRoJqZ56FZubsDKTxm"),
  // new PublicKey("FEE6Ytka6NhFKNN9mJrGGGomSMs1Dk7GDXEwdjoiwt6t"),
  // new PublicKey("FEE7HqiD7CCv9bYrWhfFou8naYdhZU78C6KdWV8kLouY"),
  // new PublicKey("FEE8ZTYvsC3CLe8YnkN4vXikxnUcecmDB5D8ShXAAqPW"),
  // new PublicKey("FEE9Z48Pdm7Dt1pr5kCZ1gwt6hWX5Kmohk45SBJHXmZX"),
];

/**
 * Get cluster status
 */
export async function clusterStatus() {
  const resp = await fetch(uri(`status`));
  if (resp.status !== 200) {
    throw new Error(resp.statusText);
  }

  return await resp.json();
}

/**
 * Get job details
 */
export async function getJob(pk: string) {
  const response = await fetch(uri(`jobs/${pk}`));
  if (!response.ok) {
    throw new Error(`Failed to fetch job: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get history for a mint
 */
export async function getHistory(mint: PublicKey): Promise<any> {
  const response = await fetch(uri(`history/${mint}`));
  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Restart a job
 */
export async function restartJob(pk: string) {
  const response = await fetch(uri(`jobs/${pk}/restart`), {
    method: "PUT",
  });
  if (!response.ok) {
    throw new Error(`Failed to restart job: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get quote for fee payment
 */
export async function quote(
  agent: SolanaAgentKit,
  pk: PublicKey,
  mint: PublicKey,
) {
  const response = await fetch(uri(`jobs/quote`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payer: agent.wallet_address.toBase58(),
      mint: mint.toBase58(),
      pipeline: "Fee Manager",
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to get quote: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Submit a job
 */
export async function submitJob(
  quote: string | Record<string, any>,
  hash: string,
  signature: string,
) {
  const response = await fetch(uri(`jobs`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quote,
      hash,
      signature,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit job: ${response.statusText}`);
  }
  return response.json();
}

export function uri(endpoint: string) {
  return `${baseURI}/workflow/${endpoint}`;
}

export function feeAccount(): PublicKey {
  return FEE_ACCOUNTS[Math.floor(Math.random() * FEE_ACCOUNTS.length)];
}

/**
 * Submit fee payment transaction
 */
export async function submitFeePayment(
  agent: SolanaAgentKit,
  quoteReq: { quote: any },
  priorityFee: number,
): Promise<string> {
  try {
    const quote = quoteReq.quote;
    // eslint-disable-next-line no-console
    console.log("buildFeeTransaction", { quoteReq, quote, priorityFee });
    const transaction = new Transaction();
    const unit_limit = 160_000;

    // Add compute budget instructions
    const unitPrice = Math.floor(priorityFee / unit_limit);
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: unit_limit }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: unitPrice }),
      SystemProgram.transfer({
        fromPubkey: new PublicKey(quote.payer), //agent.wallet_address,
        toPubkey: feeAccount(),
        lamports: quote.fee,
      }),
      new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(btoa(JSON.stringify(quoteReq))),
      }),
    );

    // Set transaction parameters
    const { blockhash } = await agent.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = agent.wallet_address;

    // Sign and send transaction
    const signature = await agent.connection.sendTransaction(transaction, [
      agent.wallet,
    ]);

    return signature;
  } catch (error: any) {
    throw new Error(`Fee payment failed: ${error.message}`);
  }
}

/**
 * Submit claim transaction
 */
export async function submitClaim(
  agent: SolanaAgentKit,
  quoteReq: { quote: any },
  payer: PublicKey,
  mint: PublicKey,
  priorityFee: number,
): Promise<string> {
  try {
    const { quote } = quoteReq;

    const transaction = new Transaction();
    const unitLimit = 160_000;
    const unitPrice = Math.floor(priorityFee / unitLimit);

    const dstAcc = getAssociatedTokenAddressSync(
      mint,
      payer,
      true,
      TOKEN_2022_PROGRAM_ID,
    );

    //build claim transaction
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: unitLimit }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: unitPrice,
      }),
      createWithdrawWithheldTokensFromMintInstruction(
        mint,
        dstAcc,
        payer,
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    );

    // Set transaction parameters
    const bhash = await agent.connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = bhash.blockhash;
    transaction.feePayer = agent.wallet_address;

    // Sign and send transaction
    const signature = await agent.connection.sendTransaction(transaction, [
      agent.wallet,
    ]);

    return signature;
  } catch (error: any) {
    throw new Error(`Fee payment failed: ${error.message}`);
  }
}
