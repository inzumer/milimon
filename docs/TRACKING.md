# Medición con Google Tag Manager

La analítica pasa por **Google Tag Manager** (`PUBLIC_GTM_ID`). GA4 y cualquier otra etiqueta
se configuran dentro del contenedor, no en el código. El contenedor se carga **solo después de que
la persona acepta** el banner (Consent Mode v2, todo `denied` por defecto).

## Eventos (`dataLayer`)

Cada llamada a `track()` se empuja como evento de GTM:
`{ event: '<nombre>', ...propiedades }`. Para usarlos, en GTM: **Activador → Evento
personalizado** con el nombre del evento, y **Variables de la capa de datos** para sus propiedades.

| Evento                  | Propiedades          | Cuándo                                        |
| ----------------------- | -------------------- | --------------------------------------------- |
| `tool_selected`         | `formula`            | Se elige una cuenta en la calculadora general |
| `example_loaded`        | `formula`, `example` | Se carga un ejemplo                           |
| `calculation_completed` | `formula`            | Una cuenta llega a un resultado válido        |
| `calculator_reset`      | `formula`            | Se limpian los datos                          |
| `calculation_saved`     | `formula`            | Se guarda en el historial                     |
| `history_opened`        | `formula`            | Se reabre un cálculo del historial            |
| `history_deleted`       | `formula`            | Se borra un cálculo del historial             |
| `language_changed`      | `from`, `to`         | Cambio de idioma                              |
| `theme_changed`         | `scheme`             | Cambio de tema                                |
| `currency_changed`      | `currency`           | Cambio de moneda                              |
| `menu_opened`           | —                    | Se abre el menú                               |
| `sign_in`               | `provider`           | Se inicia sesión (Google o Facebook)          |
| `sign_in_failed`        | `provider`, `reason` | Falla o se cancela el inicio de sesión        |
| `sign_out`              | —                    | Se cierra la sesión                           |
| `page_shared`           | `method`, `path`     | Se comparte una página (red o copiar enlace)  |

Nunca se envían los números que la persona carga.

## Ids de elementos

Todo elemento interactivo tiene un `id` estable, igual en cada carga de la página, generado con
`trackingId(scope, kind, ...name)` (`src/utils/tracking`):

```
<ámbito>-<tipo>-<nombre>        todo en kebab-case
```

- **ámbito**: la fórmula (`waste-factor`, `recipe-costing`…) o la sección (`menu`, `settings`,
  `consent`, `calculator`, `history`, `home`, `formulas`, `learn`, `privacy`, `account`, `login`).
- **tipo**: `input`, `select`, `switch`, `button` o `link` (`TRACKING_KINDS` en `src/constants`).
- **nombre**: qué es; en listas lleva la posición (1, 2, 3…).

Ejemplos:

| Elemento                                  | id                                                   |
| ----------------------------------------- | ---------------------------------------------------- |
| % de desecho del factor de desecho        | `waste-factor-input-waste-percentage`                |
| Cargar el ejemplo del manual              | `waste-factor-button-load-example-manual-tenderloin` |
| Guardar en el historial                   | `waste-factor-button-save-history`                   |
| Precio unitario del 2.º ingrediente       | `recipe-costing-input-ingredient-2-unit-price`       |
| Selector de la calculadora general        | `calculator-select-tool`                             |
| Abrir el menú                             | `menu-button-open`                                   |
| Link del menú a "Merma de cocción"        | `menu-link-formulas-cooking-loss`                    |
| Aceptar cookies                           | `consent-button-accept`                              |
| Abrir el 1.er cálculo del historial       | `history-button-open-1`                              |
| CTA de la card de la calculadora (inicio) | `home-link-calculator`                               |

En GTM:

- **Clics**: Activador → _Clic: todos los elementos_ (o _Solo enlaces_) con la condición
  `Click ID` igual a / contiene el id. Por ejemplo, `Click ID contiene -button-save-history`
  mide "guardar" en todas las calculadoras.
- **Campos**: Activador → _Visibilidad del elemento_ o _Clic_ con `Click ID` que empiece con
  `<fórmula>-input-`. Habilitá la variable integrada **Click ID** en _Variables_.
