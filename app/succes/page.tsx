import Link from "next/link";

export default function Succes() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0B1730", color: "white", textAlign: "center", padding: "2rem" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Merci, c&apos;est confirmé</h1>
      <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Votre essai gratuit de 7 jours Panier Perdu a bien démarré.</p>
      <p style={{ fontSize: "1rem", marginBottom: "2rem", opacity: 0.8 }}>Vous recevrez un email de confirmation de Stripe. Aucun prélèvement avant la fin de l&apos;essai, et vous pouvez résilier à tout moment.</p>
      <Link href="/" style={{ color: "#FF5A3C", textDecoration: "underline" }}>Retour à l&apos;accueil</Link>
    </main>
  );
}