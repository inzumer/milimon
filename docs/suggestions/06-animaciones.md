# 06 · Animaciones y transiciones

Siempre con `prefers-reduced-motion` respetado (el sitio ya las anula en ese caso), duraciones
cortas (150–300 ms) y solo `transform` y `opacity`, para no afectar el rendimiento.

| Lugar                        | Idea                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Navegación entre páginas** | View Transitions de Astro (`<ClientRouter />`): fundido entre páginas y el título de la card "viaja" hasta el encabezado de la página.                         |
| **Inicio**                   | La ilustración de Milagros entra con un leve rebote; las cards aparecen en cascada al hacer scroll.                                                            |
| **Cards**                    | Al pasar el mouse, se elevan unos píxeles con sombra; el ícono de flecha del botón se desplaza.                                                                |
| **Menú lateral**             | Ya se desliza; sumar entrada escalonada de los enlaces y giro suave de la flecha de los desplegables.                                                          |
| **Calculadora**              | El resultado principal cuenta hacia arriba hasta su valor; los pasos del desarrollo aparecen uno tras otro; destello suave en los campos al cargar un ejemplo. |
| **Guardar en el historial**  | El botón cambia a un check animado.                                                                                                                            |
| **Copiar enlace**            | Aviso tipo _toast_ (el `Snackbar` de la librería) en lugar del texto fijo.                                                                                     |
| **Milicitos**                | Las estrellas se "llenan" una por una al entrar en pantalla.                                                                                                   |
| **Recetas y blog**           | Galería con zoom suave en las fotos; barra de progreso de lectura en los artículos.                                                                            |
| **Carga de datos**           | _Skeletons_ en lugar de "Cargando…" (historial, cuenta, textos de la calculadora).                                                                             |
| **Tema claro/oscuro**        | Transición del color de fondo con View Transitions al cambiar de tema.                                                                                         |
| **404**                      | La ilustración con una pequeña animación de humo.                                                                                                              |

Las animaciones reutilizables conviene sumarlas a la librería de componentes (por ejemplo, una
utilidad `reveal` o variantes de `Card`), para que todos los sitios las compartan.
