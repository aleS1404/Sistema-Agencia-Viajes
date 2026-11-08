import { AppController } from './app.controller';

describe('AppController', () => {
  it('reports a healthy API', () => {
    const result = new AppController().health();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('booking-taller-api');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
