import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getCommandesEnAttente,
  getStatutCommande,
} from "@/lib/woocommerce";
import { dechiffrer } from "@/lib/chiffrement";
import { estAutorise } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ClientBoutique = {
  id: string;
  woo_url: string;
  woo_cle_chiffree: string;
  woo_secret_chiffre: string;
};

type ResultatClient = {
  client: string;
  paniers?: number;
  recuperes?: number;
  erreur?: string;
};

// Statuts WooCommerce qui veulent dire : la commande a ete payee
const STATUTS_PAYES = ["processing", "completed"];

// Nombre maximum de paniers verifies par client et par passage
const MAX_VERIFICATIONS = 50;

export async function GET(request: Request) {
  if (!estAutorise(request)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // Les clients actifs qui ont connecte une boutique
  const { data, error } = await supabase
    .from("clients")
    .select("id, woo_url, woo_cle_chiffree, woo_secret_chiffre")
    .eq("abonnement_actif", true)
    .not("woo_url", "is", null)
    .not("woo_cle_chiffree", "is", null)
    .not("woo_secret_chiffre", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const clients = (data ?? []) as ClientBoutique[];
  const resultats: ResultatClient[] = [];
  let total = 0;
  let totalRecuperes = 0;

  // Chaque client est traite separement : une boutique en panne ne bloque pas les autres
  for (const client of clients) {
    const entree: ResultatClient = { client: client.id };
    let cle = "";
    let secret = "";
    let boutiqueOk = false;

    // Partie 1 : enregistrer les commandes en attente
    try {
      cle = dechiffrer(client.woo_cle_chiffree);
      secret = dechiffrer(client.woo_secret_chiffre);
      const commandes = await getCommandesEnAttente(client.woo_url, cle, secret);

      const lignes = commandes.map((c) => ({
        client_id: client.id,
        commande_woo_id: String(c.id),
        email_acheteur: c.billing?.email || null,
        montant: Number(c.total),
        devise: c.currency,
        date_abandon: c.date_created_gmt + "Z",
      }));

      if (lignes.length > 0) {
        const { error: erreurEcriture } = await supabase
          .from("paniers_abandonnes")
          .upsert(lignes, {
            onConflict: "client_id,commande_woo_id",
            ignoreDuplicates: true,
          });

        if (erreurEcriture) {
          throw new Error("Ecriture : " + erreurEcriture.message);
        }
      }

      total += lignes.length;
      entree.paniers = lignes.length;
      boutiqueOk = true;
    } catch (e) {
      entree.erreur = e instanceof Error ? e.message : "erreur inconnue";
    }

    // Partie 2 : reperer les paniers relances puis payes (ventes recuperees)
    if (boutiqueOk) {
      try {
        const { data: aVerifier, error: erreurLecture } = await supabase
          .from("paniers_abandonnes")
          .select("id, commande_woo_id")
          .eq("client_id", client.id)
          .eq("relance_envoyee", true)
          .eq("recupere", false)
          .limit(MAX_VERIFICATIONS);

        if (erreurLecture) {
          throw new Error("Lecture : " + erreurLecture.message);
        }

        let recuperes = 0;

        for (const panier of aVerifier ?? []) {
          const statut = await getStatutCommande(
            client.woo_url,
            cle,
            secret,
            String(panier.commande_woo_id)
          );

          if (statut && STATUTS_PAYES.includes(statut)) {
            // Condition recupere=false : un panier ne peut etre compte qu'une seule fois
            const { data: modifies, error: erreurMaj } = await supabase
              .from("paniers_abandonnes")
              .update({ recupere: true })
              .eq("id", panier.id)
              .eq("recupere", false)
              .select("id");

            if (erreurMaj) {
              throw new Error("Mise a jour : " + erreurMaj.message);
            }

            if (modifies && modifies.length > 0) {
              recuperes++;
            }
          }
        }

        totalRecuperes += recuperes;
        entree.recuperes = recuperes;
      } catch (e) {
        const message = e instanceof Error ? e.message : "erreur inconnue";
        entree.erreur = "Recuperation : " + message;
      }
    }

    resultats.push(entree);
  }

  return NextResponse.json({
    message: "synchro ok",
    clients: clients.length,
    paniers: total,
    recuperes: totalRecuperes,
    resultats,
  });
}