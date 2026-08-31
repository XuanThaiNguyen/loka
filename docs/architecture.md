# Project architecture

Loka uses Expo Router with a top-level `src` directory. Route files stay thin and
delegate rendering and feature logic to modules outside `src/app`.

## Directory responsibilities

```text
src/
  app/          Expo Router routes and layouts only
  features/     Feature screens, components, services, data, stores, and types
  components/   Shared components grouped by responsibility
    navigation/ Shared navigation UI
    ui/         Reusable UI primitives
  theme/        Design tokens, navigation theme, and theme provider
  constants/    Stable app-level values
  config/       Runtime configuration and feature flags
  providers/    App-wide provider composition
  hooks/        Shared hooks
  lib/          API clients and other infrastructure
  i18n/         Dictionaries, i18next setup, and the i18n provider
  utils/        Shared pure helpers when needed
  types/        Types shared by multiple features when needed
```

Root configuration files such as `app.json`, `package.json`, `metro.config.js`,
and `tsconfig.json` remain at the project root, as recommended by Expo Router.

## Dependency boundaries

- `src/app` may import screens and providers, but it must not contain business logic.
- Feature-only code stays inside its feature. A feature screen belongs in its
  `screens` directory and feature-only network orchestration belongs in `services`.
- `src/components` must not depend on a feature module.
- `src/lib` contains vendor and infrastructure clients. It must not depend on UI.
- Shared hooks, types, and helpers should be promoted out of a feature only when
  they are genuinely reused.
- Prefer the `@/` alias for cross-directory imports.

## Routing notes

- `(tabs)` is the current protected-product shell candidate, but authentication is
  not implemented yet. Add `(auth)` and a protected `(main)` group only when the
  app has a real session source.
- The current JavaScript tab navigator is intentional because the center action has
  custom presentation. Native tabs can replace it later if that visual requirement
  is removed or supported by the SDK API.
- Every route module exports a screen from `src/features`; layouts are the only route
  modules that compose navigators and app-wide routing behavior.

## Optional directories

`src/utils`, `src/types`, and `tests` should be created when they have real content.
Empty architectural folders are avoided because Git does not preserve them and they
encourage premature sharing.
