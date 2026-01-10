# Guía de Testing Post-Correcciones de Seguridad

## Instrucciones Generales

Esta guía cubre el testing completo después de aplicar las correcciones de seguridad. Sigue el orden indicado y marca cada test como completado.

## Fase 1: Testing SQL Directo

### Paso 1.1: Ejecutar Script Automatizado

1. Abre Supabase SQL Editor
2. Ejecuta el script: `supabase/52_test_security_fixes.sql`
3. Revisa los resultados en los logs
4. Verifica que todos los tests pasan

**Checklist**:
- [ ] Script ejecuta sin errores
- [ ] Todos los tests pasan (o se documentan los fallos esperados)
- [ ] No hay errores críticos

### Paso 1.2: Tests Manuales de Triggers

Ejecuta estos tests en Supabase SQL Editor:

```sql
-- Test: update_blogs_updated_at
SELECT updated_at FROM blogs LIMIT 1; -- Anotar timestamp
UPDATE blogs SET title = COALESCE(title, '') || ' (test)' WHERE id = (SELECT id FROM blogs LIMIT 1);
SELECT updated_at FROM blogs LIMIT 1; -- Verificar que cambió

-- Test: update_blog_comments_updated_at
SELECT updated_at FROM blog_comments LIMIT 1; -- Anotar timestamp
UPDATE blog_comments SET content = COALESCE(content, '') || ' (test)' WHERE id = (SELECT id FROM blog_comments LIMIT 1);
SELECT updated_at FROM blog_comments LIMIT 1; -- Verificar que cambió

-- Test: update_feedback_messages_updated_at
SELECT updated_at FROM feedback_messages LIMIT 1; -- Anotar timestamp
UPDATE feedback_messages SET message = COALESCE(message, '') || ' (test)' WHERE id = (SELECT id FROM feedback_messages LIMIT 1);
SELECT updated_at FROM feedback_messages LIMIT 1; -- Verificar que cambió

-- Test: update_resource_needs_updated_at
SELECT updated_at FROM resource_needs LIMIT 1; -- Anotar timestamp
UPDATE resource_needs SET details = COALESCE(details, '') || ' (test)' WHERE id = (SELECT id FROM resource_needs LIMIT 1);
SELECT updated_at FROM resource_needs LIMIT 1; -- Verificar que cambió

-- Test: update_contact_messages_updated_at
SELECT updated_at FROM contact_messages LIMIT 1; -- Anotar timestamp
UPDATE contact_messages SET message = COALESCE(message, '') || ' (test)' WHERE id = (SELECT id FROM contact_messages LIMIT 1);
SELECT updated_at FROM contact_messages LIMIT 1; -- Verificar que cambió

-- Test: update_events_updated_at
SELECT updated_at FROM events LIMIT 1; -- Anotar timestamp
UPDATE events SET title = COALESCE(title, '') || ' (test)' WHERE id = (SELECT id FROM events LIMIT 1);
SELECT updated_at FROM events LIMIT 1; -- Verificar que cambió

-- Test: update_blog_auth_requests_updated_at
SELECT updated_at FROM blog_authorization_requests LIMIT 1; -- Anotar timestamp
UPDATE blog_authorization_requests SET status = 'approved' WHERE id = (SELECT id FROM blog_authorization_requests LIMIT 1);
SELECT updated_at FROM blog_authorization_requests LIMIT 1; -- Verificar que cambió

-- Test: update_updated_at_column (profiles)
SELECT updated_at FROM profiles LIMIT 1; -- Anotar timestamp
UPDATE profiles SET name = COALESCE(name, '') || ' (test)' WHERE id = (SELECT id FROM profiles LIMIT 1);
SELECT updated_at FROM profiles LIMIT 1; -- Verificar que cambió
```

**Checklist**:
- [ ] Todos los triggers actualizan `updated_at` correctamente
- [ ] No hay errores de permisos
- [ ] Los timestamps se actualizan con la zona horaria correcta

### Paso 1.3: Tests de Funciones de Negocio

Ejecuta estos tests para funciones que no están en el script automatizado:

```sql
-- Test: get_resources_with_votes
SELECT * FROM get_resources_with_votes() LIMIT 5;
-- Verificar que retorna recursos con conteo de votos

-- Test: filter_large_base64_images
SELECT filter_large_base64_images('["http://example.com/img.jpg", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]'::jsonb);
-- Verificar que filtra imágenes base64 grandes

-- Test: get_profile_views_stats
SELECT * FROM get_profile_views_stats((SELECT id FROM profiles LIMIT 1), 30);
-- Verificar que retorna estadísticas correctas

-- Test: get_link_clicks_stats
SELECT * FROM get_link_clicks_stats((SELECT id FROM profiles LIMIT 1), 30);
-- Verificar que retorna estadísticas correctas

-- Test: get_link_clicks_by_block
SELECT get_link_clicks_by_block((SELECT id FROM profiles LIMIT 1), 'test-block', 30);
-- Verificar que retorna conteo correcto
```

