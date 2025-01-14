// import { web3 } from "@project-serum/anchor";
// import { Numberu64, Schedule } from "@bonfida/token-vesting";
// import {
//   createAssociatedTokenAccountInstruction,
//   getAssociatedTokenAddress,
//   getAssociatedTokenAddressSync,
//   TOKEN_PROGRAM_ID,
// } from "@solana/spl-token";
// import {
//   PublicKey,
//   SystemProgram,
//   SYSVAR_CLOCK_PUBKEY,
//   TransactionInstruction,
// } from "@solana/web3.js";
// import { createInitInstruction } from "@bonfida/token-vesting/src/instructions";
// import { getContractInfo } from "@bonfida/token-vesting/src/main";
// import { ContractInfo } from "@bonfida/token-vesting/src/state";
// import { SolanaAgentKit } from "../agent";

// const PROGRAM_ID = new PublicKey("Lock1zcQFoaZmTk59sr9pB5daFE6Cs1K5eWyRLF1eju");

// export class Seed {
//   mint;
//   releaseTime: Numberu64;

//   constructor(mint: PublicKey, releaseTime: Numberu64) {
//     this.mint = mint;
//     this.releaseTime = releaseTime;
//   }

//   async toString() {
//     const encoder = new TextEncoder();
//     const dataUint8 = encoder.encode(
//       JSON.stringify({
//         mint: this.mint.toString(),
//         time: this.releaseTime.toString(),
//       }),
//     );
//     const hashBuffer = await crypto.subtle.digest("SHA-256", dataUint8);
//     const hashArray = Array.from(new Uint8Array(hashBuffer));
//     return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
//   }
// }

// export async function lockers(agent: SolanaAgentKit, mint: PublicKey) {
//   const resp = await agent.connection.getProgramAccounts(PROGRAM_ID, {
//     commitment: "processed",
//     filters: [
//       {
//         memcmp: {
//           offset: 32,
//           bytes: mint.toString(),
//         },
//       },
//       {
//         memcmp: {
//           offset: 32 + 32 + 1,
//           bytes: "",
//         },
//       },
//     ],
//   });
//   return resp.map((m) => {
//     return {
//       pubkey: m.pubkey,
//       account: ContractInfo.fromBuffer(m.account.data),
//     };
//   });
// }

// async function locker(agent: SolanaAgentKit, locker: PublicKey) {
//   return await getContractInfo(agent.connection, locker);
// }

// export async function create(
//   payer: PublicKey,
//   owner: PublicKey,
//   mint: PublicKey,
//   tokenProgram: PublicKey,
//   schedules: Schedule[],
// ): Promise<TransactionInstruction[]> {
//   const seedWord = await new Seed(mint, schedules[0].releaseTime).toString();
//   return _create(
//     Buffer.from(seedWord),
//     payer,
//     owner,
//     mint,
//     tokenProgram,
//     schedules,
//   );
// }

// export async function unlock(
//   agent: SolanaAgentKit,
//   payer: PublicKey,
//   mint: PublicKey,
//   tokenProgram: PublicKey,
//   schedule: Schedule,
// ): Promise<TransactionInstruction[]> {
//   const seedWord = await new Seed(mint, schedule.releaseTime).toString();
//   return _unlock(agent, Buffer.from(seedWord), payer, mint, tokenProgram);
// }

// /**
//  * This function can be used to lock tokens
//  * @param seedWord Seed words used to derive the vesting account
//  * @param payer The fee payer of the transaction
//  * @param sourceTokenOwner The owner of the source token account (i.e where locked tokens are originating from)
//  * @param possibleSourceTokenPubkey The source token account (i.e where locked tokens are originating from), if null it defaults to the ATA
//  * @param destinationTokenPubkey The destination token account i.e where unlocked tokens will be transfered
//  * @param mintAddress The mint of the tokens being vested
//  * @param schedules The array of vesting schedules
//  * @param tokenProgram The token program for the mint
//  * @returns An array of `TransactionInstruction`
//  */
// export async function _create(
//   seedWord: Buffer | Uint8Array,
//   payer: PublicKey,
//   sourceTokenOwner: PublicKey,
//   mintAddress: PublicKey,
//   tokenProgram: PublicKey,
//   schedules: Array<Schedule>,
// ): Promise<Array<TransactionInstruction>> {
//   const sourceTokenPubkey = getAssociatedTokenAddressSync(
//     mintAddress,
//     sourceTokenOwner,
//     true,
//     tokenProgram,
//   );
//   const destinationTokenPubkey = sourceTokenPubkey;

