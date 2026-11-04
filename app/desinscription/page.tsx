import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { normaliserEmail, verifierSignature } from "@/lib/desinscription";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Désinscription",
  robots: { index: false },
};

const REGEX_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function lienValide(c: string, e: string, s: string): boolean {
  if (!REGEX_UUID.test(c)) return false;
  if (!e || e.length > 254) return false;
  if (!s) return false;
  return verifierSignature(c, e, s);
}

function adresse(c: string, e: string, s: string, extra?: string): string {
  const parametres = new URLSearchParams({ c, e, s });
  if (extra) parametres.set(extra, "1");
  return "/desinscription?" + parametres.toString();
}

async function confirmer(formData: FormData) {
  "use server";
  const c = String(formData.get("c") ?? "");
  const e = String(formData.get("e") ?? "");
  const s = String(formData.get("s") ?? "");

  if (!lienValide(c, e, s)) {
    redirect("/desinscription");
  }

  const { error } = await supabase
    .from("desinscriptions")
    .upsert(
      { client_id: c, email: normaliserEmail(e) },
      { onConflict: "client_id,email", ignoreDuplicates: true }
    );

  if (error) {
    redirect(adresse(c, e, s, "erreur"));
  }

  redirect(adresse(c, e, s, "fait"));
}

function premier(valeur: string | string[] | undefined): string {
  if (Array.isArray(valeur)) return valeur[0] ?? "";
  return valeur ?? "";
}

const TEXTE_INVALIDE =
  "Ce lien de désinscription n'est pas valide. Utilisez le lien présent dans l'e-mail que vous avez reçu.";
const TEXTE_ERREUR =
  "Une erreur est survenue. Merci de réessayer dans quelques instants.";
const TEXTE_FAIT =
  "C'est fait : vous ne recevrez plus de rappels de panier de la part de cette boutique.";
const TEXTE_QUESTION =
  "Voulez-vous ne plus recevoir de rappels de panier de la part de cette boutique ?";

export default async function PageDesinscription({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>;
}) {
  const parametres = await searchParams;
  const c = premier(parametres.c);
  const e = premier(parametres.e);
  const s = premier(parametres.s);
  const fait = premier(parametres.fait) === "1";
  const erreur = premier(parametres.erreur) === "1";

  const valide = lienValide(c, e, s);

  let message = TEXTE_QUESTION;
  if (!valide) message = TEXTE_INVALIDE;
  else if (fait) message = TEXTE_FAIT;
  else if (erreur) message = TEXTE_ERREUR;

  const afficherBouton = valide && !fait;

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
      <h1 style={{ fontSize: "28px", fontWeight: 700 }}>Désinscription</h1>
      <p style={{ maxWidth: "460px", lineHeight: 1.5 }}>{message}</p>

      {afficherBouton && (
        <form action={confirmer}>
          <input type="hidden" name="c" value={c} />
          <input type="hidden" name="e" value={e} />
          <input type="hidden" name="s" value={s} />
          <button
            type="submit"
            style={{
              background: "#EA6A47",
              color: "#0B1730",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Me désinscrire
          </button>
        </form>
      )}
    </main>
  );
}