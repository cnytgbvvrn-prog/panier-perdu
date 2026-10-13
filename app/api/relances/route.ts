import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { resend } from "../../../lib/resend";
import { estAutorise } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// MODE TEST : tous les emails partent vers cette adresse. A supprimer avant le vrai lancement.
const DESTINATAIRE_TEST = "nicolas.massias69@gmail.com";
const DELAI_HEURES = 1;

type ClientLie = {
  woo_url: string | null;
  abonnement_actif: boolean | null;
};

type Panier = {
  id: string;
  email_acheteur: string | null;
  montant: number;
  devise: string;
  clients: ClientLie | ClientLie[] | null;
};

function construireEmail(montant: number, devise: string, lien: string) {
  const texte = `Bonjour,

Vous avez laissé un panier de ${montant} ${devise} sans finaliser votre commande.

Il vous attend toujours : vous pouvez le retrouver ici et le terminer quand vous voulez.
${lien}

À très bientôt !`;

  const html = `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222; line-height: 1.5;">
  <p>Bonjour,</p>
  <p>Vous avez laissé un panier de <strong>${montant} ${devise}</strong> sans finaliser votre commande.</p>
  <p>Il vous attend toujours : vous pouvez le retrouver et le terminer quand vous voulez.</p>
  <p style="margin: 24px 0;">
    <a href="${lien}" style="background: #111; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Retrouver mon panier</a>
  </p>
  <p>À très bientôt !</p>
</div>`;

  return { texte, html };
}

export async function GET(request: Request) {
  if (!estAutorise(request)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const limite = new Date(Date.now() - DELAI_HEURES * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from("paniers_abandonnes")
    .select("id, email_acheteur, montant, devise, clients(woo_url, abonnement_actif)")
    .eq("relance_envoyee", false)
    .eq("recupere", false)
    .lt("date_abandon", limite);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const paniers = (data ?? []) as unknown as Panier[];
  const erreurs: string[] = [];
  let envoyes = 0;
  let ignores = 0;

  for (const panier of paniers) {
    const client = Array.isArray(panier.clients)
      ? panier.clients[0]
      : panier.clients;

    // On ne relance que les clients actifs qui ont connecte une boutique
    if (!client || client.abonnement_actif !== true || !client.woo_url) {
      ignores++;
      continue;
    }

    const lien = client.woo_url.trim().replace(/\/+$/, "");
    const { texte, html } = construireEmail(panier.montant, panier.devise, lien);

    const { error: erreurEnvoi } = await resend.emails.send({
      from: "Panier Perdu <relance@alcevio.com>",
      to: DESTINATAIRE_TEST,
      subject: "Vous avez oublié quelque chose dans votre panier",
      text: texte,
      html: html,
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

  return NextResponse.json({ message: "relances ok", envoyes, ignores, erreurs });
}