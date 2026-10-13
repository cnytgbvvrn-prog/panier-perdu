"use client";

import { useState } from "react";

const TEXTE_BOUTON = "Démarrer mon essai gratuit";
const TEXTE_CHARGEMENT = "Redirection vers le paiement...";
const TEXTE_ERREUR = "Une erreur est survenue, réessaie dans un instant.";

export default function BoutonEssai() {
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(false);

  async function allerAuPaiement() {
    setChargement(true);
    setErreur(false);
    try {
      const reponse = await fetch("/api/checkout", { method: "POST" });
      const donnees = await reponse.json();

      if (reponse.status === 401) {
        window.location.href = "/connexion";
        return;
      }

      if (donnees.url) {
        window.location.href = donnees.url;
        return;
      }

      setErreur(true);
      setChargement(false);
    } catch {
      setErreur(true);
      setChargement(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={allerAuPaiement}
        disabled={chargement}
        style={{
          backgroundColor: "#FF5A3C",
          color: "#FFFFFF",
          padding: "12px 24px",
          borderRadius: "8px",
          border: "none",
          fontWeight: 600,
          cursor: chargement ? "wait" : "pointer",
          opacity: chargement ? 0.7 : 1,
        }}
      >
        {chargement ? TEXTE_CHARGEMENT : TEXTE_BOUTON}
      </button>
      {erreur && <p style={{ marginTop: "12px" }}>{TEXTE_ERREUR}</p>}
    </div>
  );
}