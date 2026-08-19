# Notas para agentes

## Dev server: webpack, nunca Turbopack

Levantá el dev server **solo** con `npm run dev` — el script fija `--webpack` a propósito.

Next 16 usa Turbopack por defecto y en este repo se come toda la RAM hasta colgar la
máquina. Invocar `next dev` / `npx next dev` a mano saltea el script y vuelve a Turbopack.

- Otro puerto: `npm run dev -- -p 3111`
- Para verificar una página, preferí `npm run build` + `npm run start` (mucho más liviano)
