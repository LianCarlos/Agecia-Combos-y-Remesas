# 📚 Documentación — Mr Factus

Índice de la documentación del proyecto **Mr Factus**, plataforma de remesas y combos para Cuba.

## Estructura de `docs/`

```
docs/
├── README.md                                    ← Este archivo
└── testing/
    └── mr-factus-test-instructions.md           ← Instrucciones de testeo manual
```

## Documentos

| Documento | Descripción |
|---|---|
| [testing/mr-factus-test-instructions.md](testing/mr-factus-test-instructions.md) | Casos de prueba manual, prerequisitos, datos de prueba, criterios de aceptación y regresión. |

## Fuera de `docs/`

| Archivo | Descripción |
|---|---|
| [`README.md`](../README.md) | README principal: arquitectura, setup, scripts, estructura, módulos. |
| [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql) | Migración inicial con esquema completo, RLS, índices y seed data. |

## Convenciones

- **Idioma**: documentación en español. Nombres técnicos (archivos, variables, SQL) en inglés.
- **Sincronización**: todo cambio de código que afecte comportamiento documentado debe actualizar los docs correspondientes.
- **Testeo**: cada ciclo de implementación produce o actualiza un documento en `docs/testing/`.
