import { NextResponse } from "next/server";
import { creerClientServeur } from "@/lib/supabase-serveur";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const erreurSupabase = url.searchParams.get("error_description");

  if (code) {
    const supabase = await creerClientServeur();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${url.origin}/compte`);
    }
    console.error("CONNEXION : echange du code impossible :", error.message);
  } else {
    console.error(
      "CONNEXION : pas de code dans l'adresse. Parametres recus :",
      Array.from(url.searchParams.keys()).join(", ") || "aucun",
      erreurSupabase ?? ""
    );
  }

  return NextResponse.redirect(`${url.origin}/connexion`);
}