// Pedidos y comandas. Lógica pura, sin Phaser.

const STATE_LABELS = {
  entering: 'Entrando',
  walkingToSeat: 'Yendo a sentarse',
  ordering: 'Quiere pedir',
  waiting: 'Esperando su pedido',
  consuming: 'Consumiendo',
  paying: 'Quiere pagar',
  leaving: 'Marchándose',
  gone: 'Se ha ido',
};

// Pedido por turno rotatorio (sin azar); null si no hay pedidos
export function pickOrder(orders, index) {
  if (!Array.isArray(orders) || orders.length === 0) return null;
  return orders[index % orders.length];
}

// Textos del panel del cliente
export function describeCustomer(customer, type) {
  return {
    title: type?.name ?? 'Cliente',
    stateLabel: STATE_LABELS[customer.state] ?? customer.state,
    orderLabel: customer.order ? `x1 ${customer.order.name}` : 'Aún no ha pedido',
  };
}

// Comanda de un cliente; seatLabel es el texto de "seatLabel(...)"
export function createTicket(customer, seatLabelText) {
  return {
    customerId: customer.id,
    text: `x1 ${customer.order?.name ?? ''}`.trimEnd(),
    seatLabel: seatLabelText,
  };
}

// Orden fila-columna
const byRowCol = (a, b) => a.row - b.row || a.col - b.col;

// "Taburete N" (orden fila-columna entre taburetes) o "Mesa N" (mesa más cercana, Manhattan,
// numeradas con el mismo orden; empates por fila y columna). Sin mesas, "Silla N".
export function seatLabel(seat, furniture) {
  if (!seat) return '';
  const ofType = (type) => furniture.filter((f) => f.type === type).sort(byRowCol);
  const indexIn = (list, item) => list.findIndex((f) => f.col === item.col && f.row === item.row);
  if (seat.type === 'taburete') {
    const i = indexIn(ofType('taburete'), seat);
    return `Taburete ${i + 1}`;
  }
  const tables = ofType('mesa');
  if (tables.length === 0) return `Silla ${indexIn(ofType('silla'), seat) + 1}`;
  const dist = (t) => Math.abs(t.col - seat.col) + Math.abs(t.row - seat.row);
  // tables ya está ordenada por fila-columna: el primero con menor distancia gana el empate
  let best = 0;
  tables.forEach((t, i) => {
    if (dist(t) < dist(tables[best])) best = i;
  });
  return `Mesa ${best + 1}`;
}