**Checklist**:
- [ ] Todas las funciones ejecutan sin errores
- [ ] Retornan los tipos de datos esperados
- [ ] No hay errores de permisos
- [ ] Los resultados son correctos

## Fase 2: Testing de Frontend

### 2.1 Página de Proyectos (`/proyectos`)

**Tests a realizar**:

1. **Cargar página**:
   - [ ] Navegar a `/proyectos`
   - [ ] Verificar que la página carga sin errores
   - [ ] Verificar que se muestran proyectos con información de autores
   - [ ] Verificar en consola del navegador que no hay errores

2. **Crear proyecto**:
   - [ ] Click en "Crear Proyecto"
   - [ ] Llenar formulario con datos válidos
   - [ ] Guardar proyecto
   - [ ] Verificar que se crea correctamente
   - [ ] Verificar que aparece en la lista

3. **Editar proyecto**:
   - [ ] Seleccionar un proyecto propio
   - [ ] Editar información
   - [ ] Guardar cambios
   - [ ] Verificar que `updated_at` se actualiza (verificar en BD)

4. **Verificar función**:
   - [ ] Abrir DevTools > Network
   - [ ] Recargar página de proyectos
   - [ ] Buscar llamada a `get_projects_with_authors`
   - [ ] Verificar que retorna datos correctos

**Checklist**:
- [ ] Página carga correctamente
- [ ] `get_projects_with_authors` funciona
- [ ] Creación de proyectos funciona
- [ ] Edición de proyectos funciona
- [ ] Trigger `update_updated_at_column` funciona

### 2.2 Página de Comunidad (`/comunidad`)

**Tests a realizar**:

1. **Cargar página**:
   - [ ] Navegar a `/comunidad`
   - [ ] Verificar que la página carga sin errores
   - [ ] Verificar que se muestran perfiles con estadísticas
   - [ ] Verificar que avatares se muestran correctamente

2. **Verificar funciones**:
   - [ ] Abrir DevTools > Network
   - [ ] Buscar llamada a `get_community_profiles`
   - [ ] Verificar que retorna datos correctos
   - [ ] Verificar que `get_avatar_url` funciona (avatares se muestran)

**Checklist**:
- [ ] Página carga correctamente
- [ ] `get_community_profiles` funciona
- [ ] Avatares se muestran correctamente
- [ ] Estadísticas de vistas se muestran

### 2.3 Ágora (`/agora`)

**Tests a realizar**:

1. **Cargar feed**:
   - [ ] Navegar a `/agora`
   - [ ] Verificar que el feed carga sin errores
   - [ ] Verificar que se muestran posts con información de autores

2. **Crear post**:
   - [ ] Crear nuevo post
   - [ ] Verificar que se publica correctamente
   - [ ] Verificar que aparece en el feed

3. **Comentar**:
   - [ ] Comentar en un post de otro usuario
   - [ ] Verificar que el comentario se crea
   - [ ] Verificar que se crea notificación (usuario debe recibirla)
   - [ ] Verificar trigger `notify_post_comment`

4. **Verificar función**:
   - [ ] Abrir DevTools > Network
   - [ ] Buscar llamada a `get_agora_feed`
   - [ ] Verificar que retorna JSON correcto

**Checklist**:
- [ ] Feed carga correctamente
- [ ] `get_agora_feed` funciona
- [ ] Creación de posts funciona
- [ ] Comentarios funcionan
- [ ] Notificaciones se crean correctamente

### 2.4 Recursos (`/recursos`)

**Tests a realizar**:

1. **Cargar página**:
   - [ ] Navegar a `/recursos`
   - [ ] Verificar que la página carga sin errores
   - [ ] Verificar que se muestran recursos con votos

2. **Descargar recurso**:
   - [ ] Click en descargar un recurso
   - [ ] Verificar que `download_count` incrementa (verificar en BD)
   - [ ] Verificar función `increment_download_count`

3. **Votar recurso**:
   - [ ] Votar un recurso
   - [ ] Verificar que `votes_count` se actualiza
   - [ ] Verificar triggers `sync_resource_votes_count` y `update_resource_votes_count`

