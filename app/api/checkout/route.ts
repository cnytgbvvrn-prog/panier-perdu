import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_creation: "always",
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
      success_url: "http://localhost:3000/succes",
      cancel_url: "http://localhost:3000/",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("ERREUR STRIPE :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}