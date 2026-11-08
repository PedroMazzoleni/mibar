// Mapa de Tiled mínimo (4×3) para los tests de tiledMap y navGrid
//   fila 0: pared · puerta · pared · (sin suelo)
//   fila 1: tragaperras (mitad de arriba, no ocupa) · baño · mesa · barra
//   fila 2: sala de lado a lado
export const miniMap = {
  width: 4,
  height: 3,
  tilewidth: 32,
  tileheight: 32,
  tilesets: [
    {
      firstgid: 1,
      name: 'bar-tiles',
      tiles: [{ id: 2, properties: [{ name: 'puerta', type: 'bool', value: true }] }],
    },
  ],
  layers: [
    {
      name: 'suelo',
      type: 'tilelayer',
      width: 4,
      height: 3,
      data: [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    },
    {
      name: 'paredes',
      type: 'tilelayer',
      width: 4,
      height: 3,
      data: [2, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      name: 'muebles',
      type: 'objectgroup',
      objects: [
        { id: 1, gid: 9, name: 'mesa', type: 'mesa', x: 64, y: 64, width: 32, height: 32 },
        {
          id: 2,
          gid: 12,
          name: 'tragaperras',
          type: 'tragaperras',
          x: 0,
          y: 64,
          width: 32,
          height: 32,
          properties: [{ name: 'ocupa', type: 'bool', value: false }],
        },
      ],
    },
    {
      name: 'zonas',
      type: 'objectgroup',
      objects: [
        { id: 3, name: 'baño', type: 'zona', x: 0, y: 32, width: 64, height: 32 },
        { id: 4, name: 'barra', type: 'zona', x: 64, y: 32, width: 64, height: 32 },
        { id: 5, name: 'sala', type: 'zona', x: 0, y: 64, width: 128, height: 32 },
        { id: 6, name: 'entrada', type: 'punto', point: true, x: 48, y: 80, width: 0, height: 0 },
      ],
    },
  ],
};
