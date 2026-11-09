import { describe, it, expect } from 'vitest';
import { Buffer } from 'node:buffer';
import { deflateSync } from 'node:zlib';
import {
  hexARgb,
  rgbAHex,
  colorMasCercano,
  ajustarPixeles,
  leerPng,
  escribirPng,
  leerPaleta,
} from '../tools/ajustar-paleta.js';

const paleta = [
  { char: '0', hex: '#000000', rgb: [0, 0, 0] },
  { char: '9', hex: '#ffffff', rgb: [255, 255, 255] },
  { char: 'r', hex: '#c8553d', rgb: [200, 85, 61] },
];

describe('hex y rgb', () => {
  it('ida y vuelta', () => {
    expect(hexARgb('#c8553d')).toEqual([200, 85, 61]);
    expect(rgbAHex([200, 85, 61])).toBe('#c8553d');
  });
});

describe('colorMasCercano', () => {
  it('elige el más cercano', () => {
    expect(colorMasCercano([10, 5, 0], paleta).char).toBe('0');
    expect(colorMasCercano([240, 250, 245], paleta).char).toBe('9');
    expect(colorMasCercano([190, 90, 70], paleta).char).toBe('r');
  });
});

describe('ajustarPixeles', () => {
  it('cambia lo de fuera, respeta la transparencia y lista los cambios', () => {
    // cuatro píxeles: casi blanco, rojo exacto, transparente con color raro, casi negro semitransparente
    const rgba = new Uint8Array([
      250, 250, 250, 255, 200, 85, 61, 255, 12, 200, 30, 0, 8, 8, 8, 128,
    ]);
    const cambios = ajustarPixeles(rgba, paleta);
    expect([...rgba]).toEqual([255, 255, 255, 255, 200, 85, 61, 255, 12, 200, 30, 0, 0, 0, 0, 128]);
    expect(cambios).toEqual([
      { de: '#fafafa', a: '#ffffff', char: '9', pixeles: 1 },
      { de: '#080808', a: '#000000', char: '0', pixeles: 1 },
    ]);
  });
  it('sin cambios si ya está en paleta', () =>
    expect(ajustarPixeles(new Uint8Array([0, 0, 0, 255]), paleta)).toEqual([]));
});

describe('PNG', () => {
  it('escribir y leer devuelve los mismos píxeles', () => {
    const img = {
      ancho: 2,
      alto: 2,
      rgba: new Uint8Array([1, 2, 3, 255, 4, 5, 6, 0, 7, 8, 9, 128, 10, 11, 12, 255]),
    };
    expect(leerPng(escribirPng(img))).toEqual(img);
  });
  it('lee filtros Sub/Up/Paeth de un PNG RGB', () => {
    // 2×2 RGB a mano: fila 0 con filtro Sub, fila 1 con filtro Paeth
    const crudo = Buffer.from([1, 10, 20, 30, 5, 5, 5, 4, 1, 1, 1, 2, 2, 2]);
    const cab = Buffer.alloc(13);
    cab.writeUInt32BE(2, 0);
    cab.writeUInt32BE(2, 4);
    cab[8] = 8;
    cab[9] = 2;
    const trozo = (tipo, datos) => {
      const l = Buffer.alloc(4);
      l.writeUInt32BE(datos.length);
      return Buffer.concat([l, Buffer.from(tipo), datos, Buffer.alloc(4)]);
    };
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      trozo('IHDR', cab),
      trozo('IDAT', deflateSync(crudo)),
      trozo('IEND', Buffer.alloc(0)),
    ]);
    const { rgba } = leerPng(png);
    expect([...rgba]).toEqual([10, 20, 30, 255, 15, 25, 35, 255, 11, 21, 31, 255, 17, 27, 37, 255]);
  });
  it('rechaza lo que no es PNG', () => expect(() => leerPng(Buffer.from('hola'))).toThrow());
});

describe('paleta del proyecto', () => {
  it('se lee de arte/paleta.json sin el transparente', () => {
    const p = leerPaleta();
    expect(p.length).toBeGreaterThan(10);
    expect(p.every((c) => /^#[0-9a-f]{6}$/.test(c.hex))).toBe(true);
  });
});
