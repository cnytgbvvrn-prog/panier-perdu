import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { creerClientServeur } from "@/lib/supabase-serveur";
import { chiffrer } from "@/lib/chiffrement";
import { testerConnexion } from "@/lib/boutique-woo";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. Le client doit etre connecte
    const supabaseAuth = await creerClientServeur();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, erreur: "Vous devez être connecté." },
        { status: 401 }
      );
    }

    // 2. Lecture et verification de ce qui a ete envoye
    let corps: unknown;
    try {
      corps = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, erreur: "Requête invalide." },
        { status: 400 }
      );
    }

    const { url, cle, secret } = (corps ?? {}) as Record<string, unknown>;
    if (
      typeof url !== "string" ||
      typeof cle !== "string" ||
      typeof secret !== "string" ||
      url.length > 300 ||
      cle.length > 200 ||
      secret.length > 200
    ) {
      return NextResponse.json(
        { ok: false, erreur: "Champs invalides." },
        { status: 400 }
      );
    }

    // 3. Le client doit avoir un abonnement ou un essai en cours
    const { data: lignes, error: erreurLecture } = await supabase
      .from("clients")
      .select("id, abonnement_actif")
      .eq("user_id", user.id)
      .limit(1);

    if (erreurLecture) {
      console.error("ERREUR BOUTIQUE (lecture) :", erreurLecture.message);
      return NextResponse.json(
        { ok: false, erreur: "Erreur serveur." },
        { status: 500 }
      );
    }

    const client = lignes && lignes.length > 0 ? lignes[0] : null;
    if (!client || !client.abonnement_actif) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Démarrez d'abord votre essai gratuit pour connecter une boutique.",
        },
        { status: 403 }
      );
    }

    // 4. Test de la connexion a la boutique
    const test = await testerConnexion(url, cle, secret);
    if (!test.ok) {
      return NextResponse.json(
        { ok: false, erreur: test.erreur },
        { status: 400 }
      );
    }

    // 5. Enregistrement (cles chiffrees)
    const { error: erreurEcriture } = await supabase
      .from("clients")
      .update({
        woo_url: test.urlNettoyee,
        woo_cle_chiffree: chiffrer(cle.trim()),
        woo_secret_chiffre: chiffrer(secret.trim()),
        boutique_verifiee_le: new Date().toISOString(),
        plateforme: "WooCommerce",
        nom_boutique: new URL(test.urlNettoyee).hostname,
      })
      .eq("id", client.id);

    if (erreurEcriture) {
      console.error("ERREUR BOUTIQUE (ecriture) :", erreurEcriture.message);
      return NextResponse.json(
        { ok: false, erreur: "Erreur serveur." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, url: test.urlNettoyee });
  } catch (error) {
    console.error(
      "ERREUR BOUTIQUE :",
      error instanceof Error ? error.message : "inconnue"
    );
    return NextResponse.json(
      { ok: false, erreur: "Erreur serveur." },
      { status: 500 }
    );
  }
}