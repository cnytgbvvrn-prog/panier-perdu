import { nettoyerUrl } from "@/lib/boutique-woo";

export type CommandeWoo = {
  id: number;
  total: string;
  currency: string;
  date_created_gmt: string;
  billing?: { email?: string };
};

// Lit les commandes en attente d'une boutique, avec les cles de CE client
export async function getCommandesEnAttente(
  urlBoutique: string,
  cle: string,
  secret: string
): Promise<CommandeWoo[]> {
  const base = nettoyerUrl(urlBoutique);
  if (!base) {
    throw new Error("Adresse de boutique invalide");
  }

  const autorisation =
    "Basic " + Buffer.from(`${cle}:${secret}`).toString("base64");

  const reponse = await fetch(
    `${base}/wp-json/wc/v3/orders?status=pending&per_page=100`,
    {
      headers: { Authorization: autorisation },
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    }
  );

  if (!reponse.ok) {
    throw new Error(`Erreur WooCommerce : ${reponse.status}`);
  }

  const donnees = await reponse.json();
  if (!Array.isArray(donnees)) {
    throw new Error("Reponse WooCommerce inattendue");
  }

  return donnees as CommandeWoo[];
}

// Lit l'etat d'une commande (pending, processing, completed...).
// Renvoie null si la commande n'existe plus dans la boutique.
export async function getStatutCommande(
  urlBoutique: string,
  cle: string,
  secret: string,
  commandeId: string
): Promise<string | null> {
  const base = nettoyerUrl(urlBoutique);
  if (!base) {
    throw new Error("Adresse de boutique invalide");
  }

  if (!/^[0-9]+$/.test(commandeId)) {
    throw new Error("Identifiant de commande invalide");
  }

  const autorisation =
    "Basic " + Buffer.from(`${cle}:${secret}`).toString("base64");

  const reponse = await fetch(
    `${base}/wp-json/wc/v3/orders/${commandeId}?_fields=id,status`,
    {
      headers: { Authorization: autorisation },
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    }
  );

  if (reponse.status === 404) {
    return null;
  }

  if (!reponse.ok) {
    throw new Error(`Erreur WooCommerce : ${reponse.status}`);
  }

  const donnees = await reponse.json();
  if (!donnees || typeof donnees.status !== "string") {
    throw new Error("Reponse WooCommerce inattendue");
  }

  return donnees.status;
}