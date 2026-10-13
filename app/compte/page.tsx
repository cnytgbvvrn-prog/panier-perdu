import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase-serveur";
import BoutonEssai from "./BoutonEssai";

export const dynamic = "force-dynamic";

async function deconnexion() {
  "use server";
  const supabase = await creerClientServeur();
  await supabase.auth.signOut();
  redirect("/connexion");
}

export default async function PageCompte() {
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
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
        gap: "24px",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "28px", fontWeight: 700 }}>Mon compte</h1>
      <p>Connecté avec : {user.email}</p>

      <BoutonEssai />

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