# 09 · Dirección visual: fino y elegante

Queremos un sitio lindo y destacable, con un aire fino y editorial, sin perder lo que ya es
identidad: la ilustración de Milagros y los milicitos. La clave es que la ilustración y las
estrellas sean el toque cálido y todo lo demás acompañe con calma.

## Referencias

- [Kubo Cuisine](https://kubocuisine.es/): paleta neutra (arena, beige, blanco y negro), fotografía
  grande como protagonista, mucho espacio en blanco, sans-serif limpia, llamadas a la acción de
  texto ("Ver destinos") en lugar de muchos botones y un pie ordenado con contacto, redes y legales.
- [La Tiendita di](https://latienditadi.com/guias-de-viaje/): contenido por secciones con imagen
  destacada y enlaces cruzados (ver [03](./03-contenido-y-redes.md)).

- Pinterest, apps de recetas ([1](https://pin.it/1Vsh0PpDJ), [2](https://pin.it/1OXAWxsuV)): referencia
  de UI y color para la sección de recetas y el modo oscuro (detalle abajo).
- Pinterest, app de café ([3](https://pin.it/4Cht8v17L)): referencia del **modo claro** y del uso de
  imágenes (detalle abajo).

## Recetas: referencia de Pinterest

**Paleta** (aproximada, tomada de las capturas): marrón chocolate de fondo `#2B1B14`, superficies
`#3A271E`, acento naranja terracota `#F58A4B`, durazno claro `#EFA27A` y texto crema `#F5EDE6`.
Nuestro marrón oscuro actual (`#2F201B`) ya es casi el mismo; la propuesta es **sumar una escala
"terracota"** a los tokens como acento de la sección de recetas (o secundario del sitio) y dejar el
amarillo para la marca y los milicitos. Se decide con un moodboard y pruebas de contraste AA.

**Modo claro** (referencia 3): fondo crema/marfil `~#F6E8D7` con superficies apenas más claras
`~#FBF3EA`, el mismo acento naranja `~#F29A3E` en botones tipo píldora y texto marrón oscuro
`~#3B2A20`. Nuestro fondo claro actual (`#FDF7F1`) ya es crema: el cambio es sumar el naranja.

| Modo   | Fondo                | Superficies       | Acento               | Texto                |
| ------ | -------------------- | ----------------- | -------------------- | -------------------- |
| Claro  | crema `~#F6E8D7`     | marfil `~#FBF3EA` | naranja `~#F29A3E`   | chocolate `~#3B2A20` |
| Oscuro | chocolate `~#2B1B14` | `~#3A271E`        | terracota `~#F58A4B` | crema `~#F5EDE6`     |

El amarillo actual queda para la marca y los milicitos (o se reemplaza por el naranja si el
moodboard lo confirma); siempre validando contraste AA en los dos modos.

**Uso de imágenes** (referencia 3): fotos del plato o el producto **vistas desde arriba**,
recortadas sobre fondo liso del color de la página, **centradas** y con una **sombra suave**; mucho
aire alrededor y una sola imagen protagonista por pantalla. En modo oscuro, las fotos a sangre con
degradado (referencias 1 y 2). La guía completa (luz, ángulos, distancia, foco, fondos, formatos
y edición) está en [11 · Guía de fotografía](./11-guia-de-fotografia.md).

**Componentes que inspira**

- **Card vertical con imagen** a sangre, **degradado oscuro** de abajo hacia arriba para el título y
  la bajada, y **botones flotantes** (guardar, compartir) sobre la foto.
- **Carrusel** de cards (recetas destacadas, categorías, últimas del blog): nuevo componente
  `Carousel` en `@inzumer/ui-library` con scroll-snap, botones anterior/siguiente, arrastre táctil,
  teclado, `aria-roledescription="carrusel"`, sin autoplay por defecto y respetando
  `prefers-reduced-motion`.
- **Chips de filtro** (ver [03](./03-contenido-y-redes.md)).
- **Ficha de receta**: foto grande con el título encima, datos clave en chips (tiempo, porciones,
  costo por porción, milicitos), **ingredientes en grilla con íconos**, **pasos para ir tildando**,
  galería y un botón **"Empezar a cocinar"** que abre un modo paso a paso con la pantalla siempre
  encendida (Wake Lock API).
- **Carga de recetas en pasos** (título → información → ingredientes → pasos → opcionales): útil
  como guía para diseñar los formularios del CMS (ver [02](./02-cms-y-emails.md)).

**Logos**: con la paleta nueva conviene revisar el logo. Idea: mantener la ilustración de Milagros
para "Sobre mí" y las redes, y sumar un **isotipo simple** (la estrella de los milicitos o una "M"
con gorro) y un **logotipo tipográfico** que funcionen chicos, en favicon y sobre fotos.

## Principios

- **Aire**: más espacio en blanco entre secciones y dentro de las cards; menos elementos por
  pantalla. Lo elegante suele ser lo que se saca.
- **Tipografía con jerarquía**: Lobster Two solo para títulos grandes y la marca; Nunito para todo
  lo demás, con tamaños y pesos bien escalonados (títulos más grandes, textos más livianos, más
  interlineado). Evaluar una serif fina para citas y bajadas (por ejemplo Fraunces o Playfair
  Display, gratis en Google Fonts).
- **Color contenido**: el amarillo como acento (botones principales, milicitos, destacados) y no
  como fondo de grandes bloques; el resto en los neutros cálidos que ya existen.
- **Fotografía**: cuando lleguen las recetas y el blog, fotos propias con luz natural, fondos
  neutros y el mismo encuadre; la ilustración queda para la marca, "Sobre mí" y los estados vacíos.
- **Detalles consistentes**: mismos radios, bordes finos, sombras muy suaves, íconos de línea del
  mismo trazo.
- **Movimiento sutil**: transiciones cortas y suaves (ver [06](./06-animaciones.md)); nada que
  salte ni distraiga.

## Ideas concretas

- **Inicio tipo portada editorial**: título grande, bajada corta, la ilustración más chica y a un
  lado en escritorio; debajo, una receta o artículo destacado con foto grande.
- **Cards con imagen** para recetas, artículos y guías (foto arriba, título, una línea de bajada y
  los milicitos), en una grilla prolija.
- **Milicitos como sello**: la estrella en tamaño chico y consistente en listados, y una versión
  más grande solo en la ficha de la reseña.
- **Separadores y ornamentos mínimos** (una línea fina, una estrella pequeña) entre secciones.
- **Modo oscuro cuidado**: neutros cálidos y contrastes suaves, no negro puro.
- **Página de receta** con ficha tipo recetario: ingredientes en una columna, pasos numerados,
  costo por porción y milicitos en un recuadro.
- **Microdetalles**: cursor, estados de foco y hover coherentes; subrayados finos en los enlaces.

## Cómo llevarlo a cabo

1. Un **moodboard** corto (Pinterest o Figma, gratis) con referencias de blogs de cocina editoriales.
2. Ajustar los **tokens** (espaciados, tipografías, sombras) en `@inzumer/tokens` y en el tema del
   sitio, para que el cambio se aplique en todas las páginas a la vez.
3. Rediseñar primero el inicio y una receta modelo; con eso aprobado, extender al resto.
