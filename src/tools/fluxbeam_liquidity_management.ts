/* eslint-disable @typescript-eslint/ban-ts-comment */
import { BN, web3 } from "@project-serum/anchor";
import {
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  createHarvestWithheldTokensToMintInstruction,
  createSyncNativeInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PoolConfig,
  TokenInput,
  TokenSwapLayout,
  TokenSwapPool,
} from "./layouts";
import { SWAP_PROGRAM_ID, WSOL } from "./constants";
import Instructions from "./instructions";
import { SolanaAgentKit } from "../agent";
import { ComputeBudgetProgram, PublicKey, Transaction } from "@solana/web3.js";
import {
  getUnwrapSOLInstruction,
  getWrapSOLInstructions,
} from "./fluxbeam_wrap_and_unwrap_sol";

export default class Client {
  connection;

  poolTokenProgramId = TOKEN_2022_PROGRAM_ID; //The program ID of the token program for the pool tokens

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async createAddLiquidityTransaction(
    agent: SolanaAgentKit,
    payer: PublicKey,
    pool: PublicKey,
    route: TokenSwapPool,
    srcMint: TokenInput,
    dstMint: TokenInput,
    poolTokenAmount: any,
    initTokenPrice = false,
    priorityFee,
  ) {
    const mintAInfo = await this.connection.getParsedAccountInfo(route.mintA);
    const mintBInfo = await this.connection.getParsedAccountInfo(route.mintB);
    const [authority] = PublicKey.findProgramAddressSync(
      [pool.toBuffer()],
      SWAP_PROGRAM_ID,
    );

    const userAccountA = getAssociatedTokenAddressSync(
      route.mintA,
      payer,
      true,
      mintAInfo.value?.owner,
    );
    const userAccountB = getAssociatedTokenAddressSync(
      route.mintB,
      payer,
      true,
      mintBInfo.value?.owner,
    );
    const userPoolTokenAccount = getAssociatedTokenAddressSync(
      route.tokenPool,
      payer,
      true,
      TOKEN_2022_PROGRAM_ID,
    );

    const balanceInfo = await this.connection.getMultipleParsedAccounts(
      [userPoolTokenAccount],
      {
        commitment: "confirmed",
      },
    );
    const [userPoolTokenAccountInfo] = balanceInfo.value;

    const unitLimit = 100_000;
    const unitPrice = Math.floor(priorityFee / unitLimit);

    const transaction = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: unitPrice,
      }),
    );

    if (route.mintA.equals(WSOL)) {
      //Do sync native checks
      const ixs = await getWrapSOLInstructions(agent, payer, srcMint.amount);
      if (ixs.length > 0) {
        transaction.add(...ixs);
      }
    }

    if (route.mintB.equals(WSOL)) {
      //Do sync native checks
      const ixs = await getWrapSOLInstructions(agent, payer, dstMint.amount);
      if (ixs.length > 0) {
        transaction.add(...ixs);
      }
    }

    if (!userPoolTokenAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payer,
          userPoolTokenAccount,
          payer,
          route.tokenPool,
          TOKEN_2022_PROGRAM_ID,
        ),
      );
    }

    console.debug("depositAllTokenTypesInstruction", {
      pool,
      mintA: route.mintA,
      mintB: route.mintB,
      poolTokenAmount: poolTokenAmount,
      tokenAAmount: srcMint.amount,
      tokenBAmount: dstMint.amount,
      srcMint,
      dstMint,
    });

    if (initTokenPrice) {
      const ratio = dstMint.amount / srcMint.amount;

      //ts-ignore
      poolTokenAmount = 1_000_000_000;

      console.log("initTokenPrice", {
        poolTokenAmount: poolTokenAmount,
        tokenA: route.mintA.toString(),
        tokenB: route.mintB.toString(),
        ratio, //b to a
        amountA: srcMint.amount,
        amountB: dstMint.amount,
        eAmountA: srcMint.amount / 2,
        eAmountB: dstMint.amount / 2,
        exactAmountInA: srcMint.amountInExact(srcMint.amount / 2),
        exactAmountInB: dstMint.amountInExact(dstMint.amount / 2),
      });

      //@ts-ignore
      transaction.add(
        createTransferCheckedInstruction(
          userAccountA,
          route.mintA,
          route.tokenAccountA,
          payer,
          srcMint.amountInExact(srcMint.amount / 2),
          mintAInfo.value?.data?.parsed?.info.decimals,
          [],
          mintAInfo.value?.owner,
        ),
      );

      //@ts-ignore
      transaction.add(
        createTransferCheckedInstruction(
          userAccountB,
          route.mintB,
          route.tokenAccountB,
          payer,
          dstMint.amountInExact(dstMint.amount / 2),
          mintBInfo.value?.data?.parsed?.info.decimals,
          [],
          mintBInfo.value?.owner,
        ),
      );

      // srcMint.amount -= srcMint.exactAmountIn(srcMint.amount/2)
      // dstMint.amount -= dstMint.exactAmountIn(dstMint.amount/2)
      srcMint.amount = srcMint.amount / 2;
      dstMint.amount = dstMint.amount / 2;
    }

    transaction.add(
      Instructions.depositAllTokenTypesInstruction(
        pool,
        authority,
        payer,
        userAccountA,
        userAccountB,
        route.tokenAccountA,
        route.tokenAccountB,
        route.tokenPool,
        userPoolTokenAccount,
        route.mintA,
        route.mintB,
        SWAP_PROGRAM_ID,
        mintAInfo.value?.owner,
        mintBInfo.value?.owner,
        TOKEN_2022_PROGRAM_ID,
        new BN(poolTokenAmount, 10),
        new BN(srcMint.amount, 10),
        new BN(dstMint.amount, 10),
      ),
    );

    if (route.mintB.equals(WSOL)) {
      //Do sync native checks
      transaction.add(await getUnwrapSOLInstruction(payer));
    }

    return transaction;
  }

  async createAddSingleSideLiquidityTransaction(
    agent: SolanaAgentKit,
    payer: PublicKey,
    pool: PublicKey,
    route: TokenSwapPool,
    srcMint: TokenInput,
    minPoolTokenAmount: BN,
    priorityFee,
  ) {
    const [authority] = PublicKey.findProgramAddressSync(
      [pool.toBuffer()],
      SWAP_PROGRAM_ID,
    );

    const userAccount = getAssociatedTokenAddressSync(
      srcMint.mint,
      payer,
      true,
      srcMint.programID,
    );
    const userPoolTokenAccount = getAssociatedTokenAddressSync(
      route.tokenPool,
      payer,
      true,
      TOKEN_2022_PROGRAM_ID,
    );

    const balanceInfo = await this.connection.getMultipleParsedAccounts(
      [userPoolTokenAccount],
      {
        commitment: "confirmed",
      },
    );
    const [userPoolTokenAccountInfo] = balanceInfo.value;

    const unitLimit = 200_000;
    const unitPrice = Math.floor(priorityFee / unitLimit);

    const transaction = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: unitPrice,
      }),
    );

    if (srcMint.mint.equals(WSOL)) {
      //Do sync native checks
      const ixs = await getWrapSOLInstructions(agent, payer, srcMint.amount);
      if (ixs.length > 0) {
        transaction.add(...ixs);
      }
    }

    if (!userPoolTokenAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payer,
          userPoolTokenAccount,
          payer,
          route.tokenPool,
          TOKEN_2022_PROGRAM_ID,
        ),
      );
    }

    console.log("amountIn", srcMint.amount);
    console.log("amountOut", minPoolTokenAmount);

    transaction.add(
      Instructions.depositSingleTokenTypeExactAmountInInstruction(
        pool,
        authority,
        payer,
        userAccount,
        route.tokenAccountA,
        route.tokenAccountB,
        route.tokenPool,
        userPoolTokenAccount,
        srcMint.mint,
        SWAP_PROGRAM_ID,
        srcMint.programID,
        TOKEN_2022_PROGRAM_ID,
        new BN(srcMint.amount),
        new BN(minPoolTokenAmount),
      ),
    );

    if (srcMint.mint.equals(WSOL)) {
      //Do sync native checks
      transaction.add(getUnwrapSOLInstruction(payer));
    }

    return transaction;
  }

  async createRemoveLiquidityTransaction(
    agent: SolanaAgentKit,
    payer: PublicKey,
    pool: PublicKey,
    route: TokenSwapPool,
    poolTokenAmount: number,
    minimumTokenA: number,
    minimumTokenB: number,
    priorityFee: number,
  ) {
    const mintAInfo = await this.connection.getParsedAccountInfo(route.mintA);
    const mintBInfo = await this.connection.getParsedAccountInfo(route.mintB);
    const [authority] = PublicKey.findProgramAddressSync(
      [pool.toBuffer()],
      SWAP_PROGRAM_ID,
    );

    const userAccountA = getAssociatedTokenAddressSync(
      route.mintA,
      payer,
      true,
      mintAInfo.value?.owner,
    );
    const userAccountB = getAssociatedTokenAddressSync(
      route.mintB,
      payer,
      true,
      mintBInfo.value?.owner,
    );
    const userPoolTokenAccount = getAssociatedTokenAddressSync(
      route.tokenPool,
      payer,
      true,
      TOKEN_2022_PROGRAM_ID,
    );

    const balanceInfo = await this.connection.getMultipleParsedAccounts([
      userAccountA,
      userAccountB,
      route.tokenAccountA,
      route.tokenAccountB,
      userPoolTokenAccount,
    ]);

    const [uAInfo, uBInfo, tAInfo, tBInfo, spInfo] = balanceInfo.value;

    console.log({
      //@ts-ignore
      userAccountAAmount: uAInfo?.data.parsed.info.tokenAmount.amount,
      //@ts-ignore
      userAccountBAmount: uBInfo?.data.parsed.info.tokenAmount.amount,
      //@ts-ignore
      tokenAccountAAmount: tAInfo?.data.parsed.info.tokenAmount.amount,
      //@ts-ignore
      tokenAccountBAmount: tBInfo?.data.parsed.info.tokenAmount.amount,
      //@ts-ignore
      sourcePoolAccountAmount: spInfo?.data.parsed.info.tokenAmount.amount,
    });

    const unitLimit = 200_000;
    const unitPrice = Math.floor(priorityFee / unitLimit);

    const transaction = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: unitPrice,
      }),
    );
    // deposit_all_token_types  deposit_single_token_type_exact_amount_in

    //Create wSOL account
    if (route.mintA.equals(WSOL) || route.mintB.equals(WSOL)) {
      const ixs = await getWrapSOLInstructions(agent, payer, 0);
      if (ixs.length > 0) {
        transaction.add(...ixs);
      }
    }

    if (!uAInfo?.data && !route.mintA.equals(WSOL)) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payer,
          userAccountA,
          payer,
          route.mintA,
          mintAInfo.value?.owner,
        ),
      );
    }

    if (!uBInfo?.data && !route.mintB.equals(WSOL)) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payer,
          userAccountB,
          payer,
          route.mintB,
          mintBInfo.value?.owner, //non null assertion was removed here
        ),
      );
    }

    transaction.add(
      Instructions.withdrawAllTokenTypesInstruction(
        pool,
        authority,
        payer,
        route.tokenPool,
        route.feeAccount,
        userPoolTokenAccount,
        route.tokenAccountA,
        route.tokenAccountB,
        userAccountA,
        userAccountB,
        route.mintA,
        route.mintB,
        SWAP_PROGRAM_ID,
        TOKEN_2022_PROGRAM_ID,
        mintAInfo.value?.owner,
        mintBInfo.value?.owner,
        poolTokenAmount,
        minimumTokenA,
        minimumTokenB,
      ),
    );

    //Unwrap sol
    if (route.mintA.equals(WSOL) || route.mintB.equals(WSOL)) {
      transaction.add(getUnwrapSOLInstruction(payer));
    }

    return transaction;
  }

  //TODO Test
  async createRemoveSingleSideLiquidityTransaction(
    agent: SolanaAgentKit,
    payer: PublicKey,
    pool: PublicKey,
    route: TokenSwapPool,
    dstMint: TokenInput,
    poolTokenAmount: number,
    priorityFee: number,
  ) {
    const mintInfo = await agent.connection.getParsedAccountInfo(dstMint.mint);
    const [authority] = PublicKey.findProgramAddressSync(
      [pool.toBuffer()],
      SWAP_PROGRAM_ID,
    );

    const userAccount = getAssociatedTokenAddressSync(
      dstMint.mint,
      payer,
      true,
      mintInfo.value?.owner,
    );

    const userPoolTokenAccount = getAssociatedTokenAddressSync(
      route.tokenPool,
      payer,
      true,
      TOKEN_2022_PROGRAM_ID,
    );

    const balanceInfo = await agent.connection.getMultipleParsedAccounts([
      userAccount,
      route.tokenAccountA,
      route.tokenAccountB,
      userPoolTokenAccount,
    ]);

    const [uAInfo, tAInfo, tBInfo, spInfo] = balanceInfo.value;

    console.log({
      //@ts-ignore
      userAccountAAmount: uAInfo?.data.parsed.info.tokenAmount.amount,
      //@ts-ignore
      tokenAccountAAmount: tAInfo?.data.parsed.info.tokenAmount.amount,
      //@ts-ignore
      tokenAccountBAmount: tBInfo?.data.parsed.info.tokenAmount.amount,
      //@ts-ignore
      sourcePoolAccountAmount: spInfo?.data.parsed.info.tokenAmount.amount,
    });

    const unitLimit = 200_000;
    const unitPrice = Math.floor(priorityFee / unitLimit);

    const transaction = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: unitPrice,
      }),
    );

    //Create wSOL account
    if (dstMint.mint.equals(WSOL)) {
      const ixs = await getWrapSOLInstructions(agent, payer, 0);
      if (ixs.length > 0) {
        transaction.add(...ixs);
      }
    }

    if (!uAInfo?.data && !dstMint.mint.equals(WSOL)) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payer,
          userAccount,
          payer,
          route.mintB,
          mintInfo.value?.owner,
        ),
      );
    }

    transaction.add(
      Instructions.withdrawSingleTokenTypeExactAmountOutInstruction(
        pool,
        authority,
        payer,
        route.tokenPool,
        route.feeAccount,
        userPoolTokenAccount,
        route.tokenAccountA,
        route.tokenAccountB,
        userAccount,
        dstMint.mint,
        SWAP_PROGRAM_ID,
        TOKEN_2022_PROGRAM_ID,
        mintInfo.value?.owner,
        new BN(dstMint.amount, 10),
        new BN(poolTokenAmount),
      ),
    );

    //Unwrap sol
    if (dstMint.mint.equals(WSOL)) {
      transaction.add(getUnwrapSOLInstruction(payer));
    }

    return transaction;
  }

  hasTransferFeeConfig(mintInfo: any): boolean {
    if (!TOKEN_2022_PROGRAM_ID.equals(mintInfo.value?.owner)) {
      return false;
    }

    return (
      mintInfo.value?.data.parsed?.info.extensions?.filter(
        (ex: any) => ex.extension === "transferFeeConfig",
      ).length > 0
    );
  }
}
