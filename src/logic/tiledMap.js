// Lectura pura del JSON de un mapa isométrico de Tiled (.tmj): capas, muebles, zonas y puertas.
// En un mapa isométrico, Tiled guarda la posición de los objetos en unidades de `tileheight`
// por eje: x / tileheight es la columna e y / tileheight, la fila (puntos de rejilla).

// Propiedades de Tiled ([{ name, type, value }]) como objeto plano
export function readProperties(props = []) {
  return Object.fromEntries(props.map(({ name, value }) => [name, value]));
}

export function findLayer(map, name) {
  return map.layers.find((layer) => layer.name === name) ?? null;
}

// gid de la casilla (col, row) de una capa de casillas; 0 si está vacía o fuera
export function tileAt(layer, col, row) {
  if (!layer || col < 0 || row < 0 || col >= layer.width || row >= layer.height) return 0;
  return layer.data[row * layer.width + col];
}

// Tileset al que pertenece un gid (el de firstgid más alto que no lo supere)
function tilesetOf(map, gid) {
  return map.tilesets
    .filter((ts) => ts.firstgid <= gid)
    .reduce((best, ts) => (!best || ts.firstgid > best.firstgid ? ts : best), null);
}

// Posición de un objeto de Tiled como punto de rejilla (con decimales)
export function objectToGrid(map, x, y) {
  return { gc: x / map.tileheight, gr: y / map.tileheight };
}

// Muebles de la capa de objetos: frame dentro del tileset y casilla que pisan.
// Tiled ancla los objetos-casilla por el centro de abajo, que cae en la esquina inferior
// del rombo de su casilla: el punto de rejilla (col + 1, row + 1).
export function readFurniture(map, layerName = 'muebles') {
  const layer = findLayer(map, layerName);
  if (!layer) return [];
  return layer.objects
    .filter((o) => o.gid)
    .map((o) => {
      const tileset = tilesetOf(map, o.gid);
      const props = readProperties(o.properties);
      const { gc, gr } = objectToGrid(map, o.x, o.y);
      return {
        id: o.id,
        type: o.type,
        name: o.name,
        tileset: tileset?.name ?? null,
        frame: o.gid - (tileset?.firstgid ?? 1),
        col: Math.round(gc) - 1,
        row: Math.round(gr) - 1,
        occupies: props.ocupa !== false,
      };
    });
}

// Zonas rectangulares en casillas y puntos sueltos (p. ej. la entrada) como puntos de rejilla
export function readZones(map, layerName = 'zonas') {
  const layer = findLayer(map, layerName);
  const zones = [];
  const points = {};
  for (const o of layer?.objects ?? []) {
    const { gc, gr } = objectToGrid(map, o.x, o.y);
    if (o.point) {
      points[o.name] = { gc, gr };
      continue;
    }
    zones.push({
      name: o.name,
      col: Math.round(gc),
      row: Math.round(gr),
      cols: Math.round(o.width / map.tileheight),
      rows: Math.round(o.height / map.tileheight),
    });
  }
  return { zones, points };
}

// Valor de una propiedad en cada gid que la tiene (p. ej. 'puerta' → 'norte' | 'oeste')
export function gidProperty(map, property) {
  const values = new Map();
  for (const ts of map.tilesets) {
    for (const tile of ts.tiles ?? []) {
      const value = readProperties(tile.properties)[property];
      if (value !== undefined) values.set(ts.firstgid + tile.id, value);
    }
  }
  return values;
}
