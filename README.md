# vread-corp.github.io

Site racine (hub) des outils et kits édités par READ FRANCE SAS : https://outils.vread.fr/

Site statique, sans cookie, avec une mesure d’audience anonyme sans donnée personnelle (`mesure.js`). `robots.txt` et `sitemap.xml` (index) référencent les sitemaps de chaque outil. Le fichier `<clé>.txt` est la clé publique IndexNow (protocole indexnow.org).

`og.png` (1200×630) et `logo-512.png` sont rendus depuis `tools/og-hub.html` et `tools/logo.html` avec Playwright : `PLAYWRIGHT=<chemin du module playwright> node tools/render-images.mjs`, puis réduits en palette (PIL `quantize`).
