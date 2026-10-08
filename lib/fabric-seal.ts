/**
 * Seal a workload's CAPPO holder credential to the one machine it was placed on.
 *
 * Byte-for-byte the format the worker opens (own-your-cloud/worker/worker.py unseal(), and
 * own-your-cloud/stack/owner.py seal()): ephemeral X25519 -> HKDF-SHA256 (no salt,
 * info "veklom-fabric-credential-v1") -> ChaCha20-Poly1305 with a random 12-byte nonce and
 * the job id as associated data -> base64(JSON {epk, nonce, ct}), each field base64.
 *
 * Runs in the customer's browser, so the website server and COMPUTLESS only ever carry the
 * sealed blob; only the chosen worker's private key opens it.
 */
import { chacha20poly1305 } from "@noble/ciphers/chacha";
import { x25519 } from "@noble/curves/ed25519";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";

const INFO = new TextEncoder().encode("veklom-fabric-credential-v1");

export interface FabricCredential {
  holder: string;
  token_id: string;
  nonce: string;
  mount_id: string;
  job_id: string;
}

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(text: string): Uint8Array {
  const raw = atob(text);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export function sealCredential(
  workerX25519PubB64: string,
  jobId: string,
  credential: FabricCredential,
  random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n)),
): string {
  const workerPub = fromB64(workerX25519PubB64);
  if (workerPub.length !== 32) throw new Error("worker key is not an X25519 public key");
  const ephPriv = random(32);
  const ephPub = x25519.getPublicKey(ephPriv);
  const shared = x25519.getSharedSecret(ephPriv, workerPub);
  const key = hkdf(sha256, shared, undefined, INFO, 32);
  const nonce = random(12);
  const plaintext = new TextEncoder().encode(JSON.stringify(credential));
  const ct = chacha20poly1305(key, nonce, new TextEncoder().encode(jobId)).encrypt(plaintext);
  const envelope = { epk: toB64(ephPub), nonce: toB64(nonce), ct: toB64(ct) };
  ephPriv.fill(0);
  key.fill(0);
  return btoa(JSON.stringify(envelope));
}

/** The worker side, for tests: open a sealed credential with the worker's private key. */
export function openSealedCredential(workerPrivate: Uint8Array, jobId: string, sealed: string): FabricCredential {
  const env = JSON.parse(atob(sealed)) as { epk: string; nonce: string; ct: string };
  const shared = x25519.getSharedSecret(workerPrivate, fromB64(env.epk));
  const key = hkdf(sha256, shared, undefined, INFO, 32);
  const pt = chacha20poly1305(key, fromB64(env.nonce), new TextEncoder().encode(jobId)).decrypt(fromB64(env.ct));
  return JSON.parse(new TextDecoder().decode(pt)) as FabricCredential;
}
