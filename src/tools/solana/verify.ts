/**
 * Verifies a Solana program using the given GitHub repository and program ID.
 *
 * @param {string} github - The GitHub repository URL.
 * @param {string} program_id - The Solana program ID.
 * @param {string} [commit] - The specific commit hash to verify (optional).
 * @returns {Promise<string>} - A promise that resolves to the verification response data.
 * @throws {Error} - Throws an error if the program ID is invalid or if the verification request fails.
 */
export async function verifySolanaProgram(
  program_id: string,
  github: string,
  commit?: string,
): Promise<string> {
  try {
    const verifyResponse = await fetch("https://verify.osec.io/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        program_id,
        repository: github,
        commit_hash: commit ? commit : "latest",
      }),
    });

    const data = await verifyResponse.json();

    return JSON.stringify(data);
  } catch (err: any) {
    throw new Error("Error in verifySolanaProgram: " + JSON.stringify(err));
  }
}

/**
 * Check if a solana program is verified or not
 * @async
 * @param {string} programId - The Solana program ID.
 */
export async function getProgramVerificationStatus(programId: string) {
  try {
    const res = await fetch(`https://verify.osec.io/status/${programId}`);

    const status = await res.json();

    return status;
  } catch (err: any) {
    throw new Error(
      "Error in getProgramVerificationStatus: " + JSON.stringify(err),
    );
  }
}
