import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

function identifiant(valeur: string | { id: string } | null): string | null {
  if (!valeur) return null;
  return typeof valeur === "string" ? valeur : valeur.id;
}

function statutDepuis(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "trialing":
      return "essai";
    case "active":
      return "actif";
    case "past_due":
    case "unpaid":
      return "impaye";
    case "canceled":
    case "incomplete_expired":
      return "annule";
    default:
      return "inactif";
  }
}

function estActif(status: Stripe.Subscription.Status): boolean {
  return status === "trialing" || status === "active" || status === "past_due";
}

function dateFinEssai(sub: Stripe.Subscription): string | null {
  return sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
}

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

  try {
    // 1. Un client vient de demarrer son abonnement (essai ou paiement)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const email = session.customer_details?.email ?? session.customer_email;
      const userId = session.client_reference_id ?? null;
      const customerId = identifiant(session.customer);
      const subscriptionId = identifiant(session.subscription);

      if (!subscriptionId) {
        console.error("WEBHOOK : pas d'abonnement dans la session");
        return NextResponse.json({ received: true });
      }

      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const essaiDonne = sub.trial_end !== null;

      const champs: Record<string, unknown> = {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        statut_abonnement: statutDepuis(sub.status),
        abonnement_actif: estActif(sub.status),
        date_fin_essai: dateFinEssai(sub),
      };
      if (userId) champs.user_id = userId;
      if (essaiDonne) champs.essai_utilise = true;

      // Chercher une ligne existante : d'abord par compte, puis par email
      let ligneId: string | null = null;

      if (userId) {
        const { data } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", userId)
          .limit(1);
        ligneId = data && data.length > 0 ? String(data[0].id) : null;
      }

      if (!ligneId && email) {
        const { data } = await supabase
          .from("clients")
          .select("id")
          .eq("email", email)
          .limit(1);
        ligneId = data && data.length > 0 ? String(data[0].id) : null;
      }

      if (ligneId) {
        const { error } = await supabase
          .from("clients")
          .update(champs)
          .eq("id", ligneId);
        if (error) throw new Error("Mise a jour client : " + error.message);
      } else {
        const { error } = await supabase.from("clients").insert({
          email,
          nom_boutique: "A completer",
          plateforme: "A completer",
          ...champs,
        });
        if (error) throw new Error("Insertion client : " + error.message);
      }
    }

    // 2. L'abonnement change (fin d'essai, paiement, resiliation...)
    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;

      const { error } = await supabase
        .from("clients")
        .update({
          statut_abonnement: statutDepuis(sub.status),
          abonnement_actif: estActif(sub.status),
          date_fin_essai: dateFinEssai(sub),
        })
        .eq("stripe_subscription_id", sub.id);

      if (error) throw new Error("Mise a jour abonnement : " + error.message);
    }
  } catch (error) {
    console.error("ERREUR WEBHOOK :", error);
    // 500 = Stripe reessaiera plus tard
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}