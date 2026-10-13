import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://panier-perdu-plum.vercel.app"
)
  .trim()
  .replace(/\/+$/, "");

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      locale: "fr",
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
        trial_period_days: 7,
      },
      custom_text: {
        submit: {
          message:
            "7 jours gratuits, puis 29 € par mois. Aucun prélèvement pendant l'essai. Résiliable à tout moment avant la fin de l'essai.",
        },
      },
      success_url: `${SITE_URL}/succes`,
      cancel_url: `${SITE_URL}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("ERREUR STRIPE :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}