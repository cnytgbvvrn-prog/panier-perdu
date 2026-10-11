const baseUrl = (process.env.WOOCOMMERCE_URL as string).trim().replace(/\/+$/, "");
const key = (process.env.WOOCOMMERCE_KEY as string).trim();
const secret = (process.env.WOOCOMMERCE_SECRET as string).trim();

export async function getCommandesEnAttente() {
  const url = `${baseUrl}/wp-json/wc/v3/orders?status=pending&consumer_key=${key}&consumer_secret=${secret}`;

  const response = await fetch(url);

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(
      `Erreur WooCommerce : ${response.status} | ${baseUrl} | ${detail}`
    );
  }

  return response.json();
}