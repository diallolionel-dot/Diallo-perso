# Diallo Coaching

Application personnelle de coaching sportif et nutritionnel, en PWA mobile-first, avec une direction artistique RPG sombre : fond bleu nuit, or pour les récompenses, turquoise pour la progression.

> **Phase 1 : socle et interface.** Les écrans affichent des **données fictives** clairement signalées.
> Rien n'est enregistré et aucune analyse IA n'est active.

## Écrans

| Écran | Route | Contenu (phase 1) |
| --- | --- | --- |
| QG | `/` | Poids, objectif, courbe, niveau et XP, quêtes du jour, résumé, régularité, trophées, état du système |
| Nutrition | `/nutrition` | Bilan des macros, journal des repas, emplacements photo |
| Arène | `/arene` | Statistiques du mois, plan de la semaine, dernière séance (exercices, séries, charges) |
| Évolution | `/evolution` | Courbe et historique des pesées, mensurations, galerie photo privée |
| Mentor | `/mentor` | Aperçu de l'interface du coach (messages d'exemple rédigés à la main) |

## Stack

- **Next.js 16** (App Router, Cache Components, Turbopack), **React 19**, **TypeScript** strict
- **Tailwind CSS 4** : design tokens dans `src/app/globals.css`
- **Supabase** (`@supabase/ssr`) : client **serveur uniquement**
- **Zod** pour la validation des saisies, **Vitest** pour les tests, **lucide-react** pour les icônes
- Graphiques en SVG natif, sans librairie de graphiques

## Lancer le projet

Prérequis : Node.js ≥ 20.9 (testé avec Node 22).

```bash
npm install
npm run dev          # http://localhost:3000
```

Aucune variable d'environnement n'est nécessaire pour la démonstration.

### Tester sur le téléphone (S24)

```bash
npm run build && npm run start -- -H 0.0.0.0     # port 3000
```

Ouvre ensuite `http://<IP-de-ton-ordinateur>:3000` dans Chrome sur le téléphone, connecté au même Wi-Fi.
Pour **installer** l'application (menu ⋮ → *Ajouter à l'écran d'accueil*) et activer le service worker, Chrome exige **HTTPS**. Le plus simple est de déployer sur Vercel (gratuit) : importer le dépôt sur vercel.com, puis ouvrir l'URL `https://…vercel.app` sur le téléphone.

### Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm run start` | Build et serveur de production |
| `npm run lint` | ESLint (config Next.js) |
| `npm run typecheck` | Génère les types de routes puis exécute `tsc --noEmit` |
| `npm test` | Tests unitaires (règles XP, synchronisation XP TS ↔ SQL, formatage) |
| `npm run test:sql` | Applique la migration sur un Postgres jetable et exécute les tests de sécurité (`PGURL` requis) |
| `npm run check` | Lint + typage + tests + build |

## Structure

```
src/
  app/                    routes (QG, nutrition, arene, evolution, mentor), layout, manifest PWA
  components/
    ui/                   design system : Card, ProgressBar, Stat, Pill, Button, MacroRing, DemoBanner, PhaseNotice
    rpg/                  LevelCard, QuestList, BadgeMedal
    charts/               WeightChart (SVG)
    layout/               BottomNav, PageHeader, SystemStatus
    pwa/                  enregistrement du service worker
  lib/
    rpg/xp.ts             règles XP, niveaux, titres, régularité
    demo/data.ts          ⚠️ données fictives (phase 1 uniquement)
    supabase/             env (validée par Zod) + clients serveur
    validation/schemas.ts schémas Zod des saisies
    format.ts             formatage des nombres en français
  types/database.ts       types de la base (à régénérer en phase 2)
supabase/
  migrations/             schéma, RLS, bucket privé, award_xp, export et suppression des données
  tests/                  tests de sécurité SQL (bouchons Supabase + scénarios)
public/
  sw.js, offline.html     service worker minimal et page hors ligne
  icons/                  icônes PWA (SVG source + PNG 192/512/maskable/apple)
```

## Design system

Les tokens sont définis dans `@theme` (`src/app/globals.css`) et disponibles comme classes Tailwind :

