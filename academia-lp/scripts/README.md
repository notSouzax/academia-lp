# Scripts de administración

Esta carpeta contendrá scripts ejecutables con `npm run` para tareas operativas.
Se irán añadiendo en la Fase 1 y siguientes.

## Lista prevista

- `create-student.ts` — dar de alta una alumna nueva (Fase 1).
- `delete-student.ts` — borrar una alumna y todos sus datos (Fase 1).
- `list-students.ts` — listar alumnas activas (Fase 1).
- `reset-student-password.ts` — generar un código nuevo (Fase 1).
- `rebuild-brain.ts` — regenerar el context cache de Gemini (Fase 1).
- `student-activity.ts` — diagnóstico de actividad (Fase 1).
- `export-student-data.ts` — exportar datos de una alumna (RGPD) (Fase 3).
- `backup-db.ts` — backup manual de la BD (Fase 3).

Todos requieren `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` y se ejecutan localmente, nunca desplegados.
