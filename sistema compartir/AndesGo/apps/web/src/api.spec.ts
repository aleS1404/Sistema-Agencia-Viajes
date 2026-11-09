import { describe, expect, it } from 'vitest';
import { API_URL, normalizeService } from './api';

describe('configuración de API', () => {
  it('define una ruta base utilizable', () => {
    expect(API_URL).toBeTruthy();
    expect(API_URL.endsWith('/api')).toBe(true);
  });
});

describe('normalización de recomendaciones', () => {
  it('completa valores seguros cuando la API entrega un servicio parcial', () => {
    const service = normalizeService({
      id: 1,
      code: 'SRV-TEST',
      name: 'Servicio recomendado',
      description: 'Prueba',
      durationDays: 1,
      priceBob: '180.00',
      city: 'La Paz',
      category: 'Experiencia',
      explanation: 'dentro del presupuesto; compatible con los días disponibles',
    });

    expect(service.status).toBe('available');
    expect(service.capacity).toBe(0);
    expect(service.explanation).toEqual(['dentro del presupuesto', 'compatible con los días disponibles']);
  });
});
