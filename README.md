# Diallo Coaching

Application personnelle de coaching sportif et nutritionnel, en PWA mobile-first, avec une direction artistique RPG sombre : fond bleu nuit, or pour les récompenses, turquoise pour la progression.

> **Phase 2 : saisies réelles.** Avec Supabase configuré, l'application est privée (connexion obligatoire) et
> enregistre pesées, repas, séances, mensurations, check-ins et photos. Sans Supabase, elle tourne en
> **mode démonstration** avec des données fictives clairement signalées, et rien n'est enregistré.
> L'analyse IA des photos et le Mentor arrivent en phase 3.

## Écrans

| Écran | Route | Contenu |
| --- | --- | --- |
| Connexion | `/connexion` | Accès privé par e-mail et mot de passe (compte unique) |
| QG | `/` | Quête principale (poids, objectif, courbe), niveau et XP, résumé du jour, quêtes cliquables, régularité sur 7 jours, trophées, alerte récupération en cas de douleur |
| Check-in | `/checkin` | Sommeil, énergie, stress, faim, **charge de travail**, **douleur et zone** (un par jour, modifiable) |
| Nutrition | `/nutrition` · `/nutrition/repas` | Bilan du jour, journal avec photos, historique sur 7 jours ; ajout d'un repas (photo, moment, macros facultatives) |
| Arène | `/arene` · `/arene/seance` | Stats du mois, semaine en cours, historique ; séance avec exercices, séries, charges, durée, effort, photo ; **repos planifié** |
| Évolution | `/evolution` · `/pesee` · `/mensurations` · `/photo` | Courbe et historique des pesées (photo de balance facultative), mensurations, galerie photo privée |
| Mentor | `/mentor` | Aperçu de l'interface du coach (phase 3) |
| Profil | `/profil` | Quête (départ, objectif, date), repères, **dossier athlète pour le Mentor**, fuseau, export JSON, effacement des données, suppression du compte, déconnexion |

Toutes les saisies peuvent être supprimées depuis leur écran. L'XP déjà gagnée reste acquise : il n'y a aucune pénalité.

## Stack

- **Next.js 16** (App Router, Cache Components, Partial Prefetching, proxy), **React 19**, **TypeScript** strict
- **Tailwind CSS 4** : design tokens dans `src/app/globals.css`
- **Supabase** (Auth, Postgres, Storage) via `@supabase/ssr`, **côté serveur uniquement**
- **Zod** pour la validation, **Vitest** pour les tests, **lucide-react** pour les icônes
- Graphiques en SVG natif, compression des photos dans le navigateur (canvas)

## Lancer le projet

Prérequis : Node.js ≥ 20.9 (testé avec Node 22).

```bash
npm install
npm run dev          # http://localhost:3000, en mode démonstration sans .env.local
```

### Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm run start` | Build et serveur de production |
| `npm run lint` | ESLint (config Next.js) |
| `npm run typecheck` | Génère les types de routes puis exécute `tsc --noEmit` |
| `npm test` | Tests unitaires et tests des Server Actions (client Supabase simulé) |
| `npm run test:sql` | Applique les migrations sur un Postgres jetable et exécute les tests de sécurité (`PGURL` requis) |
| `npm run check` | Lint + typage + tests + build |

## Mise en service (Supabase + Vercel)

