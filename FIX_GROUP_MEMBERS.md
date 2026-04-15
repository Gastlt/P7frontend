# Fix: Mapeo correcto de GroupMembers del Backend

## Problema encontrado
El endpoint `/api/group-members` retorna objetos con estructura anidada:
```json
{
  "id": 6,
  "group": { "id": 1, "name": "DevOps Team", ... },
  "user": { "id": 2, "name": "Miguel Torres", ... },
  "role": { "id": 2, "name": "admin", ... },
  "roleName": null,
  "joinedAt": "2026-04-13T04:01:33.263078"
}
```

Pero el código esperaba campos directos como `groupId` y `userId`.

## Solución implementada

### 1. Actualización de tipo `GroupMember`
Ahora incluye el campo `role` con estructura completa:
```typescript
export type GroupMember = {
  id: number;
  group?: TaskGroup;      // Objeto anidado del grupo
  user?: User;            // Objeto anidado del usuario
  role?: {                // Objeto anidado del rol
    id: number;
    name: string;
    description?: string;
  };
  groupId?: number;       // Campo directo (fallback)
  userId?: number;        // Campo directo (fallback)
  roleId?: number | null;
  roleName?: string | null;
  joinedAt?: string | null;
};
```

### 2. Actualización de `fetchAllGroupsData()`
La función ahora maneja ambos formatos:

```typescript
// Comparar con groupId directo O con objeto group anidado
const memberGroupId = m.groupId ?? m.group?.id;
return memberGroupId === g.id;

// Extraer usuario de userId directo O de objeto user anidado
const userId = m.userId ?? m.user?.id;
const user = m.user || users.find((x) => x.id === userId);
return user ? user.name : `user-${userId}`;
```

## Resultado
✅ Ahora los miembros del grupo aparecerán correctamente en el dropdown.

## Prueba
1. Abre la consola (F12)
2. Busca el log: `Group 1 (DevOps Team): 1 members - ["Miguel Torres"]`
3. Navega a un grupo
4. Haz clic en "+ Nueva Tarea"
5. El dropdown "Asignar a" debe mostrar los miembros

## Estructura de datos que ahora soportamos

### Formato 1: Anidado (actual del backend)
```json
{
  "id": 6,
  "group": { "id": 1, ... },
  "user": { "id": 2, "name": "Miguel Torres", ... },
  "role": { "id": 2, "name": "admin", ... }
}
```

### Formato 2: Directos (fallback)
```json
{
  "id": 6,
  "groupId": 1,
  "userId": 2,
  "roleId": 2,
  "roleName": "admin"
}
```

Ambos formatos funcionarán correctamente.
