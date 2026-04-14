# Senior Implementation Checklist

Antes de dar por terminada una tarea o enviar un Pull Request, asegúrate de cumplir con los siguientes puntos:

## 1. Integridad Técnica
- [ ] ¿El código refleja fielmente el diseño del `architect-go-next`?
- [ ] ¿Se han resuelto todas las subtareas definidas por el `project-planner` para este hito?
- [ ] ¿Los nombres de variables, funciones y tipos son descriptivos y coherentes con el proyecto?

## 2. Calidad del Código
- [ ] **Go:** ¿Se manejan todos los errores? ¿Se cierran los recursos (body, file, channel)?
- [ ] **TypeScript:** ¿Se han evitado los `any`? ¿Los tipos reflejan los esquemas de la API?
- [ ] **React:** ¿Se ha optimizado el renderizado? ¿Se usan correctamente los hooks?

## 3. Pruebas y Validación
- [ ] ¿Se han añadido o actualizado las pruebas unitarias?
- [ ] ¿Se han verificado los "edge cases" (inputs nulos, errores de red, etc.)?
- [ ] ¿Se han cumplido los Criterios de Aceptación del plan original?

## 4. Estilo y Seguridad
- [ ] ¿Se ha ejecutado el linter y formateador (ej: `go fmt`, `eslint`, `prettier`)?
- [ ] ¿Se han protegido los datos sensibles (no hardcoded keys, logs limpios)?
- [ ] ¿Se han sanitizado los inputs (validación Zod o Go validators)?

## 5. Documentación
- [ ] ¿Se han actualizado los comentarios en funciones públicas/complejas?
- [ ] ¿Se ha actualizado el Roadmap/Ticket de seguimiento?

---
**Nota:** Un Senior Developer no solo entrega código que funciona; entrega confianza al equipo.
