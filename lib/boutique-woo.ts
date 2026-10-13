export type ResultatTest =
  | { ok: true; urlNettoyee: string }
  | { ok: false; erreur: string };

// Verifie et nettoie l'adresse saisie. Renvoie null si elle est refusee.
export function nettoyerUrl(saisie: string): string | null {
  let texte = saisie.trim();
  if (!texte) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(texte)) texte = "https://" + texte;

  let url: URL;
  try {
    url = new URL(texte);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;

  const hote = url.hostname.toLowerCase();
  if (!hote.includes(".")) return null;
  if (hote === "localhost") return null;
  if (hote.endsWith(".local") || hote.endsWith(".internal")) return null;
  if (hote.includes(":")) return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hote)) return null;

  return `https://${hote}${url.pathname}`.replace(/\/+$/, "");
}

// Teste la connexion a la boutique avec les cles fournies (lecture seule)
export async function testerConnexion(
  urlSaisie: string,
  cle: string,
  secret: string
): Promise<ResultatTest> {
  const urlNettoyee = nettoyerUrl(urlSaisie);
  if (!urlNettoyee) {
    return {
      ok: false,
      erreur:
        "Adresse invalide. Exemple : https://maboutique.fr (en https, sans port ni identifiants).",
    };
  }

  const cleNette = cle.trim();
  const secretNet = secret.trim();
  if (!cleNette.startsWith("ck_") || !secretNet.startsWith("cs_")) {
    return {
      ok: false,
      erreur:
        "Les clés WooCommerce commencent par ck_ (clé) et cs_ (secret). Vérifiez que vous les avez bien copiées.",
    };
  }

  const autorisation =
    "Basic " + Buffer.from(`${cleNette}:${secretNet}`).toString("base64");

  try {
    const reponse = await fetch(
      `${urlNettoyee}/wp-json/wc/v3/orders?per_page=1`,
      {
        headers: { Authorization: autorisation },
        redirect: "error",
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      }
    );

    if (reponse.status === 401 || reponse.status === 403) {
      return {
        ok: false,
        erreur:
          "Clés refusées par la boutique. Vérifiez les clés et leurs droits (lecture).",
      };
    }
    if (reponse.status === 404) {
      return {
        ok: false,
        erreur:
          "WooCommerce est introuvable à cette adresse. Vérifiez l'adresse de la boutique.",
      };
    }
    if (!reponse.ok) {
      return {
        ok: false,
        erreur: `La boutique a répondu avec une erreur (${reponse.status}).`,
      };
    }

    const donnees = await reponse.json();
    if (!Array.isArray(donnees)) {
      return {
        ok: false,
        erreur: "Réponse inattendue de la boutique : est-ce bien WooCommerce ?",
      };
    }

    return { ok: true, urlNettoyee };
  } catch {
    return {
      ok: false,
      erreur:
        "Impossible de joindre la boutique. Vérifiez l'adresse (en https, sans redirection).",
    };
  }
}