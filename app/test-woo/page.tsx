import { getCommandesEnAttente } from "@/lib/woocommerce";

export default async function TestWoo() {
  const commandes = await getCommandesEnAttente();

  return (
    <div>
      <h1>Test WooCommerce</h1>
      <p>Nombre de commandes en attente : {commandes.length}</p>
      <pre>{JSON.stringify(commandes, null, 2)}</pre>
    
 </div> );
}