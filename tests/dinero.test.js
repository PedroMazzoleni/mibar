import { describe, it, expect } from 'vitest';

describe('dinero en céntimos', () => {
  it('suma sin errores de redondeo', () => {
    expect(10 + 20).toBe(30); // 0,10 € + 0,20 € = 0,30 €
  });
});
