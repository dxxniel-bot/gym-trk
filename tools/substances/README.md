# Catálogo de sustancias (v295)

El dueño (2-oct-2026): "la base de datos respecto a suplementos, skincare y medicamentos está muy pobre… que lo identifique tal
cual, qué sustancia es para saber cuál es el perfil de beneficios y efectos secundarios de acuerdo a la dosis… hacer bien la
categorización de cada una". Esta carpeta arma ese catálogo.

## Qué hay aquí

| Archivo | Qué es |
|---|---|
| `families.json` | El manifiesto: cada sustancia con su `id`, nombre y categoría (`supp` · `drug` · `hormone` · `peptide` · `skin` · `other`). Agregar una sustancia = agregarla aquí. |
| `aliases.json` | Alias base (lo que escribe la gente: español, inglés, marcas, jerga, códigos). `shared` = alias que a propósito apuntan a dos fichas (gana la de la categoría del item). |
| `nutrition.json` | Lo que una sustancia suma a macros y micros (dosis típica, sales con su fracción elemental, UI↔µg, peso de cápsula o scoop). |
| `catalog.json` | Las fichas investigadas y verificadas: dosis de estudios y fichas oficiales, efectos, efectos secundarios, qué vigilar, interacciones, sueño, estatus (COFEPRIS, FDA, WADA), evidencia A–D y fuentes. |
| `research-workflow.js` | El flujo de agentes que investiga y verifica el catálogo por **lotes de 6-8** (un investigador y un verificador que intenta tumbar cada dato), de 5 en 5, y se detiene limpio si se acaba el límite. `args.only` / `args.skip` eligen lotes (`drug_a#0`…); un lote con `pre` solo se verifica. |
| `merge.cjs` | Junta lo que devolvió el flujo (`journal.jsonl`) en `catalog.json`, **ficha por ficha**: una verificada reemplaza a la que hubiera; una solo investigada entra como `_verified:false` y nunca pisa a una verificada. Imprime cuántas lleva cada familia. |
| `validate.cjs` | Revisa `catalog.json`: todo dato con fuente real, fuentes con PMID/DOI/https, "sin datos en humanos" sin dosis, palabras que suenan a protocolo. |
| `build.cjs` | Escribe el índice dentro de `index.html` (bloque `/*SUBIDX*/`) y `substances.json` (las fichas, para el sitio). `--check` falla si algo no está al día. |
| `test.cjs` | Prueba el identificador REAL (sacado de `index.html`) con los nombres del dueño, los falsos de antes y la dosis contra lo estudiado. |

## Cómo se usa

```
node tools/substances/merge.cjs <journal.jsonl> [<journal.jsonl> …]
node tools/substances/validate.cjs
node tools/substances/build.cjs
node tools/substances/test.cjs
```

## La postura

La ficha dice lo que reporta la literatura: qué es, qué se ha visto a la dosis que registras (dentro de lo estudiado, por encima,
o sin datos en humanos), efectos secundarios, qué vigilar, con qué interactúa de lo que ya tomas, su efecto en el sueño, estatus
y evidencia. **No da dosis recomendadas, ciclos, combinaciones ni protocolos**; las dosis que aparecen son de estudios publicados
o de fichas oficiales, con su contexto y su fuente. Siempre "no es consejo médico". Nada de esto sale a anuncios ni analítica.

## En la app

- `subIdentify(texto, {cat})` → las sustancias de un nombre (un "+" o ", y, con" separan un producto con varias), con la dosis
  que dice el nombre. Acentos, guiones y símbolos no importan (`omega-3` = `omega 3` = `ω3`; `mk-7` = `mk7`).
- `subOfItem(it)` → la identificación de un item del stack (su categoría decide entre dos fichas con el mismo nombre; `it.subPick`
  = la que eligió el dueño cuando no se reconoció sola). Desde v296 un PARECIDO (prefijo o una letra de diferencia) no identifica:
  sale en `amb` con `guess:true` y vale cuando se elige ("tiroxina" no es "tirosina").
- `subInterMatch(con, sustancia)` → si el "con" de una interacción habla de esa sustancia: nombre o alias exacto, o su clase
  con todas sus palabras ("aceite mineral" no es un "mineral esencial").
- `subItemNutr(it)` → lo típico, escalado a la dosis del item; lo de la etiqueta del dueño (`it.nutr`, `nutrSrc:'user'`) gana.
- `subProfiles()` → baja `substances.json` una vez (sw.js lo guarda al instalar); `subDoseVerdict`, `subInterHits`, `openSubCard`.
- Higiene 3 (`subHygiene`, en `migrate`, una vez): quita los nutrientes que el detector viejo dejó de OTRA sustancia (nunca lo
  que escribió el dueño), pone la categoría del catálogo y guarda el deshacer exacto (`subHygieneUndo`).
