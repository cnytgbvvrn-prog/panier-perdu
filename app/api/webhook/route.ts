import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "../../../lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Erreur de signature webhook", error);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("Paiement reçu pour", session.customer_details.email);

    const { error } = await supabase.from("clients").insert({
      email: session.customer_details.email,
      nom_boutique: "A completer",
      plateforme: "A completer",
      abonnement_actif: true,
    });

    if (error) {
      console.error("Erreur insertion Supabase", error);
    }
  }

  return NextResponse.json({ received: true });
}