import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCommandesEnAttente } from "@/lib/woocommerce";
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
  erreur?: string;
};

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

  // Chaque client est traite separement : une boutique en panne ne bloque pas les autres
  for (const client of clients) {
    try {
      const cle = dechiffrer(client.woo_cle_chiffree);
      const secret = dechiffrer(client.woo_secret_chiffre);
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
      resultats.push({ client: client.id, paniers: lignes.length });
    } catch (e) {
      resultats.push({
        client: client.id,
        erreur: e instanceof Error ? e.message : "erreur inconnue",
      });
    }
  }

  return NextResponse.json({
    message: "synchro ok",
    clients: clients.length,
    paniers: total,
    resultats,
  });
}