# Jour 1 — Initialisation du socle (Expo + React Native)

## 1) Commandes à exécuter

```bash
npx create-expo-app@latest marche-du-faucon --template
cd marche-du-faucon

npx expo install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

npm i zustand
npx expo install @react-native-async-storage/async-storage

npm i -D typescript eslint prettier eslint-config-prettier
npx expo start
```

## 2) Arborescence cible

```txt
marche-du-faucon/
├─ app/
│  ├─ _layout.tsx
│  ├─ index.tsx
│  ├─ onboarding.tsx
│  ├─ map.tsx
│  ├─ quests.tsx
│  └─ profile.tsx
├─ src/
│  ├─ core/
│  │  ├─ theme/
│  │  │  ├─ colors.ts
│  │  │  ├─ typography.ts
│  │  │  └─ index.ts
│  │  ├─ constants/
│  │  │  ├─ game.ts
│  │  │  └─ routes.ts
│  │  └─ utils/
│  │     ├─ distance.ts
│  │     ├─ steps.ts
│  │     └─ streak.ts
│  ├─ data/
│  │  ├─ storage/
│  │  │  ├─ keys.ts
│  │  │  └─ persistence.ts
│  │  └─ map/
│  │     ├─ stages.json
│  │     └─ checkpoints.json
│  ├─ features/
│  │  ├─ pedometer/
│  │  │  ├─ service.ts
│  │  │  ├─ permissions.ts
│  │  │  └─ simulator.ts
│  │  ├─ progression/
│  │  │  ├─ engine.ts
│  │  │  ├─ selectors.ts
│  │  │  └─ types.ts
│  │  ├─ mapJourney/
│  │  │  ├─ mapEngine.ts
│  │  │  ├─ interpolation.ts
│  │  │  └─ types.ts
│  │  └─ brandOfSacrifice/
│  │     ├─ streakEngine.ts
│  │     ├─ bleedingState.ts
│  │     └─ types.ts
│  ├─ store/
│  │  ├─ usePlayerStore.ts
│  │  ├─ usePedometerStore.ts
│  │  └─ useUIStore.ts
│  ├─ ui/
│  │  └─ components/
│  │     ├─ Screen.tsx
│  │     ├─ BloodProgressBar.tsx
│  │     ├─ SteelCard.tsx
│  │     ├─ BrandBadge.tsx
│  │     └─ GutsMarker.tsx
│  └─ assets/
│     ├─ map/
│     ├─ avatars/
│     └─ brand/
└─ ...
```

## 3) Palette Dark Fantasy

- `bg.primary`: `#0B0B0D`
- `bg.secondary`: `#15171B`
- `metal`: `#5E6472`
- `blood`: `#8A0303`
- `blood.glow`: `#C1121F`
- `text.primary`: `#E5E7EB`
- `text.muted`: `#9CA3AF`

## 4) Fichiers minimum à créer dès le Jour 1

Créez rapidement les fichiers suivants (même avec contenu minimal) pour fixer l'architecture:

- `src/core/theme/colors.ts`
- `src/core/constants/game.ts`
- `src/features/progression/types.ts`
- `src/features/brandOfSacrifice/types.ts`
- `src/store/usePlayerStore.ts`

L'implémentation complète arrive au Jour 2-3.
