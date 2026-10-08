"use client";

import { useState } from "react";
export default function Home() {
   const [chargement, setChargement] = useState(false);

  async function allerAuPaiement() {
    setChargement(true);
    const reponse = await fetch("/api/checkout", { method: "POST" });
    const donnees = await reponse.json();
    if (donnees.url) {
      window.location.href = donnees.url;
    } else {
      alert("Une erreur est survenue, réessaie dans un instant.");
      setChargement(false);
    }
  } return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-2xl px-5 pb-12 pt-10">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--corail)]">
          Pour les boutiques Shopify &amp; WooCommerce
        </p>
        <h1 className="text-5xl font-extrabold sm:text-7xl">
          Vos clients remplissent leur panier.
          <br />
          <span className="text-[var(--corail)]">Ils repartent sans payer.</span>
        </h1>
        <p className="mt-6 text-lg text-[var(--gris-texte)]">
          7 clients sur 10 abandonnent leur panier avant de payer. Panier
          Perdu les relance automatiquement, pour 29&nbsp;€/mois, relances
          illimitées.
        </p>
        <a
          onClick={allerAuPaiement}
          className="mt-8 block w-full rounded-lg bg-[var(--corail)] px-6 py-4 text-center text-lg font-semibold text-[var(--bleu-nuit)] hover:bg-[var(--corail-sombre)]"
        >
          Récupérer mes ventes perdues
        </a>
      </section>

      <section className="bg-[var(--bleu-nuit-clair)] px-5 py-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-8xl font-extrabold text-[var(--corail)]">
            70&nbsp;%
          </p>
          <p className="mt-4 text-lg">
            des paniers remplis sur une boutique en ligne sont abandonnés
            avant le paiement. Sans relance, cet argent est perdu
            définitivement.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl space-y-8 px-5 py-12">
        <div>
          <h3 className="mb-2 text-3xl font-bold">Relance automatique</h3>
          <p className="text-[var(--gris-texte)]">
            Deux messages personnalisés envoyés au bon moment, sans que vous
            ayez à y penser.
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-3xl font-bold">Un code en plus</h3>
          <p className="text-[var(--gris-texte)]">
            Un code de réduction facultatif sur la deuxième relance, pour
            convaincre les plus hésitants.
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-3xl font-bold">Un chiffre, pas un rapport</h3>
          <p className="text-[var(--gris-texte)]">
            Un compteur unique : le chiffre d&apos;affaires récupéré grâce à
            vos relances, en euros.
          </p>
        </div>
      </section>

      <section className="bg-[var(--bleu-nuit-clair)] px-5 py-12">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-5xl font-extrabold">
            29&nbsp;€ par mois.
            <br />
            Relances illimitées.
          </h2>
          <a
            onClick={allerAuPaiement}
            className="mt-8 block w-full rounded-lg bg-[var(--corail)] px-6 py-4 text-center text-lg font-semibold text-[var(--bleu-nuit)] hover:bg-[var(--corail-sombre)]"
          >
            Je démarre maintenant
          </a>
        </div>
      </section>

      <footer className="px-5 py-8 text-center text-sm text-[var(--gris-texte)]">
        Panier Perdu — Mentions légales · CGV · Confidentialité
      </footer>
    </main>
  );
}