import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import { creerClientServeur } from "@/lib/supabase-serveur";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://panier-perdu-plum.vercel.app"
)
  .trim()
  .replace(/\/+$/, "");

export async function POST() {
  try {
    // 1. Le client doit etre connecte
    const supabaseAuth = await creerClientServeur();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "non_connecte", redirection: "/connexion" },
        { status: 401 }
      );
    }

    // 2. A-t-il deja utilise son essai gratuit ?
    const { data: lignes, error: erreurLecture } = await supabase
      .from("clients")
      .select("essai_utilise")
      .eq("email", user.email);

    if (erreurLecture) {
      console.error("ERREUR LECTURE CLIENT :", erreurLecture.message);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const essaiDejaUtilise = (lignes ?? []).some(
      (ligne) => ligne.essai_utilise === true
    );

    // 3. Creation de la page de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      locale: "fr",
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Panier Perdu — Abonnement mensuel" },
            unit_amount: 2900,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        ...(essaiDejaUtilise ? {} : { trial_period_days: 7 }),
        metadata: { user_id: user.id },
      },
      custom_text: {
        submit: {
          message: essaiDejaUtilise
            ? "29 € par mois, résiliable à tout moment."
            : "7 jours gratuits, puis 29 € par mois. Aucun prélèvement pendant l'essai. Résiliable à tout moment avant la fin de l'essai.",
        },
      },
      success_url: `${SITE_URL}/succes`,
      cancel_url: `${SITE_URL}/compte`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("ERREUR STRIPE :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}