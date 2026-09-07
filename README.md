# Treizième Art

Plateforme digitale premium pour découvrir et acheter des œuvres d'art en édition limitée.

## Développement local

```bash
npm install
npm run dev
```

L'application est disponible sur [http://localhost:8443](http://localhost:8443).

## Build de production

```bash
npm run build
npm run preview
```

## Déploiement sur Netlify

1. Connectez votre compte Netlify à GitHub.
2. Importez le dépôt `Meriem1403/Treizi-me-art`.
3. Netlify détecte automatiquement la configuration via `netlify.toml` :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
4. Lancez le déploiement.

Chaque push sur `main` redéploiera automatiquement le site.
