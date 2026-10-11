const baseUrl = process.env.WOOCOMMERCE_URL as string;
const key = process.env.WOOCOMMERCE_KEY as string;
const secret = process.env.WOOCOMMERCE_SECRET as string;

export async function getCommandesEnAttente() {
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const response = await fetch(
    `${baseUrl}/wp-json/wc/v3/orders?status=pending`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Erreur WooCommerce : ${response.status}`);
  }

  return response.json();
}