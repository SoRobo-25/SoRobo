import { Keypair, PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "../src";
import { TOKENS } from "../src/constants";
import { Chain, fluxbeamBridgeTokens } from "../src/tools/fluxbeam_bridge_tokens";
import { fluxbeamMintToAccount, fluxbeamRevokeAuthority, fluxbeamSetAuthority } from "../src/tools/fluxbeam_token_minting_controls";
import { AuthorityType, createMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

const createMintToken = async () => {
  const agent = new SolanaAgentKit(
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    },
  );
  const mintKeypair = Keypair.generate();
  //create the mint to use for testing
  const testV2Mint = await createMint(
    agent.connection,
    agent.wallet,
    agent.wallet_address,
    agent.wallet_address,
    0,
    mintKeypair,
    {
      skipPreflight: false,
      commitment: "finalized",
      preflightCommitment: "finalized",
      maxRetries: 3,
    },
    TOKEN_2022_PROGRAM_ID,
  );
  console.log(testV2Mint)
}

const testTokenMintingControls = async () => {
  const agent = new SolanaAgentKit(
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    },
  );
  // Generate a new authority keypair
  // const newAuthority = Keypair.generate();

  // console.log( `this is the newAuthority's secret key ${newAuthority.secretKey}`);

    const testV2MintAddress = new PublicKey(
      "GHUMbWGBSYrRuS7ifkhUk2fEaNwzzSQV9kxPtogVBnpT",
    );

    const signature1 = await fluxbeamMintToAccount(
      agent,
      agent.wallet_address,
      testV2MintAddress,
      BigInt(123456789),
    );
    console.log(`this is signature for mintTo method ${signature1}`);

    const newAuthority = Keypair.fromSecretKey(
        Uint8Array.from([
        12, 176, 2, 136, 152, 18, 53, 59, 60, 110, 175, 154, 181, 4, 218, 104,
        //...... secret key bytes
        ]),
    );


    const signature2 = await fluxbeamSetAuthority(
      agent,
      agent.wallet_address,
      testV2MintAddress,
      AuthorityType.MintTokens,
      newAuthority.publicKey,
    );
    console.log(`this is signature for set authority method ${signature2}`);

  //if it says owner does not match - then you are not signing with the current mint authority, add it in additional signers and make the owner the new authority 
    const signature3 = await fluxbeamRevokeAuthority(
      agent,
      newAuthority.publicKey,
      testV2MintAddress,
      AuthorityType.MintTokens,
      true,
      100_000_000,
      [newAuthority]
    );
    console.log(`this is signature for revoke authority method txn${signature3}`);
};

// createMintToken()
testTokenMintingControls()