- **Fonds** : `night-950` → `night-600`, bordures `line` / `line-strong`
- **Texte** : `ink`, `ink-soft`, `ink-muted`, `ink-faint`
- **Récompenses (or)** : `gold-200` → `gold-600`
- **Progression (turquoise)** : `teal-200` → `teal-600`
- **Accents** : `ember-400` (combat), `violet-400` (repos, démonstration)
- **Typographies** : `font-display` (Cinzel, titres) et `font-sans` (Inter)
- **Animations** discrètes (`animate-bar-fill`, `animate-rise`, `animate-glint`), désactivées si le système demande moins d'animations

## Règles RPG

Définies dans `src/lib/rpg/xp.ts` et dupliquées dans la table SQL `xp_rules`. Un test vérifie que les deux restent identiques.

- L'XP récompense les **actions de suivi** (pesée, repas, séance, sommeil, mensurations, photo, check-in, bilan) et la **régularité** (5 jours suivis sur 7).
- **Jamais** les calories brûlées, le déficit ou la restriction alimentaire. Un test le vérifie.
- Le **repos planifié** rapporte de l'XP.
- Aucune perte d'XP ni série remise à zéro : la régularité se mesure sur 7 jours glissants.
- Plafonds journaliers pour éviter de « farmer » l'XP. L'XP n'est attribuée que par la fonction SQL `award_xp()`.

## Sécurité

- **Aucune clé dans le client.** Aucune variable n'est préfixée `NEXT_PUBLIC_`. Les modules Supabase importent `server-only`, ce qui fait échouer le build si on les importe dans un composant client. Toutes les requêtes passeront par le serveur Next.js (Server Components et Server Actions), avec une session en cookies httpOnly.
- **Row Level Security** sur toutes les tables : chaque utilisateur ne voit et ne modifie que ses lignes. L'XP, les succès et les réponses du Mentor ne peuvent pas être écrits directement par le client.
- **Stockage photo privé** : bucket `private-media` non public, chemins `{user_id}/…`, 10 Mo maximum, formats image uniquement. Lecture via **URLs signées** de 10 minutes.
- **Validation** : schémas Zod côté serveur et contraintes `CHECK` en base (bornes, longueurs, cohérence).
- **Export** (`export_my_data()`) et **suppression** (`delete_my_data()` + suppression du compte via l'API admin côté serveur).
- En-têtes de sécurité (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`). Le service worker ne met en cache que les ressources statiques, jamais les pages ni les données.

Les tests `supabase/tests/` vérifient notamment :

- l'isolation entre deux utilisateurs ;
- le refus d'une XP forgée ou antidatée ;
- le refus d'un message « assistant » forgé ;
- le refus d'un envoi de photo dans le dossier d'un autre utilisateur ;
- l'export, la suppression et la cascade à la suppression du compte.

## Configurer Supabase (phase 2)

1. Créer un projet sur [supabase.com](https://supabase.com) (région UE recommandée).
2. Appliquer la migration, au choix :
   - copier le contenu de `supabase/migrations/20261029000000_init.sql` dans *SQL Editor* et l'exécuter ;
   - ou avec la CLI : `npx supabase init`, `npx supabase link --project-ref <ref>`, puis `npx supabase db push`.
3. **Compte privé** : *Authentication → Sign In / Providers* → désactiver *Allow new users to sign up*, puis créer ton unique compte depuis *Authentication → Users*.
4. Copier `.env.example` en `.env.local` et renseigner `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` (*Project Settings → API Keys*). `SUPABASE_SECRET_KEY` ne sert qu'aux opérations d'administration.
5. Régénérer les types : `npx supabase gen types typescript --project-id <ref> > src/types/database.ts`.

La carte « État du système » du QG passe alors à *Configurée*. Les écrans restent en mode démonstration jusqu'à la phase 2.

## Feuille de route

- **Phase 1 (ce dépôt)** : socle, design system, écrans en données fictives, préparation Supabase et PWA.
- **Phase 2** : authentification, saisies réelles (pesées, repas, séances, mensurations, check-ins), photos privées, attribution de l'XP.
- **Phase 3** : analyse IA des photos (estimations modifiables) et Mentor contextualisé, appelés uniquement côté serveur.
- **Phase 4** : notifications, bilans hebdomadaires, succès avancés, paquet Android (TWA) si besoin.
