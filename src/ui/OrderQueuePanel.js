import OrderBubble from './OrderBubble.js';
import { visibleTickets, slotIndex } from '../logic/orderQueue.js';

// Colores de arte/paleta.json
const INK = 0x1e1a1d;
const CREAM = 0xf4ead2;
const OCHRE = 0xdcae6a;

const TICKET_W = 76;
const TICKET_H = 22;
const GAP = 2;
const TITLE_H = 12;
const MARGIN = 4;
const MAX_VISIBLE = 6;
const SLIDE_MS = 150;
const FLY_MS = 400;
const DEPTH = 2050;
const TEXT = { fontFamily: 'monospace', fontSize: '8px', color: '#1e1a1d' };

// Recorta el texto con "…" hasta que quepa en maxW
function fit(textObj, str, maxW) {
  textObj.setText(str);
  let s = str;
  while (textObj.width > maxW && s.length > 1) {
    s = s.slice(0, -1);
    textObj.setText(`${s}…`);
  }
}

// Cola de comandas a la derecha del HudScene. Sin objetos interactivos (hit() a mano).
export default class OrderQueuePanel {
  constructor(scene, width, top) {
    this.scene = scene;
    this.top = top;
    this.queue = { tickets: [], nextSeq: 1 };
    this.tickets = new Map(); // customerId -> contenedor de la ficha
    this.flights = new Map(); // customerId -> { bubble, tween }
    this.title = scene.add
      .text(0, 0, 'Comandas', { ...TEXT, color: '#dcae6a' })
      .setScrollFactor(0)
      .setDepth(DEPTH);
    this.more = scene.add
      .text(0, 0, '', { ...TEXT, color: '#f4ead2' })
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setVisible(false);
    this.resize(width);
  }

  slotY(i) {
    return this.top + MARGIN + TITLE_H + i * (TICKET_H + GAP);
  }

  // Centro de la ficha del hueco i (la línea "+N" es el hueco MAX_VISIBLE)
  slotCenter(i) {
    return { x: this.x + TICKET_W / 2, y: this.slotY(i) + TICKET_H / 2 };
  }

  resize(width) {
    this.x = width - TICKET_W - MARGIN;
    this.title.setPosition(this.x, this.top + MARGIN);
    this.more.setPosition(this.x, this.slotY(MAX_VISIBLE));
    for (const [id, t] of this.tickets) {
      t.x = this.x;
      t.y = this.slotY(Math.max(0, slotIndex(this.queue, id)));
    }
  }

  // El punto cae sobre el título, las fichas o la línea "+N"
  hit(px, py) {
    const { shown, hidden } = visibleTickets(this.queue, MAX_VISIBLE);
    const rows = shown.length + (hidden > 0 ? 1 : 0);
    const bottom = rows ? this.slotY(rows) : this.top + MARGIN + TITLE_H;
    return px >= this.x && px <= this.x + TICKET_W && py >= this.top && py <= bottom;
  }

  makeTicket(ticket, y) {
    const scene = this.scene;
    const g = scene.add.graphics();
    g.fillStyle(INK, 1).fillRect(0, 0, TICKET_W, TICKET_H);
    g.fillStyle(CREAM, 1).fillRect(1, 1, TICKET_W - 2, TICKET_H - 2);
    g.fillStyle(OCHRE, 1).fillRect(1, 1, 2, TICKET_H - 2);
    const top = scene.add.text(6, 2, '', TEXT);
    const bottom = scene.add.text(6, 12, '', { ...TEXT, color: '#5a4032' });
    fit(top, ticket.text, TICKET_W - 10);
    fit(bottom, ticket.seatLabel, TICKET_W - 10);
    const c = scene.add.container(this.x, y, [g, top, bottom]).setScrollFactor(0).setDepth(DEPTH);
    [g, top, bottom].forEach((o) => o.setScrollFactor(0));
    return c;
  }

  // Ajusta fichas, desplazamientos y "+N" a la cola recibida
  setQueue(queue) {
    this.queue = queue;
    const { shown, hidden } = visibleTickets(queue, MAX_VISIBLE);
    const inQueue = new Set(queue.tickets.map((t) => t.customerId));
    const inShown = new Set(shown.map((t) => t.customerId));
    // Fichas que ya no están (servidas, cliente ido o desplazadas al "+N")
    for (const [id, t] of this.tickets) {
      if (inShown.has(id)) continue;
      this.scene.tweens.killTweensOf(t);
      t.destroy();
      this.tickets.delete(id);
    }
    // Vuelos de comandas que ya no existen
    for (const id of [...this.flights.keys()]) {
      if (!inQueue.has(id)) this.cancelFlight(id);
    }
    shown.forEach((ticket, i) => {
      const id = ticket.customerId;
      const y = this.slotY(i);
      const existing = this.tickets.get(id);
      if (existing) {
        if (existing.y !== y) {
          this.scene.tweens.killTweensOf(existing);
          this.scene.tweens.add({ targets: existing, y, duration: SLIDE_MS });
        }
      } else if (!this.flights.has(id)) {
        this.tickets.set(id, this.makeTicket(ticket, y));
      }
    });
    this.more.setText(`+${hidden}`).setVisible(hidden > 0);
  }

  // El bocadillo vuela desde (fromX, fromY) en pantalla hasta su hueco y allí se vuelve ficha
  addArrival(ticket, queue, fromX, fromY) {
    this.queue = queue;
    const id = ticket.customerId;
    const slot = Math.min(slotIndex(queue, id), MAX_VISIBLE);
    const target = this.slotCenter(slot);
    const bubble = new OrderBubble(this.scene, fromX, fromY, ticket.text)
      .setFixed()
      .setDepth(DEPTH + 1);
    const tween = this.scene.tweens.add({
      targets: bubble,
      x: target.x,
      y: target.y + TICKET_H / 2,
      duration: FLY_MS,
      onComplete: () => {
        this.flights.delete(id);
        bubble.destroy();
        this.setQueue(this.queue);
      },
    });
    this.flights.set(id, { bubble, tween });
    this.setQueue(queue);
  }

  cancelFlight(id) {
    const f = this.flights.get(id);
    if (!f) return;
    f.tween.remove();
    f.bubble.destroy();
    this.flights.delete(id);
  }
}
