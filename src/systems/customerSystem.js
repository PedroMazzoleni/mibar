import { gridToScreen } from '../logic/iso.js';
import { readFurniture, readZones } from '../logic/tiledMap.js';
import {
  createCustomer,
  assignSeat,
  advance,
  tick,
  pickSeat,
  spawnTile,
  canEnter,
} from '../logic/customerFsm.js';
import { findPath } from '../logic/pathfinding.js';
import { createSpawner, advanceSpawner } from '../logic/spawner.js';
import {
  validateCustomerTypes,
  nextCustomerType,
  getCustomerType,
} from '../logic/customerTypes.js';
import { pickOrder, describeCustomer, createTicket, seatLabel } from '../logic/orders.js';
import { createQueue, addTicket, removeByCustomer } from '../logic/orderQueue.js';
import CustomerSprite from '../objects/CustomerSprite.js';
import OrderBubble from '../ui/OrderBubble.js';

// Velocidad de paseo en píxeles por segundo
const SPEED = 20;
// Los bocadillos van por encima de muebles y paredes (y por debajo del overlay de F4, 900)
const BUBBLE_DEPTH = 800;

// Une la FSM del cliente con el pathfinding y la escena. La profundidad la recalcula
// la escena en cada frame para todo lo que está en scene.movers (como en 2.6).
export default class CustomerSystem {
  constructor(scene, mapData) {
    this.scene = scene;
    this.nav = scene.nav;
    this.furniture = readFurniture(mapData);
    this.seats = this.furniture.filter((f) => f.type === 'silla' || f.type === 'taburete');
    this.entrance = spawnTile(this.nav, readZones(mapData).points.entrada ?? { gc: 0, gr: 0 });
    this.customers = [];
    this.nextId = 1;
    this.types = validateCustomerTypes(scene.cache.json.get('customers'));
    this.typeIndex = 0;
    this.orderIndex = 0;
    // Cola de comandas pendientes (lógica pura); el HudScene la dibuja
    this.queue = createQueue();
    this.spawner = createSpawner(Math.random);
  }

  center(cell) {
    return gridToScreen(cell.col + 0.5, cell.row + 0.5, this.scene.origin);
  }

  // Crea un cliente en la entrada; no hace nada si el bar está cerrado
  spawnCustomer(barStatus) {
    if (!canEnter(barStatus) || !this.entrance) return null;
    const taken = this.customers.filter((c) => c.data.seat).map((c) => c.data.seat);
    const seat = pickSeat(this.nav, this.seats, taken, this.entrance);
    // Tipo por turno rotatorio; sin datos cargados, usa los tiempos por defecto
    const type = this.types.length ? nextCustomerType(this.types, this.typeIndex++) : undefined;
    const order = type ? pickOrder(type.orders, this.orderIndex++) : null;
    const c = {
      data: assignSeat(createCustomer(this.nextId++, this.entrance, type, order), seat),
      sprite: null,
      bubble: null,
    };
    console.debug('cliente', c.data.id, 'tipo', type?.id ?? 'ninguno');
    if (seat) {
      const path = findPath(this.nav, this.entrance, seat.stand);
      c.data = { ...c.data, route: [...path.slice(1), { col: seat.col, row: seat.row }] };
    } else {
      this.startLeaving(c);
    }
    const p = this.center(this.entrance);
    c.sprite = new CustomerSprite(this.scene, p.x, p.y, c.data.id);
    c.sprite.showState(c.data.state);
    this.scene.movers.push(c.sprite);
    this.customers.push(c);
    return c.data;
  }

  // El clic en un cliente solo avisa al Hud para que abra su panel; no cambia el estado
  onCustomerClick(sprite) {
    const c = this.customers.find((x) => x.sprite === sprite);
    if (c) this.scene.events.emit('customer-click', { id: c.data.id });
  }

  // Textos del panel de un cliente, o null si ya no existe
  describe(id) {
    const c = this.customers.find((x) => x.data.id === id);
    if (!c) return null;
    return describeCustomer(c.data, getCustomerType(this.types, c.data.typeId));
  }

  // Acción provisional (sin camarero): pedir, servir y cobrar
  advanceCustomer(id) {
    const c = this.customers.find((x) => x.data.id === id);
    if (!c) return;
    if (c.data.state === 'ordering') {
      c.data = advance(c.data, 'orderTaken');
      this.addOrderTicket(c);
    } else if (c.data.state === 'waiting') {
      c.data = advance(c.data, 'served');
      this.removeTicket(id);
    } else if (c.data.state === 'paying') {
      c.data = advance(c.data, 'paid');
      this.startLeaving(c);
    }
    c.sprite.showState(c.data.state);
  }

