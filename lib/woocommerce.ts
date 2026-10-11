const baseUrl = (process.env.WOOCOMMERCE_URL as string).trim().replace(/\/+$/, "");
const key = (process.env.WOOCOMMERCE_KEY ?? "").trim();
const secret = (process.env.WOOCOMMERCE_SECRET ?? "").trim();

export async function getCommandesEnAttente() {
  const url = `${baseUrl}/wp-json/wc/v3/orders?status=pending&consumer_key=${key}&consumer_secret=${secret}`;

  const response = await fetch(url);

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new Error(
      `Erreur WooCommerce : ${response.status} | cle: ${key.length} car, debut ${key.slice(0, 6)} | secret: ${secret.length} car, debut ${secret.slice(0, 6)} | ${detail}`
    );
  }

  return response.json();
}