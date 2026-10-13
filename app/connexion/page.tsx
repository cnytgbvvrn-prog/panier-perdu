"use client";

import { useState, type FormEvent } from "react";
import { creerClientNavigateur } from "@/lib/supabase-navigateur";

type Etat = "attente" | "envoi" | "envoye" | "erreur";

const MESSAGE_ENVOYE =
  "C'est parti ! Un lien de connexion vient d'être envoyé à votre adresse email. Pensez à vérifier vos spams.";
const MESSAGE_ERREUR =
  "Impossible d'envoyer le lien. Vérifiez l'adresse email et réessayez dans une minute.";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState<Etat>("attente");

  async function envoyerLien(e: FormEvent) {
    e.preventDefault();
    setEtat("envoi");

    const supabase = creerClientNavigateur();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setEtat(error ? "erreur" : "envoye");
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0B1730", color: "white", textAlign: "center", padding: "2rem" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Connexion</h1>
      <p style={{ fontSize: "1.1rem", marginBottom: "2rem", opacity: 0.85 }}>
        Entrez votre email : nous vous envoyons un lien pour vous connecter, sans mot de passe.
      </p>

      <form onSubmit={envoyerLien} style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: "380px" }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          style={{ padding: "0.9rem 1rem", borderRadius: "8px", border: "none", fontSize: "1rem", color: "#0B1730", backgroundColor: "#FFFFFF" }}
        />
        <button
          type="submit"
          disabled={etat === "envoi"}
          style={{ padding: "0.9rem 1rem", borderRadius: "8px", border: "none", fontSize: "1rem", fontWeight: 600, backgroundColor: "#FF5A3C", color: "white", cursor: "pointer" }}
        >
          {etat === "envoi" ? "Envoi en cours..." : "Recevoir mon lien"}
        </button>
      </form>

      {etat === "envoye" && <p style={{ marginTop: "1.5rem", maxWidth: "380px" }}>{MESSAGE_ENVOYE}</p>}
      {etat === "erreur" && <p style={{ marginTop: "1.5rem", maxWidth: "380px", color: "#FF8A73" }}>{MESSAGE_ERREUR}</p>}
    </main>
  );
}