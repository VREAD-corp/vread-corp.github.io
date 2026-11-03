/* Programme « 30 jours pour refinir un livre » : configuration de la page /programme-30-jours/ (et de /a/, /b/ pendant le
 * test de prix de décembre).
 *
 * Phase 1 (depuis le 3 novembre 2026) : un seul prix, celui de l'appli, 79 € par an avec 14 jours d'essai gratuit.
 * Liste d'inscription simple, aucun paiement.
 *
 * precommande: false = liste d'inscription seule (aucun paiement). true = la section prix propose aussi une
 * pré-commande payante remboursable, par le paiement intégré d'octave-global-checkout (PaymentIntent, jamais de
 * Checkout Session). Elle ne servirait qu'au test de prix de décembre. NE PAS passer à true avant (voir README,
 * « Programme 30 jours ») :
 *   1. l'accord écrit de Tanguy sur les montants (sa grille de fin novembre) et sur les conditions de remboursement ;
 *   2. un paiement web qui active le Premium dans l'appli, et un médiateur de la consommation ;
 *   3. les produits de la grille ajoutés ici (clé = version a ou b) et au catalogue d'octave-global-checkout
 *      (gas/src/Products.js, venture 'p30'), avec les acheteurs de France acceptés pour ces produits (le backend refuse
 *      aujourd'hui tout acheteur de l'UE) ;
 *   4. les CGV de la pré-commande publiées.
 * Aucun objet Stripe n'est créé tant que le drapeau est à false : le module de paiement n'est même pas chargé.
 */
window.P30 = {
  precommande: false,
  api: 'https://script.google.com/macros/s/AKfycbxXW-9xz90F1nalrIOMIVU9RarjRHTa1zb8F-ajfVIESYEfg5Ec1y4PyObDjz7HL9OA/exec',
  consent: 'p30-2026-11-03',
  contact: 'octave@vread.fr',
  ouverture: 'janvier 2027',
  remboursementAvant: '31 janvier 2027',   // non-ouverture à cette date : remboursement intégral d'office
  produits: {},                            // décembre : { a: { product, amount (centimes), currency: 'eur', venture: 'p30', label }, b: … }
};
