# Debugging: Por qué no salen miembros en el dropdown

## Problema
El dropdown de "Asignar a" en el modal de crear tareas no muestra ningún miembro disponible.

## Causa probable
Los datos de `group_members` en la BD están vacíos o el endpoint `/api/group-members` no está retornando datos correctamente.

## Cómo debuggear

### 1. Abre la consola del navegador (F12)
Verás logs como:
```
Fetched data: { 
  taskGroupsCount: X,
  usersCount: X,
  groupMembersCount: 0,  ← Si esto es 0, no hay miembros en BD
  todoListsCount: X,
  tasksCount: X,
  taskAssignmentsCount: X
}
```

### 2. Verifica en la BD (Sí, es de la DB)
Ejecuta esta query en tu DB:
```sql
-- Verificar si hay miembros en los grupos
SELECT gm.id, gm.group_id, gm.user_id, gm.role_id, u.name, tg.name as group_name
FROM group_members gm
LEFT JOIN users u ON gm.user_id = u.id
LEFT JOIN taskgroups tg ON gm.group_id = tg.id
ORDER BY gm.group_id;
```

### 3. Solución - Insertar miembros en la BD

**Primero verifica qué usuarios y grupos tienes:**
```sql
SELECT * FROM users;
SELECT * FROM taskgroups;
```

**Luego inserta miembros:**
```sql
-- Para Oracle SQL (si usas Oracle como en el backend)
INSERT INTO group_members (group_id, user_id, role_id, role) VALUES
(1, 1, 1, 'owner');

INSERT INTO group_members (group_id, user_id, role_id, role) VALUES
(1, 2, 2, 'member');

INSERT INTO group_members (group_id, user_id, role_id, role) VALUES
(1, 3, 2, 'member');

COMMIT;
```

### 4. Verificar el endpoint
Abre Postman/Insomnia y prueba:
```
GET http://localhost:8080/api/group-members
```

Debería retornar un array con objetos:
```json
[
  {
    "id": 1,
    "groupId": 1,
    "userId": 1,
    "roleId": 1,
    "roleName": "owner",
    "joinedAt": "2026-04-14T..."
  }
]
```

### 5. Fallback automático
Si no hay miembros en BD, el sistema ahora usa **todos los usuarios** como fallback.

## Verificación final
1. Abre la consola (F12) del navegador
2. Navega a un grupo
3. Busca los logs que dicen: `Group X (nombre): N members -`
4. Si ves miembros listados, ¡está funcionando!
5. Si ves `Group X: X members - []`, verifica la BD

## Resumen: SÍ, es de la DB
- Los miembros vienen del endpoint `/api/group-members`
- Si está vacío, tienes que alimentar la tabla `group_members` en tu base de datos
