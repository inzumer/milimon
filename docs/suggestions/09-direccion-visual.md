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
