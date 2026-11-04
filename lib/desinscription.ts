import { createHmac, timingSafeEqual } from "crypto";

function adresseSite(): string {
  const adresse =
    process.env.NEXT_PUBLIC_SITE_URL || "https://panier-perdu-plum.vercel.app";
  return adresse.replace(/\/+$/, "");
}

export function normaliserEmail(email: string): string {
  return email.trim().toLowerCase();
}

function signer(clientId: string, email: string): string {
  const base = process.env.CLE_CHIFFREMENT;
  if (!base) {
    throw new Error("CLE_CHIFFREMENT manquante");
  }
  const cle = createHmac("sha256", base).update("desinscription-v1").digest();
  return createHmac("sha256", cle)
    .update(`${clientId}|${normaliserEmail(email)}`)
    .digest("hex");
}

export function verifierSignature(
  clientId: string,
  email: string,
  signature: string
): boolean {
  try {
    const attendue = Buffer.from(signer(clientId, email), "hex");
    const recue = Buffer.from(signature, "hex");
    if (attendue.length !== recue.length) return false;
    return timingSafeEqual(attendue, recue);
  } catch {
    return false;
  }
}

export function construireLienDesinscription(
  clientId: string,
  email: string
): string {
  const parametres = new URLSearchParams({
    c: clientId,
    e: normaliserEmail(email),
    s: signer(clientId, email),
  });
  return `${adresseSite()}/desinscription?${parametres.toString()}`;
}