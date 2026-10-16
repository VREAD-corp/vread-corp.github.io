# vread-corp.github.io

Site racine (hub) des offres de lecture et de compréhension de READ FRANCE SAS : https://outils.vread.fr/ (Acquimètre, Lu et Retenu, Civiclasse, Lectoclasse, Chapter Checks). Depuis le 16 octobre 2026, les autres outils (Qualiopi, GPSR, accessibilité, appels d’offres, outils internationaux) sont sous la marque Jalonel : https://jalonel.com/ (dépôt `VREAD-corp/jalonel-hub`), un sous-domaine par site ; leurs anciennes URL outils.vread.fr/<dépôt>/ redirigent (301) vers le sous-domaine.

Site statique, sans cookie, avec une mesure d’audience anonyme sans donnée personnelle (`mesure.js`) et des compteurs agrégés de navigation et de tests A/B (`cro.js`, copie à l’identique de `octave-checkout/gas/web/cro.js`, site `hub`). `robots.txt` et `sitemap.xml` (index) référencent les sitemaps de chaque outil ; ils sont générés par `npm run sitemaps` depuis la liste `SITES` de `tools/sitemaps.mjs` (ajouter chaque nouveau site sous outils.vread.fr à cette liste ; `npm test` vérifie que les deux fichiers lui correspondent). Le fichier `<clé>.txt` est la clé publique IndexNow (protocole indexnow.org).

Tests (sans dépendance) : `npm test` vérifie `cro.js` (`tests/cro.check.mjs`, copie à l’identique) et la présence de la balise `cro.js` sur chaque page HTML.

`og.png` (1200×630) et `logo-512.png` sont rendus depuis `tools/og-hub.html` et `tools/logo.html` avec Playwright : `PLAYWRIGHT=<chemin du module playwright> node tools/render-images.mjs`, puis réduits en palette (PIL `quantize`).
