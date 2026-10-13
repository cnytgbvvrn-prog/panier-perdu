"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Etat = "attente" | "envoi" | "ok" | "erreur";

const TEXTE_BOUTON = "Connecter ma boutique";
const TEXTE_ENVOI = "Vérification en cours...";
const TEXTE_OK = "Boutique connectée avec succès.";

const styleChamp = {
  padding: "0.9rem 1rem",
  borderRadius: "8px",
  border: "none",
  fontSize: "1rem",
  color: "#0B1730",
  backgroundColor: "#FFFFFF",
  width: "100%",
} as const;

export default function FormulaireBoutique() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [cle, setCle] = useState("");
  const [secret, setSecret] = useState("");
  const [etat, setEtat] = useState<Etat>("attente");
  const [message, setMessage] = useState("");

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEtat("envoi");
    setMessage("");

    try {
      const reponse = await fetch("/api/boutique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, cle, secret }),
      });
      const donnees = await reponse.json();

      if (reponse.ok && donnees.ok) {
        setEtat("ok");
        setMessage(TEXTE_OK);
        setUrl("");
        setCle("");
        setSecret("");
        router.refresh();
        return;
      }

      setEtat("erreur");
      setMessage(donnees.erreur ?? "Une erreur est survenue.");
    } catch {
      setEtat("erreur");
      setMessage("Une erreur est survenue, réessayez dans un instant.");
    }
  }

  return (
    <form
      onSubmit={envoyer}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "100%",
        maxWidth: "420px",
        textAlign: "left",
      }}
    >
      <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        Adresse de votre boutique
        <input
          type="text"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://maboutique.fr"
          autoComplete="off"
          style={styleChamp}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        Clé client (commence par ck_)
        <input
          type="password"
          required
          value={cle}
          onChange={(e) => setCle(e.target.value)}
          autoComplete="off"
          style={styleChamp}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        Clé secrète (commence par cs_)
        <input
          type="password"
          required
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          autoComplete="off"
          style={styleChamp}
        />
      </label>

      <button
        type="submit"
        disabled={etat === "envoi"}
        style={{
          padding: "0.9rem 1rem",
          borderRadius: "8px",
          border: "none",
          fontSize: "1rem",
          fontWeight: 600,
          backgroundColor: "#FF5A3C",
          color: "#FFFFFF",
          cursor: etat === "envoi" ? "wait" : "pointer",
          opacity: etat === "envoi" ? 0.7 : 1,
        }}
      >
        {etat === "envoi" ? TEXTE_ENVOI : TEXTE_BOUTON}
      </button>

      {etat === "ok" && <p style={{ color: "#7DDC9A" }}>{message}</p>}
      {etat === "erreur" && <p style={{ color: "#FF8A73" }}>{message}</p>}
    </form>
  );
}