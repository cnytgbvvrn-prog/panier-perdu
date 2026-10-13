import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase-serveur";

export const dynamic = "force-dynamic";

export default async function Compte() {
  const supabase = await creerClientServeur();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/connexion");
  }

  async function deconnexion() {
    "use server";
    const s = await creerClientServeur();
    await s.auth.signOut();
    redirect("/connexion");
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0B1730", color: "white", textAlign: "center", padding: "2rem" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Mon compte</h1>
      <p style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>Connecté avec : {data.user.email}</p>
      <form action={deconnexion}>
        <button type="submit" style={{ padding: "0.8rem 1.4rem", borderRadius: "8px", border: "1px solid white", background: "transparent", color: "white", cursor: "pointer" }}>
          Se déconnecter
        </button>
      </form>
    </main>
  );
}