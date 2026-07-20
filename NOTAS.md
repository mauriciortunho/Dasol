# Notas técnicas del repo

Apuntes de cosas que hay que reaplicar a mano cuando se regenera algo
(node_modules, carpeta `android/` por prebuild, etc.). No es código de la app.

## Parche: foojay-resolver-convention a 1.0.0 (build de Android con Gradle 9)

**Síntoma:** la compilación de Android con Gradle 9.x falla con:

```
Class org.gradle.jvm.toolchain.JvmVendorSpec does not have member field
'org.gradle.jvm.toolchain.JvmVendorSpec IBM_SEMERU'
```

**Causa:** el plugin `org.gradle.toolchains.foojay-resolver-convention` viene
fijado en `0.5.0` dentro del gradle-plugin de React Native, que entra al build
como *composite build* (`includeBuild`). Esa versión referencia la constante
`IBM_SEMERU`, removida en Gradle 9. La solución es subir el plugin a `1.0.0`.

**Dónde está (ojo, NO es `android/settings.gradle`):**

`node_modules/@react-native/gradle-plugin/settings.gradle.kts`, línea 16.

```diff
- plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0") }
+ plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0") }
```

**Cuándo se pierde:** este archivo vive en `node_modules/`, así que lo borra
**cualquier `npm install`** (no hace falta un prebuild). Cada vez que se
reinstalen dependencias hay que volver a aplicar este cambio.

**Cómo automatizarlo (pendiente de confirmar, NO implementado):** lo más
robusto es `patch-package`: instalarlo, dejar el cambio hecho, correr
`npx patch-package @react-native/gradle-plugin` para generar el `.patch`, y
agregar un script `"postinstall": "patch-package"` para que se reaplique solo
tras cada `npm install`. No está hecho todavía: confirmar antes de implementarlo.
