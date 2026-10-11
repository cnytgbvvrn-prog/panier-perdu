import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { getCommandesEnAttente } from "../../../lib/woocommerce";

export const dynamic = "force-dynamic";

type Commande = {
  id: number;
  total: string;
  currency: string;
  date_created_gmt: string;
  billing?: { email?: string };
};

export async function GET() {
  // Pour le test : on rattache les paniers au client de test
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("email", "test@panierperdu.fr")
    .limit(1)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client test introuvable" }, { status: 400 });
  }

  const commandes: Commande[] = await getCommandesEnAttente();

  const lignes = commandes.map((c) => ({
    client_id: client.id,
    commande_woo_id: String(c.id),
    email_acheteur: c.billing?.email || null,
    montant: Number(c.total),
    devise: c.currency,
    date_abandon: c.date_created_gmt + "Z",
  }));

  const { error } = await supabase
    .from("paniers_abandonnes")
    .upsert(lignes, { onConflict: "commande_woo_id", ignoreDuplicates: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "synchro ok", paniers: lignes.length });
}