  // Al tomar nota: la comanda entra en la cola y el bocadillo vuela hacia ella
  addOrderTicket(c) {
    const ticket = createTicket(c.data, seatLabel(c.data.seat, this.furniture));
    this.queue = addTicket(this.queue, ticket);
    const cam = this.scene.cameras.main;
    const from = c.bubble ?? c.sprite;
    this.scene.events.emit('ticket-added', {
      ticket,
      queue: this.queue,
      from: {
        x: (from.x - cam.scrollX) * cam.zoom,
        y: (from.y - cam.scrollY) * cam.zoom,
      },
    });
    this.destroyBubble(c);
  }

  // Retira la comanda de un cliente (servida o cliente que se va); no hace nada si no está
  removeTicket(customerId) {
    const next = removeByCustomer(this.queue, customerId);
    if (next.tickets.length === this.queue.tickets.length) return;
    this.queue = next;
    this.scene.events.emit('queue-changed', { queue: this.queue });
  }

  destroyBubble(c) {
    if (!c.bubble) return;
    c.bubble.destroy();
    c.bubble = null;
  }

  // Bocadillo sobre el cliente que espera para pedir; sigue su posición y se ve por encima de todo
  syncBubble(c) {
    const ordering = c.data.state === 'ordering' && c.data.order;
    if (!ordering) {
      this.destroyBubble(c);
      return;
    }
    if (!c.bubble) {
      c.bubble = new OrderBubble(
        this.scene,
        c.sprite.x,
        c.sprite.y - 10,
        `x1 ${c.data.order.name}`,
      ).setDepth(BUBBLE_DEPTH);
    }
    c.bubble.setPosition(c.sprite.x, c.sprite.y - 10);
  }

  // Ruta de salida: de la silla a su casilla de acceso y de ahí a la entrada
  startLeaving(c) {
    const { seat } = c.data;
    const from = seat ? seat.stand : this.entrance;
    const path = findPath(this.nav, from, this.entrance) ?? [];
    c.data = { ...c.data, route: seat ? [seat.stand, ...path.slice(1)] : path.slice(1) };
  }

  // Asientos sin cliente asignado (también cuenta a los que van de camino)
  freeSeats() {
    return this.seats.length - this.customers.filter((c) => c.data.seat).length;
  }

  update(dtMs, barStatus, hour) {
    if (this.entrance) {
      const r = advanceSpawner(
        this.spawner,
        dtMs,
        { barStatus, hour, customerCount: this.customers.length, freeSeats: this.freeSeats() },
        Math.random,
      );
      this.spawner = r.state;
      if (r.spawn) this.spawnCustomer(barStatus);
    }
    for (const c of this.customers) {
      c.data = tick(c.data, dtMs);
      this.walk(c, dtMs);
      c.sprite.showState(c.data.state);
      // Un cliente que se marcha sin que le sirvan no deja su comanda en la cola
      if (c.data.state === 'leaving' || c.data.state === 'gone') this.removeTicket(c.data.id);
      this.syncBubble(c);
    }
    // Los que se han ido desaparecen
    this.customers = this.customers.filter((c) => {
      if (c.data.state !== 'gone') return true;
      this.removeTicket(c.data.id);
      this.destroyBubble(c);
      this.scene.movers.splice(this.scene.movers.indexOf(c.sprite), 1);
      c.sprite.destroy();
      return false;
    });
  }

  // Avanza el sprite hacia la siguiente casilla de su ruta
  walk(c, dtMs) {
    const { state } = c.data;
    if (state !== 'walkingToSeat' && state !== 'leaving') return;
    let step = (SPEED * dtMs) / 1000;
    let rest = c.data.route;
    while (rest.length && step > 0) {
      const t = this.center(rest[0]);
      const dx = t.x - c.sprite.x;
      const dy = t.y - c.sprite.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= step) {
        c.sprite.setPosition(t.x, t.y);
        step -= dist;
        rest = rest.slice(1);
      } else {
        c.sprite.setPosition(c.sprite.x + (dx / dist) * step, c.sprite.y + (dy / dist) * step);
        step = 0;
      }
    }
    c.data = { ...c.data, route: rest };
    if (rest.length === 0) {
      c.data = advance(c.data, state === 'leaving' ? 'leftBar' : 'arrived');
    }
  }

  // Estados para el panel de depuración
  debugText() {
    return this.customers.map((c) => `#${c.data.id} ${c.data.state}`).join(', ') || '-';
  }
}