//   // Find the non reversible public key for the vesting contract via the seed
//   seedWord = seedWord.slice(0, 31);
//   const [vestingAccountKey, bump] = PublicKey.findProgramAddressSync(
//     [seedWord],
//     PROGRAM_ID,
//   );

//   const vestingTokenAccountKey = await getAssociatedTokenAddress(
//     mintAddress,
//     vestingAccountKey,
//     true,
//     tokenProgram,
//   );

//   seedWord = Buffer.from(seedWord.toString("hex") + bump.toString(16), "hex");

//   return [
//     createInitInstruction(
//       SystemProgram.programId,
//       PROGRAM_ID,
//       payer,
//       vestingAccountKey,
//       [seedWord],
//       schedules.length,
//     ),
//     createAssociatedTokenAccountInstruction(
//       payer,
//       vestingTokenAccountKey,
//       vestingAccountKey,
//       mintAddress,
//       tokenProgram,
//     ),
//     createCreateInstruction(
//       PROGRAM_ID,
//       tokenProgram,
//       vestingAccountKey,
//       vestingTokenAccountKey,
//       sourceTokenOwner,
//       sourceTokenPubkey,
//       destinationTokenPubkey,
//       mintAddress,
//       schedules,
//       [seedWord],
//     ),
//   ];
// }

// export function createCreateInstruction(
//   vestingProgramId: PublicKey,
//   tokenProgramId: PublicKey,
//   vestingAccountKey: PublicKey,
//   vestingTokenAccountKey: PublicKey,
//   sourceTokenAccountOwnerKey: PublicKey,
//   sourceTokenAccountKey: PublicKey,
//   destinationTokenAccountKey: PublicKey,
//   mintAddress: PublicKey,
//   schedules: Array<Schedule>,
//   seeds: Array<Buffer | Uint8Array>,
// ): TransactionInstruction {
//   const buffers = [
//     Buffer.from(Uint8Array.from([1]).buffer),
//     Buffer.concat(seeds),
//     mintAddress.toBuffer(),
//     destinationTokenAccountKey.toBuffer(),
//   ];

//   schedules.forEach((s) => {
//     buffers.push(s.toBuffer());
//   });

//   const data = Buffer.concat(buffers);
//   const keys = [
//     {
//       pubkey: tokenProgramId,
//       isSigner: false,
//       isWritable: false,
//     },
//     {
//       pubkey: vestingAccountKey,
//       isSigner: false,
//       isWritable: true,
//     },
//     {
//       pubkey: vestingTokenAccountKey,
//       isSigner: false,
//       isWritable: true,
//     },
//     {
//       pubkey: sourceTokenAccountOwnerKey,
//       isSigner: true,
//       isWritable: false,
//     },
//     {
//       pubkey: sourceTokenAccountKey,
//       isSigner: false,
//       isWritable: true,
//     },
//     {
//       pubkey: mintAddress,
//       isSigner: false,
//       isWritable: false,
//     },
//   ];
//   return new TransactionInstruction({
//     keys,
//     programId: vestingProgramId,
//     data,
//   });
// }

// /**
//  * This function can be used to unlock vested tokens
//  * @param seedWord Seed words used to derive the vesting account
//  * @param payer The payer or owner of the locker - if the owner does not own the dest account then an error is returned
//  * @param mintAddress The mint of the vested tokens
//  * @param tokenProgram The token program for the mint
//  * @returns An array of `TransactionInstruction`
//  */
// export async function _unlock(
//   agent: SolanaAgentKit,
//   seedWord: Buffer | Uint8Array,
//   payer: PublicKey,
//   mintAddress: PublicKey,
//   tokenProgram: PublicKey,
// ): Promise<Array<TransactionInstruction>> {
//   seedWord = seedWord.slice(0, 31);
//   const [vestingAccountKey, bump] = PublicKey.findProgramAddressSync(
//     [seedWord],
//     PROGRAM_ID,
//   );
//   seedWord = Buffer.from(seedWord.toString("hex") + bump.toString(16), "hex");

//   const vestingTokenAccountKey = await getAssociatedTokenAddress(
//     mintAddress,
//     vestingAccountKey,
//     true,
//     tokenProgram,
//   );

