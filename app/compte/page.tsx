import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { creerClientServeur } from "@/lib/supabase-serveur";
import BoutonEssai from "./BoutonEssai";
import FormulaireBoutique from "./FormulaireBoutique";

export const dynamic = "force-dynamic";

async function deconnexion() {
  "use server";
  const supabaseAuth = await creerClientServeur();
  await supabaseAuth.auth.signOut();
  redirect("/connexion");
}

function formaterDate(valeur: string | null): string {
  if (!valeur) return "";
  return new Date(valeur).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const styleCarte = {
  width: "100%",
  maxWidth: "460px",
  padding: "1.5rem",
  borderRadius: "12px",
  backgroundColor: "rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1rem",
  textAlign: "center",
} as const;

export default async function PageCompte() {
  const supabaseAuth = await creerClientServeur();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: lignes } = await supabase
    .from("clients")
    .select(
      "abonnement_actif, statut_abonnement, date_fin_essai, woo_url, boutique_verifiee_le"
    )
    .eq("user_id", user.id)
    .limit(1);

  const client = lignes && lignes.length > 0 ? lignes[0] : null;
  const abonne = client?.abonnement_actif === true;
  const boutiqueConnectee = Boolean(client?.woo_url && client?.boutique_verifiee_le);

  let texteStatut = "";
  if (abonne && client?.statut_abonnement === "essai") {
    texteStatut = "Essai gratuit en cours, jusqu'au " + formaterDate(client.date_fin_essai) + ".";
  } else if (abonne) {
    texteStatut = "Abonnement actif.";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0B1730",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "28px", fontWeight: 700 }}>Mon compte</h1>
      <p>Connecté avec : {user.email}</p>

      {!abonne && <BoutonEssai />}

      {abonne && (
        <section style={styleCarte}>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Mon abonnement</h2>
          <p>{texteStatut}</p>
        </section>
      )}

      {abonne && (
        <section style={styleCarte}>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Ma boutique</h2>
          {boutiqueConnectee ? (
            <p>Boutique connectée : {client?.woo_url}</p>
          ) : (
            <p>
              Connectez votre boutique WooCommerce pour que Panier Perdu puisse
              relancer vos paniers abandonnés.
            </p>
          )}
          <FormulaireBoutique />
        </section>
      )}

      <form action={deconnexion}>
        <button
          type="submit"
          style={{
            background: "transparent",
            color: "#FFFFFF",
            border: "1px solid #FFFFFF",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Se déconnecter
        </button>
      </form>
    </main>
  );
}