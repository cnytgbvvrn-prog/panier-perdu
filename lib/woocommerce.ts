const baseUrl = (process.env.WOOCOMMERCE_URL as string).trim().replace(/\/+$/, "");
const key = (process.env.WOOCOMMERCE_KEY ?? "").trim();
const secret = (process.env.WOOCOMMERCE_SECRET ?? "").trim();

export async function getCommandesEnAttente() {
  const url = `${baseUrl}/wp-json/wc/v3/orders?status=pending&consumer_key=${key}&consumer_secret=${secret}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erreur WooCommerce : ${response.status}`);
  }

  return response.json();
}