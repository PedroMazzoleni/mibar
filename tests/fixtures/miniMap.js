// Mapa isométrico de Tiled mínimo (4×3) para los tests de tiledMap y navGrid
//   fila 0: baño · baño · baño · (sin suelo)
//   fila 1: sala · sala (puerta al norte, hacia el baño) · barra · cocina
//   fila 2: mesa · tragaperras (no ocupa) · barra · cocina (puerta al oeste, hacia la barra)
export const miniMap = {
  orientation: 'isometric',
  width: 4,
  height: 3,
  tilewidth: 32,
  tileheight: 16,
  tilesets: [
    {
      firstgid: 1,
      name: 'bar-tiles',
      tilewidth: 32,
      tileheight: 48,
      tiles: [
        { id: 2, properties: [{ name: 'puerta', type: 'string', value: 'norte' }] },
        { id: 3, properties: [{ name: 'puerta', type: 'string', value: 'oeste' }] },
      ],
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
      data: [0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 4],
    },
    {
      name: 'muebles',
      type: 'objectgroup',
      objects: [
        { id: 1, gid: 9, name: 'mesa', type: 'mesa', x: 16, y: 48, width: 32, height: 48 },
        {
          id: 2,
          gid: 12,
          name: 'tragaperras',
          type: 'tragaperras',
          x: 32,
          y: 48,
          width: 32,
          height: 48,
          properties: [{ name: 'ocupa', type: 'bool', value: false }],
        },
      ],
    },
    {
      name: 'zonas',
      type: 'objectgroup',
      objects: [
        { id: 3, name: 'baño', type: 'zona', x: 0, y: 0, width: 48, height: 16 },
        { id: 4, name: 'sala', type: 'zona', x: 0, y: 16, width: 32, height: 32 },
        { id: 5, name: 'barra', type: 'zona', x: 32, y: 16, width: 16, height: 32 },
        { id: 6, name: 'cocina', type: 'zona', x: 48, y: 16, width: 16, height: 32 },
        { id: 7, name: 'entrada', type: 'punto', point: true, x: 24, y: 40, width: 0, height: 0 },
      ],
    },
  ],
};
