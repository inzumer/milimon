## Descripción

<!-- Qué problema resuelve o qué funcionalidad agrega. Contexto adicional si hace falta. -->

## Fase del plan

<!-- F0…F10 de docs/PLAN.md -->

## Tipo de cambio

<!-- Marcá con una "x" lo que corresponda -->

- [ ] Bug fix
- [ ] Nueva feature / pantalla / calculadora
- [ ] Contenido (explicaciones, traducciones)
- [ ] Refactor sin cambio de funcionalidad
- [ ] Documentación
- [ ] CI / build / tooling

## Checklist

- [ ] El título del PR y los commits siguen [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (ver [CLAUDE.md](../CLAUDE.md))
- [ ] `pnpm validate` pasa localmente (typecheck, lint, test:coverage ≥ 90%, build)
- [ ] `pnpm format:check` y `pnpm spellcheck` pasan
- [ ] Traducciones: `es` y `en` tienen las mismas claves; carpetas en kebab-case; cada input con label + placeholder descriptivo
- [ ] Fórmulas: siguen el manual y tienen tests con sus ejemplos
- [ ] Accesibilidad revisada en modo claro y oscuro (teclado, labels, contraste)
- [ ] Mobile-first verificado (≤ 1024px y centrado por encima)
- [ ] `pnpm audit` sin vulnerabilidades

## Issue relacionado

Closes #

## Notas adicionales

<!-- Decisiones técnicas, capturas (claro/oscuro, mobile/desktop), etc. -->
