# Preferencias de trabajo — Frank Paul

Documento de referencia para que cualquier asistente o colaborador entienda cómo me gusta trabajar en proyectos de software. No es un estándar rígido: cada proyecto tiene sus particularidades, pero estas son las constantes.

---

## Idioma y comunicación

- Todo el proyecto (UI, documentación, mensajes de error, comentarios en código) va en **español**.
- Prefiero que me expliquen las cosas en lenguaje claro, sin tecnicismos innecesarios.
- Si hay un término técnico importante, está bien usarlo, pero acompáñalo de contexto.

---

## Antes de tocar código: el costo

- **Siempre quiero saber el impacto de un cambio antes de ejecutarlo.** No implementes nada sin decirme primero qué archivos se tocan, qué tan complejo es y si hay riesgo de romper algo.
- Me gusta tomar la decisión informado: dame opciones cuando las haya.
- Si un cambio es trivial (un texto, un color), no necesito el desglose completo. Usa criterio.

---

## Flujo de trabajo

1. **Yo reporto, tú propones.** Normalmente describo lo que vi mal o lo que quiero. Espero una propuesta de solución antes de la ejecución.
2. **Cambios funcionales primero, visuales después.** Si hay que elegir, lo que funciona tiene prioridad sobre lo que se ve bonito.
3. **Iterativo:** prefiero ir cambio por cambio, probar, y seguir. No me gustan los cambios masivos de 10 cosas a la vez sin haberlos visto.
4. **Commits y push solo cuando yo lo pida.** Nunca hagas commit ni push por iniciativa propia. Espera a que te lo diga explícitamente.

---

## Commits y versionamiento

- **Mensajes de commit:** descriptivos y en español. Ni muy técnicos ni muy cortos. Ejemplo aprobado:
  > "Agregar eliminación de usuarios: desactiva la cuenta, libera el correo y conserva el historial"
- **Repositorio privado en GitHub.** Salvo que yo indique lo contrario.
- **Nunca subir:** `.env`, credenciales, `node_modules/`, carpetas de logs o uploads.

---

## Documentación del proyecto

- Cada proyecto debe tener al menos dos documentos de referencia:
  - **`CLAUDE.md`** — Especificación funcional, stack, comandos de arranque y registro de cambios. Es el documento principal que se consulta en cada sesión.
  - **`ARQUITECTURA.md`** — Guía técnica: qué hace cada archivo, cómo interactúan las capas, decisiones de diseño.
- Ambos documentos deben **mantenerse actualizados** con cada cambio relevante.
- **Consistencia de estructura:** si un documento tiene una sección (ej. "## Visión general", "## Stack técnico"), todos los proyectos que aplique deben tenerla. El contenido puede variar según el proyecto, pero la estructura debe ser consistente para que sea fácil encontrar información y navegar entre documentos.
- Registro de cambios en `CLAUDE.md`: una entrada por fecha con los cambios del día, formato `feat/fix/refactor`.

---

## Estructura y organización

- **Separación clara entre capas:** la lógica de negocio no va en los routers/controladores. Va en servicios.
- **Carpetas por responsabilidad:** models, schemas, services, routers, utils, jobs — cada cosa en su lugar.
- **Nada hardcodeado:** catálogos, configuraciones y valores que puedan cambiar deben ser dinámicos (base de datos o archivo de configuración).
- **Archivos pequeños y enfocados:** un archivo por modelo, un archivo por servicio, un router por recurso. Nada de archivos gigantes con todo mezclado.

---

## Datos y eliminaciones

- **Nunca borrar datos reales.** Siempre soft delete. La información histórica se preserva.
- **Sin cascada destructiva.** Si un registro tiene relaciones, se desactiva pero no se elimina físicamente.
- **Bitácora inmutable:** toda acción importante queda registrada con usuario y timestamp. El historial no se edita.

---

## Entorno de desarrollo

- **Sistema operativo:** Windows
- **Terminal:** PowerShell / CMD
- **Backend:** Python + FastAPI (ejecutar desde la carpeta `backend/`)
- **Frontend:** React + Vite + TypeScript + TailwindCSS
- **Base de datos:** SQL Server con ODBC Driver 17
- **Entorno virtual Python:** `.venv` en la raíz del proyecto
- Me gusta tener los **comandos de arranque documentados** y listos para copiar-pegar.

---

## Arquitectura esperada

Independientemente del proyecto, la arquitectura debe seguir estos principios:

### Enfoque general: capas con responsabilidades claras

No se busca una arquitectura hexagonal ni patrones académicos estrictos. Se busca una **arquitectura por capas práctica**: cada capa tiene un trabajo y no se salta a otra.

### Backend — Las 4 capas

```
Router → Service → Model → Base de datos
```

| Capa | Responsabilidad | Lo que NO hace |
|---|---|---|
| **Router** | Recibe la petición HTTP, valida entrada (schemas) y delega al service | No tiene lógica de negocio, no consulta la BD directamente |
| **Service** | Toda la lógica de negocio: validaciones, reglas, decisiones | No define rutas HTTP ni formatea respuestas |
| **Model** | Define la estructura de las tablas (ORM) | No toma decisiones, solo describe datos |
| **Schema** | Contratos de entrada y salida (qué se acepta, qué se devuelve) | No accede a la BD ni ejecuta lógica |

Capas auxiliares que complementan el flujo principal:

- **Jobs** — Tareas programadas en segundo plano (cierres automáticos, alertas, limpieza).
- **Utils** — Funciones compartidas (autenticación, envío de correo, helpers).
- **Dependencies** — Inyección de contexto (usuario actual, guardias de rol).

### Frontend — Las 3 capas

```
Page/Component → Service → API Backend
```

| Capa | Responsabilidad |
|---|---|
| **Page** | Pantalla completa asociada a una ruta. Presenta datos y llama a los services |
| **Component** | Pieza reutilizable (layout, modales, badges). Recibe props, no llama a la API |
| **Service** | Funciones que hablan con el backend (un archivo por recurso) |

- El estado global se limita a lo estrictamente necesario (autenticación). Todo lo demás es estado local de cada página.
- Un archivo por recurso en services: `tickets.ts`, `users.ts`, `categories.ts`, etc.

### Principios que aplican siempre

1. **La lógica de negocio vive en los services.** Nunca en routers, nunca en componentes de UI.
2. **Un archivo, una responsabilidad.** Un modelo por archivo, un service por recurso, un router por recurso.
3. **Las capas no se saltan.** El router no habla directo con el modelo. La página no habla directo con la API sin pasar por el service.
4. **Nada más complejo de lo que el proyecto necesita.** Si una abstracción no resuelve un problema real, no se agrega.

---

## Lo que NO me gusta

- Que hagan cambios sin avisarme.
- Commits automáticos o silenciosos.
- Mensajes de commit genéricos tipo "fix bug" o "update files".
- Respuestas demasiado largas cuando la pregunta era simple.
- Que asuman cosas sobre el proyecto sin preguntar.
- Cambios masivos sin desglose previo.
- Que se mencione en los commits o en GitHub que el mensaje fue generado con IA (ej. líneas tipo `Co-Authored-By: Claude`). Los commits deben quedar limpios, solo con el mensaje descriptivo.

---

*Este documento refleja el estilo de trabajo observado hasta mayo de 2026. Puede evolucionar.*
