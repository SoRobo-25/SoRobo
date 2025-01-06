import { PublicKey } from "@solana/web3.js";

const baseURI = "https://api.fluxbeam.xyz/v1";

export async function search(query: string, page: number = 0) {
  return await (await fetch(uri(`search?q=${query}&page=${page}`))).json();
}

export async function pools(page: number, limit = 100) {
  return await (await fetch(uri(`pools?limit=${limit}&page=${page}`))).json();
}

export async function pool(pk: PublicKey) {
  return (await fetch(uri(`pools/${pk}`))).json();
}

export async function poolByTicker(ticker: string) {
  return (await fetch(uri(`pool-tickers/${ticker}`))).json();
}

export async function poolByMint(ticker: string) {
  return (await fetch(uri(`pool-mints/${ticker}`))).json();
}

export async function listings(ticker: string) {
  return (await fetch(uri(`pool-listings/${ticker.toLowerCase()}`))).json();
}

export function uri(endpoint: string) {
  return `${baseURI}/spl22/${endpoint}`;
}