//   console.log("VestingAccountKey", vestingAccountKey.toString());
//   const accInfo = await agent.connection.getAccountInfo(
//     vestingAccountKey,
//     "processed",
//   );
//   if (!accInfo) {
//     throw new Error("Vesting contract account is unavailable");
//   }
//   const vestingInfo = ContractInfo.fromBuffer(accInfo!.data);
//   if (!vestingInfo) {
//     throw new Error("Vesting contract account is not initialized");
//   }

//   const res = await agent.connection.getMultipleAccountsInfo(
//     [vestingInfo.destinationAddress, mintAddress],
//     { commitment: "processed" },
//   );
//   const [destinationInfo, mintInfo] = res;

//   const unlockIx = createUnlockInstruction(
//     PROGRAM_ID,
//     tokenProgram,
//     SYSVAR_CLOCK_PUBKEY,
//     vestingAccountKey,
//     vestingTokenAccountKey,
//     vestingInfo.destinationAddress,
//     mintAddress,
//     [seedWord],
//   );

//   if (!destinationInfo) {
//     //Check if signer is the destination (otherwise below create IX wont work)
//     const ata = getAssociatedTokenAddressSync(
//       mintAddress,
//       payer,
//       false,
//       mintInfo?.owner,
//     );
//     if (ata.toString() !== vestingInfo.destinationAddress.toString()) {
//       throw new Error("Signer does not match destination address");
//     }

//     const createIx = createAssociatedTokenAccountInstruction(
//       payer,
//       vestingInfo.destinationAddress,
//       payer,
//       mintAddress,
//       mintInfo?.owner,
//     );

//     return [createIx, unlockIx];
//   }

//   return [unlockIx];
// }
// export function createUnlockInstruction(
//   vestingProgramId: PublicKey,
//   tokenProgramId: PublicKey,
//   clockSysvarId: PublicKey,
//   vestingAccountKey: PublicKey,
//   vestingTokenAccountKey: PublicKey,
//   destinationTokenAccountKey: PublicKey,
//   mintAddress: PublicKey,
//   seeds: Array<Buffer | Uint8Array>,
// ): TransactionInstruction {
//   const data = Buffer.concat([
//     Buffer.from(Uint8Array.from([2]).buffer),
//     Buffer.concat(seeds),
//   ]);

//   const keys = [
//     {
//       pubkey: tokenProgramId,
//       isSigner: false,
//       isWritable: false,
//     },
//     {
//       pubkey: clockSysvarId,
//       isSigner: false,
//       isWritable: false,
//     },
//     {
//       pubkey: vestingAccountKey,
//       isSigner: false,
//       isWritable: true,
//     },
//     {
//       pubkey: vestingTokenAccountKey,
//       isSigner: false,
//       isWritable: true,
//     },
//     {
//       pubkey: destinationTokenAccountKey,
//       isSigner: false,
//       isWritable: true,
//     },
//     {
//       pubkey: mintAddress,
//       isSigner: false,
//       isWritable: false,
//     },
//   ];
//   return new TransactionInstruction({
//     keys,
//     programId: vestingProgramId,
//     data,
//   });
// }

// export async function lockAuthority(
//   mint: PublicKey,
//   tokenProgram: PublicKey,
//   schedule: Schedule,
//   authorityType: number,
// ) {
//   const seedWord = await new Seed(mint, schedule.releaseTime).toString();
//   return _lockAuthority(
//     Buffer.from(seedWord),
//     mint,
//     tokenProgram,
//     authorityType,
//   );
// }

// export async function unlockAuthority(
//   mint: PublicKey,
//   tokenProgram: PublicKey,
//   schedule: Schedule,
//   authorityType: number,
// ) {
//   const seedWord = await new Seed(mint, schedule.releaseTime).toString();
//   return _unlockAuthority(
//     Buffer.from(seedWord),
//     mint,
//     tokenProgram,
//     authorityType,
//   );
// }

// export async function _lockAuthority(
//   seedWord: Buffer | Uint8Array,
//   mintAddress: PublicKey,
//   tokenProgram: PublicKey,
//   authorityType: number,
// ) {}

// export async function _unlockAuthority(
//   seedWord: Buffer | Uint8Array,
//   mintAddress: PublicKey,
//   tokenProgram: PublicKey,
//   authorityType: number,
// ) {}
