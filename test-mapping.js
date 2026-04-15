// Test para verificar que el mapeo de GroupMembers funciona correctamente

// Datos de ejemplo del backend
const mockGroupMembersResponse = [
  {
    id: 6,
    group: { id: 1, name: "DevOps Team", createdBy: { id: 1, name: "Diego Maciel" } },
    user: { id: 2, name: "Miguel Torres", email: "miguel@example.com" },
    role: { id: 2, name: "admin", description: "Can manage task groups" },
    roleName: null,
    joinedAt: "2026-04-13T04:01:33.263078"
  },
  {
    id: 7,
    group: { id: 1, name: "DevOps Team" },
    user: { id: 3, name: "Ana García", email: "ana@example.com" },
    role: { id: 2, name: "member" },
    roleName: null,
    joinedAt: "2026-04-13T04:01:33.263078"
  }
];

const mockTaskGroups = [
  { id: 1, name: "DevOps Team" }
];

const mockUsers = [
  { id: 1, name: "Diego Maciel", email: "diego@example.com" },
  { id: 2, name: "Miguel Torres", email: "miguel@example.com" },
  { id: 3, name: "Ana García", email: "ana@example.com" }
];

// Simular la lógica de mapeo
function testGroupMembersMapping() {
  console.log("=== TEST: Mapeo de GroupMembers ===\n");

  mockTaskGroups.forEach((g) => {
    console.log(`Procesando grupo: ${g.id} (${g.name})`);

    // Obtener miembros del grupo
    const dbMembers = mockGroupMembersResponse
      .filter((m) => {
        // Comparar con groupId directo o con objeto group anidado
        const memberGroupId = m.groupId ?? m.group?.id;
        console.log(`  - Miembro ID ${m.id}: groupId=${memberGroupId}, esperado=${g.id}`);
        return memberGroupId === g.id;
      })
      .map((m) => {
        // Extraer usuario de userid directo o de objeto user anidado
        const userId = m.userId ?? m.user?.id;
        const user = m.user || mockUsers.find((x) => x.id === userId);
        const name = user ? user.name : `user-${userId}`;
        console.log(`    ✓ Miembro encontrado: ${name}`);
        return name;
      });

    const members = dbMembers.length > 0 ? dbMembers : mockUsers.map(u => u.name);
    console.log(`\n✓ Resultado para grupo ${g.id}: ${members.length} miembros`);
    console.log(`  Miembros: [${members.join(", ")}]\n`);
  });

  console.log("=== FIN DEL TEST ===");
}

// Ejecutar test si está en Node.js
if (typeof module !== 'undefined' && module.exports) {
  testGroupMembersMapping();
}
