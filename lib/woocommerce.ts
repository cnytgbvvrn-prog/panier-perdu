const baseUrl = process.env.WOOCOMMERCE_URL as string;
const key = process.env.WOOCOMMERCE_KEY as string;
const secret = process.env.WOOCOMMERCE_SECRET as string;

export async function getCommandesEnAttente() {
  const url = `${baseUrl}/wp-json/wc/v3/orders?status=pending&consumer_key=${key}&consumer_secret=${secret}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erreur WooCommerce : ${response.status}`);
  }

  return response.json();
}