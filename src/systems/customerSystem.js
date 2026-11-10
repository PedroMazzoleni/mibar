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
import { validateCustomerTypes, nextCustomerType } from '../logic/customerTypes.js';
import CustomerSprite from '../objects/CustomerSprite.js';

// Velocidad de paseo en píxeles por segundo
const SPEED = 40;

// Une la FSM del cliente con el pathfinding y la escena. La profundidad la recalcula
// la escena en cada frame para todo lo que está en scene.movers (como en 2.6).
export default class CustomerSystem {
  constructor(scene, mapData) {
    this.scene = scene;
    this.nav = scene.nav;
    this.seats = readFurniture(mapData).filter((f) => f.type === 'silla' || f.type === 'taburete');
    this.entrance = spawnTile(this.nav, readZones(mapData).points.entrada ?? { gc: 0, gr: 0 });
    this.customers = [];
    this.nextId = 1;
    this.types = validateCustomerTypes(scene.cache.json.get('customers'));
    this.typeIndex = 0;
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
    const c = {
      data: assignSeat(createCustomer(this.nextId++, this.entrance, type), seat),
      sprite: null,
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

  // Clic provisional (sin camarero): pedir y servir
  onCustomerClick(sprite) {
    const c = this.customers.find((x) => x.sprite === sprite);
    if (!c) return;
    if (c.data.state === 'ordering') c.data = advance(c.data, 'orderTaken');
    else if (c.data.state === 'waiting') c.data = advance(c.data, 'served');
    c.sprite.showState(c.data.state);
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
      const before = c.data.state;
      c.data = tick(c.data, dtMs);
      if (before === 'paying' && c.data.state === 'leaving') this.startLeaving(c);
      this.walk(c, dtMs);
      c.sprite.showState(c.data.state);
    }
    // Los que se han ido desaparecen
    this.customers = this.customers.filter((c) => {
      if (c.data.state !== 'gone') return true;
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
