// Tipos de cliente (datos de customers.json). Lógica pura, sin Phaser.

const MS_FIELDS = ['consumeMs', 'payMs', 'patienceMs'];

// Valida los datos y devuelve la lista de tipos; lanza error si algo no cuadra
export function validateCustomerTypes(data) {
  const types = data?.types;
  if (!Array.isArray(types) || types.length === 0) {
    throw new Error('customers: falta la lista "types"');
  }
  const seen = new Set();
  for (const t of types) {
    if (typeof t?.id !== 'string' || t.id === '') throw new Error('customers: tipo sin "id"');
    if (seen.has(t.id)) throw new Error(`customers: id repetido "${t.id}"`);
    seen.add(t.id);
    if (typeof t.name !== 'string' || t.name === '') {
      throw new Error(`customers: "${t.id}" sin "name"`);
    }
    for (const f of MS_FIELDS) {
      if (!Number.isInteger(t[f]) || t[f] <= 0) {
        throw new Error(`customers: "${t.id}".${f} debe ser un entero positivo`);
      }
    }
    if (typeof t.tipChance !== 'number' || !(t.tipChance >= 0 && t.tipChance <= 1)) {
      throw new Error(`customers: "${t.id}".tipChance debe estar entre 0 y 1`);
    }
  }
  return types;
}

export function getCustomerType(types, id) {
  return types.find((t) => t.id === id);
}

// Selección provisional por turno rotatorio (el azar se decidirá más adelante)
export function nextCustomerType(types, index) {
  return types[index % types.length];
}
