// Cola de comandas pendientes. Lógica pura, sin Phaser; no muta, devuelve copias.

export function createQueue() {
  return { tickets: [], nextSeq: 1 };
}

// Añade la comanda al final con un seq creciente (orden de llegada)
export function addTicket(queue, ticket) {
  return {
    tickets: [...queue.tickets, { ...ticket, seq: queue.nextSeq }],
    nextSeq: queue.nextSeq + 1,
  };
}

// Retira la comanda de un cliente (servida o cliente que se va); id inexistente: cola igual
export function removeByCustomer(queue, customerId) {
  return { ...queue, tickets: queue.tickets.filter((t) => t.customerId !== customerId) };
}

// Las `max` primeras y cuántas no caben
export function visibleTickets(queue, max) {
  return {
    shown: queue.tickets.slice(0, max),
    hidden: Math.max(0, queue.tickets.length - max),
  };
}

// Posición en la cola, o -1
export function slotIndex(queue, customerId) {
  return queue.tickets.findIndex((t) => t.customerId === customerId);
}
