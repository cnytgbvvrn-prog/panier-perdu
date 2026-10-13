import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function cleSecrete(): Buffer {
  const hex = (process.env.CLE_CHIFFREMENT ?? "").trim();
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("CLE_CHIFFREMENT absente ou invalide");
  }
  return Buffer.from(hex, "hex");
}

// Transforme un texte en une valeur illisible sans la cle secrete
export function chiffrer(texte: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cleSecrete(), iv);
  const chiffre = Buffer.concat([cipher.update(texte, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, chiffre].map((b) => b.toString("base64")).join(".");
}

// Retrouve le texte d'origine (uniquement cote serveur)
export function dechiffrer(valeur: string): string {
  const [iv64, tag64, data64] = valeur.split(".");
  if (!iv64 || !tag64 || !data64) {
    throw new Error("Valeur chiffree invalide");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    cleSecrete(),
    Buffer.from(iv64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag64, "base64"));
  const clair = Buffer.concat([
    decipher.update(Buffer.from(data64, "base64")),
    decipher.final(),
  ]);
  return clair.toString("utf8");
}