1. **Créer le projet Supabase** sur [supabase.com](https://supabase.com) (région UE recommandée).
2. **Appliquer les migrations, dans l'ordre**, au choix :
   - copier le contenu de `supabase/migrations/20261029000000_init.sql`, puis de `20261030000000_phase2_tracking.sql`, dans *SQL Editor* et les exécuter ;
   - ou avec la CLI : `npx supabase init`, `npx supabase link --project-ref <ref>`, puis `npx supabase db push`.
3. **Créer ton compte unique** : *Authentication → Users → Add user* (e-mail + mot de passe, « Auto confirm »).
4. **Fermer les inscriptions** : *Authentication → Sign In / Providers* → désactiver *Allow new users to sign up*.
5. **Variables d'environnement** (*Project Settings → API Keys*) : copier `.env.example` en `.env.local` et renseigner `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY`. `SUPABASE_SECRET_KEY` est facultative et ne sert qu'à la suppression du compte.
6. **Déployer sur Vercel** (gratuit) : importer le dépôt, ajouter les mêmes variables dans *Settings → Environment Variables*, déployer.
7. **Sur le S24** : ouvrir l'URL `https://…vercel.app` dans Chrome, se connecter, puis menu ⋮ → *Ajouter à l'écran d'accueil*.
8. Dans **Profil**, renseigner poids de départ, objectif, date de début, repères, puis coller ton dossier athlète. Il reste privé en base et n'apparaît jamais dans le code.

Les types de la base (`src/types/database.ts`) sont écrits à la main et alignés sur les migrations. Une fois le projet créé, tu peux les régénérer : `npx supabase gen types typescript --project-id <ref> > src/types/database.ts`.

## Structure

```
src/
  proxy.ts                  rafraîchit la session Supabase, redirige vers /connexion sans session
  app/
    actions/                Server Actions : auth, saisies (tracking), profil et données
    api/export/             export JSON des données
    …/page.tsx              écrans (QG, nutrition, arène, évolution, mentor, profil, check-in, connexion)
  components/
    ui/ rpg/ charts/        design system, éléments RPG, courbe SVG
    forms/                  ActionForm, champs, échelles, PhotoField (compression), WorkoutForm, DeleteButton
    layout/                 navigation, en-têtes, gabarit des formulaires, état du système
  lib/
    auth/session.ts         Data Access Layer : session vérifiée + profil
    data/                   chargeurs par écran (mode démo ou données réelles)
    rpg/                    règles XP, quêtes, régularité, succès, attribution côté serveur
    supabase/               configuration, clients serveur, stockage privé et URLs signées
    media/                  détection du format réel, chemins de stockage, compression
    validation/             schémas Zod des formulaires, utilitaires de formulaire
    dates.ts                fuseau horaire (Europe/Paris par défaut), jours calendaires
    demo/data.ts            ⚠️ données fictives du mode démonstration
supabase/
  migrations/               schéma, RLS, bucket privé, XP, succès, export et suppression
  tests/                    tests de sécurité SQL (bouchons Supabase + scénarios phases 1 et 2)
```

## Règles RPG

- L'XP récompense les **actions de suivi** (pesée, repas, séance, repos planifié, sommeil, mensurations, photo, check-in) et la **régularité** : un bonus de 50 XP au plus une fois par semaine, pour 5 jours suivis sur 7.
- **Jamais** les calories brûlées, le déficit ou la restriction alimentaire. Des tests le vérifient.
- Le **repos planifié** rapporte de l'XP et compte comme jour suivi.
- Aucune pénalité, aucune série remise à zéro. Plafonds journaliers anti-« farm ». Une saisie antidatée de plus de 7 jours ne rapporte pas d'XP.
- L'XP et les succès sont attribués **uniquement par la base** (`award_xp`, `check_consistency_week`, `refresh_achievements`). Le client ne peut ni choisir le montant ni écrire directement.
- Succès : premier pas, entrée dans l'arène, sept soleils, repos du sage, métronome, cap des −2 kg, mi-parcours, objectif atteint. Ils célèbrent uniquement des progrès réels.
- Une douleur de 4/10 ou plus au check-in affiche le **mode récupération** sur le QG : pas d'intensité ce jour-là, et le conseil de consulter si elle persiste.

## Sécurité

- **Aucune clé dans le navigateur** : aucune variable `NEXT_PUBLIC_`, et les modules Supabase sont protégés par `server-only`. Toutes les requêtes passent par le serveur Next.js, avec une session en cookies httpOnly.
- **Authentification** : le proxy vérifie la signature du jeton (`getClaims`) et redirige vers `/connexion`. Chaque page, chaque Server Action et la route d'export **revérifient** la session (Data Access Layer). La redirection après connexion n'accepte que des chemins internes, et les messages d'échec sont génériques.
- **Row Level Security** sur toutes les tables, testée par 43 scénarios SQL : isolation entre comptes, XP et succès forgés refusés, photos hors de son dossier refusées.
- **Photos** :
  - compressées sur le téléphone (1600 px, JPEG), ce qui **supprime les métadonnées EXIF et le GPS** ;
  - format vérifié sur les octets réels côté serveur, 5 Mo maximum ;
  - stockées dans un bucket privé sous `{user_id}/…` ;
  - affichées via des URLs signées de 10 minutes, jamais optimisées ni mises en cache par le serveur.
- **Validation** : schémas Zod côté serveur (avec la virgule décimale française) et contraintes `CHECK` en base.
- **Export** JSON (`/api/export`), **effacement** des données et photos (confirmation « SUPPRIMER »), **suppression du compte** (clé secrète côté serveur).
- Pas de cache serveur des données personnelles : les écrans les relisent à chaque requête, derrière des `<Suspense>`.
- En-têtes de sécurité, service worker limité aux ressources statiques.

## Tests

| Suite | Contenu |
| --- | --- |
| `npm test` (59 tests) | Règles XP et synchronisation TS ↔ SQL (XP et succès), quêtes, régularité, fuseau horaire (y compris le changement d'heure), validation des formulaires, détection des formats d'image, Server Actions avec client Supabase simulé (charges utiles, chemins photo, XP, nettoyage en cas d'échec, mode démo, redirections piégées, effacement) |
| `npm run test:sql` (43 vérifications) | Migrations appliquées sur Postgres 16 : RLS, contraintes, bucket, `award_xp`, semaine régulière, succès, export, suppression, cascade |
| CI GitHub Actions | lint, typage, tests, build, tests SQL sur un service Postgres |

Les tests n'ont pas été rejoués contre un vrai projet Supabase : le réseau de l'environnement de développement ne permettait pas d'en lancer un. Le premier essai réel se fera après la mise en service ci-dessus.

## Feuille de route

- **Phase 1** ✅ : socle, design system, écrans, préparation Supabase et PWA.
- **Phase 2** ✅ : authentification, saisies réelles, photos privées, XP, succès, check-in enrichi, profil, export et suppression.
- **Phase 3** : Mentor IA avec outils de lecture des données et analyse de stagnation sur 30 jours (calculée par le code, expliquée par l'IA), garde-fous (pas de données inventées, pas de restriction extrême, mode blessure), analyse des photos de repas et de balance. Tout est appelé côté serveur.
- **Phase 4** : notifications, bilans hebdomadaires, paquet Android (TWA) si besoin.
