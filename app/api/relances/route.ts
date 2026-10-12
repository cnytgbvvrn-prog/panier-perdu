import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { resend } from "../../../lib/resend";
import { estAutorise } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// MODE TEST : tous les emails partent vers cette adresse. A supprimer avant le vrai lancement.
const DESTINATAIRE_TEST = "nicolas.massias69@gmail.com";
const DELAI_HEURES = 1;

type Panier = {
  id: string;
  email_acheteur: string | null;
  montant: number;
  devise: string;
};

export async function GET(request: Request) {
  if (!estAutorise(request)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const limite = new Date(Date.now() - DELAI_HEURES * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from("paniers_abandonnes")
    .select("id, email_acheteur, montant, devise")
    .eq("relance_envoyee", false)
    .eq("recupere", false)
    .lt("date_abandon", limite);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const paniers = (data ?? []) as Panier[];
  const erreurs: string[] = [];
  let envoyes = 0;

  for (const panier of paniers) {
    const { error: erreurEnvoi } = await resend.emails.send({
      from: "Panier Perdu <relance@alcevio.com>",
      to: DESTINATAIRE_TEST,
      subject: "Vous avez oublie quelque chose dans votre panier",
      text: `Bonjour,\n\nVous avez laisse un panier de ${panier.montant} ${panier.devise} sans finaliser votre commande.\n\nIl vous attend toujours : revenez le terminer quand vous voulez.\n\nA tres bientot !`,
    });

    if (erreurEnvoi) {
      erreurs.push(erreurEnvoi.message);
      continue;
    }

    await supabase
      .from("paniers_abandonnes")
      .update({ relance_envoyee: true })
      .eq("id", panier.id);
    envoyes++;
  }

  return NextResponse.json({ message: "relances ok", envoyes, erreurs });
}