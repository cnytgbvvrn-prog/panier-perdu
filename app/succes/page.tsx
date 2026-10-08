import Link from "next/link";

export default function Succes() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0B1730", color: "white", textAlign: "center", padding: "2rem" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Merci c est confirme</h1>
      <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>Votre abonnement Panier Perdu est actif. On vous recontacte tres vite pour brancher votre boutique.</p>
      <Link href="/" style={{ color: "#FF5A3C", textDecoration: "underline" }}>Retour a accueil</Link>
    </main>
  );
}
