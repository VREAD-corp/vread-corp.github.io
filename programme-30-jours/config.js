/* Programme « 30 jours pour refinir un livre » : configuration des pages /programme-30-jours/a/ et /b/.
 *
 * precommande: false = liste d'inscription seule (aucun paiement). true = la section prix propose aussi une
 * pré-commande payante remboursable, par le paiement intégré d'octave-global-checkout (PaymentIntent, jamais de
 * Checkout Session). NE PAS passer à true avant (voir README, « Programme 30 jours ») :
 *   1. l'accord écrit de Tanguy sur les montants et sur les conditions de remboursement ;
 *   2. les produits ci-dessous ajoutés au catalogue d'octave-global-checkout (gas/src/Products.js, venture 'p30'),
 *      avec les acheteurs de France acceptés pour ces produits (le backend refuse aujourd'hui tout acheteur de l'UE) ;
 *   3. les CGV de la pré-commande publiées.
 * Aucun objet Stripe n'est créé tant que le drapeau est à false : le module de paiement n'est même pas chargé.
 */
window.P30 = {
  precommande: false,
  api: 'https://script.google.com/macros/s/AKfycbxXW-9xz90F1nalrIOMIVU9RarjRHTa1zb8F-ajfVIESYEfg5Ec1y4PyObDjz7HL9OA/exec',
  consent: 'p30-2026-11-03',
  contact: 'octave@vread.fr',
  ouverture: 'janvier 2027',
  remboursementAvant: '31 janvier 2027',   // non-ouverture à cette date : remboursement intégral d'office
  produits: {
    a: { product: 'p30-annuel-a-3999-eur', amount: 3999, currency: 'eur', venture: 'p30', label: '39,99 €' },
    b: { product: 'p30-annuel-b-7999-eur', amount: 7999, currency: 'eur', venture: 'p30', label: '79,99 €' },
  },
};