4. **Crear necesidad**:
   - [ ] Crear nueva necesidad de recurso con datos válidos
   - [ ] Verificar que se crea correctamente
   - [ ] Intentar crear con datos inválidos (details muy corto, arrays vacíos)
   - [ ] Verificar que se rechaza (política RLS)

5. **Verificar función**:
   - [ ] Abrir DevTools > Network
   - [ ] Buscar llamada a `get_resources_with_votes`
   - [ ] Verificar que retorna datos correctos

**Checklist**:
- [ ] Página carga correctamente
- [ ] `get_resources_with_votes` funciona
- [ ] Descargas funcionan (`increment_download_count`)
- [ ] Votos funcionan (triggers)
- [ ] Creación de necesidades funciona
- [ ] Política RLS rechaza datos inválidos

### 2.5 Eventos (`/eventos`)

**Tests a realizar**:

1. **Cargar página**:
   - [ ] Navegar a `/eventos`
   - [ ] Verificar que la página carga sin errores
   - [ ] Verificar que se muestran eventos con conteo de asistentes

2. **Registrar asistencia**:
   - [ ] Registrar asistencia a un evento
   - [ ] Verificar que se registra correctamente
   - [ ] Verificar que `get_event_attendee_count` se actualiza

3. **Verificar registro**:
   - [ ] Verificar que `is_user_registered` retorna true después de registrar
   - [ ] Cancelar asistencia
   - [ ] Verificar que `is_user_registered` retorna false

4. **Verificar trigger**:
   - [ ] Editar evento
   - [ ] Verificar que `update_events_updated_at` funciona

**Checklist**:
- [ ] Página carga correctamente
- [ ] `get_event_attendee_count` funciona
- [ ] `is_user_registered` funciona
- [ ] Registro de asistencia funciona
- [ ] Trigger `update_events_updated_at` funciona

### 2.6 Blogs (`/blogs`)

**Tests a realizar**:

1. **Cargar página**:
   - [ ] Navegar a `/blogs`
   - [ ] Verificar que la página carga sin errores

2. **Crear blog** (si está autorizado):
   - [ ] Crear nuevo blog
   - [ ] Verificar que se crea correctamente
   - [ ] Verificar trigger `update_blogs_updated_at`

3. **Dar like**:
   - [ ] Dar like a un blog
   - [ ] Verificar que `likes_count` incrementa
   - [ ] Quitar like
   - [ ] Verificar que `likes_count` decrementa
   - [ ] Verificar trigger `update_blog_likes_count`

4. **Comentar**:
   - [ ] Comentar en un blog
   - [ ] Verificar que se crea comentario
   - [ ] Verificar trigger `update_blog_comments_updated_at`

5. **Autorización** (como admin):
   - [ ] Aprobar autorización de blog
   - [ ] Verificar que `approve_blog_authorization` funciona
   - [ ] Verificar que `blog_authorized` se actualiza en profiles

**Checklist**:
- [ ] Página carga correctamente
- [ ] Creación de blogs funciona
- [ ] Likes funcionan (trigger)
- [ ] Comentarios funcionan (trigger)
- [ ] Autorización funciona

### 2.7 Perfil (`/perfil`)

**Tests a realizar**:

1. **Cargar editor**:
   - [ ] Navegar a `/perfil`
   - [ ] Verificar que el editor carga sin errores

2. **Editar perfil**:
   - [ ] Editar información del perfil
   - [ ] Guardar cambios
   - [ ] Verificar que `updated_at` se actualiza (trigger `update_updated_at_column`)

3. **Verificar funciones**:
   - [ ] Verificar que `get_profiles_batch` se usa correctamente
   - [ ] Verificar que `get_profiles_batch_rpc` se usa correctamente
   - [ ] Verificar que avatares se muestran correctamente

**Checklist**:
- [ ] Editor carga correctamente
- [ ] Edición funciona
- [ ] Trigger funciona
- [ ] Funciones de perfiles funcionan

### 2.8 Analytics (Profile Views y Link Clicks)

**Tests a realizar**:

1. **Visitar perfil público**:
   - [ ] Visitar un perfil público (`/p/:username`)
   - [ ] Verificar que se inserta `profile_views` (política RLS)
   - [ ] Verificar en BD que se creó el registro

2. **Hacer click en enlace**:
   - [ ] Hacer click en un enlace del perfil
   - [ ] Verificar que se inserta `link_clicks` (política RLS)
   - [ ] Verificar en BD que se creó el registro

3. **Verificar estadísticas**:
   - [ ] Verificar que `get_profile_views_stats` funciona
   - [ ] Verificar que `get_link_clicks_stats` funciona
   - [ ] Verificar que `get_link_clicks_by_block` funciona

