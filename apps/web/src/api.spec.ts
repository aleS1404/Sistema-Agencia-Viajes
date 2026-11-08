import { describe, expect, it } from 'vitest';
import { API_URL } from './api';

describe('configuración de API', () => {
  it('define una ruta base utilizable', () => {
    expect(API_URL).toBeTruthy();
    expect(API_URL.endsWith('/api')).toBe(true);
  });
});