**Checklist**:
- [ ] Profile views se registran (política RLS)
- [ ] Link clicks se registran (política RLS)
- [ ] Funciones de estadísticas funcionan

### 2.9 Modales de Contacto y Feedback

**Tests a realizar**:

1. **Modal de contacto**:
   - [ ] Abrir modal de contacto
   - [ ] Enviar mensaje válido (nombre 2+ chars, email válido, mensaje 10+ chars)
   - [ ] Verificar que se envía correctamente (política RLS)
   - [ ] Intentar enviar mensaje inválido (nombre muy corto, email inválido, mensaje muy corto)
   - [ ] Verificar que se rechaza (política RLS)

2. **Modal de feedback**:
   - [ ] Abrir modal de feedback
   - [ ] Enviar feedback válido (mensaje 5+ chars)
   - [ ] Verificar que se envía correctamente (política RLS)
   - [ ] Intentar enviar feedback inválido (mensaje muy corto)
   - [ ] Verificar que se rechaza (política RLS)

**Checklist**:
- [ ] Contacto funciona con datos válidos
- [ ] Contacto rechaza datos inválidos
- [ ] Feedback funciona con datos válidos
- [ ] Feedback rechaza datos inválidos

### 2.10 Panel de Administración (`/admin`)

**Tests a realizar**:

1. **Acceso como admin**:
   - [ ] Login como usuario admin
   - [ ] Navegar a `/admin`
   - [ ] Verificar que se puede acceder
   - [ ] Verificar que `is_admin` funciona correctamente

2. **Aprobar/rechazar proyectos**:
   - [ ] Aprobar un proyecto
   - [ ] Verificar que se crea notificación (trigger `notify_project_status_change`)
   - [ ] Rechazar un proyecto
   - [ ] Verificar que se crea notificación

3. **Ver mensajes**:
   - [ ] Ver mensajes de contacto
   - [ ] Ver feedback messages
   - [ ] Verificar que políticas RLS de admin funcionan

**Checklist**:
- [ ] Acceso admin funciona
- [ ] `is_admin` funciona
- [ ] Aprobaciones funcionan
- [ ] Notificaciones se crean
- [ ] Políticas RLS de admin funcionan

## Fase 3: Testing de Regresión

### 3.1 Flujos Críticos

**Flujo 1: Registro y Onboarding**
- [ ] Registrar nuevo usuario
- [ ] Verificar que `handle_new_user` crea perfil
- [ ] Verificar que usuario puede hacer login
- [ ] Verificar que usuario tiene rol 'normal'

**Flujo 2: Creación de Contenido**
- [ ] Crear proyecto
- [ ] Crear post en Ágora
- [ ] Crear blog (si autorizado)
- [ ] Verificar que todos los triggers funcionan

**Flujo 3: Interacciones**
- [ ] Comentar en post
- [ ] Dar like a blog
- [ ] Votar recurso
- [ ] Registrar asistencia a evento
- [ ] Verificar que todas las funciones funcionan

**Flujo 4: Administración**
- [ ] Login como admin
- [ ] Aprobar proyecto
- [ ] Aprobar autorización de blog
- [ ] Ver mensajes de contacto
- [ ] Ver feedback messages

### 3.2 Verificación de Performance

- [ ] Cargar página de proyectos (medir tiempo)
- [ ] Cargar página de comunidad (medir tiempo)
- [ ] Cargar feed de Ágora (medir tiempo)
- [ ] Verificar que no hay degradación significativa

### 3.3 Verificación de Seguridad

- [ ] Verificar que `SET search_path = ''` está activo en todas las funciones
- [ ] Verificar que políticas RLS rechazan datos inválidos
- [ ] Verificar que usuarios no pueden acceder a datos de otros

## Fase 4: Verificación Final

### Checklist Final

- [ ] Login/Registro funciona
- [ ] Creación de proyectos funciona
- [ ] Creación de posts funciona
- [ ] Sistema de notificaciones funciona
- [ ] Sistema de votos funciona
- [ ] Sistema de analytics funciona
- [ ] Panel de administración funciona
- [ ] Perfiles públicos funcionan
- [ ] Modales de contacto/feedback funcionan
- [ ] No hay errores en logs de Supabase
- [ ] No hay warnings de seguridad en Supabase

## Notas

- Ejecutar tests en ambiente de desarrollo/staging primero
- Documentar cualquier error encontrado
- Si algún test falla, investigar antes de continuar
- Verificar que no hay datos de prueba en producción
