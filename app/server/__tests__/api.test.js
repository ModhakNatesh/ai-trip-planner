import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { ApiController } from '../controllers/apiController.js';

const app = express();
app.get('/api/hello', ApiController.hello);
app.get('/api/status', ApiController.status);

describe('API Endpoints', () => {
  it('GET /api/hello should return welcome message', async () => {
    const res = await request(app).get('/api/hello');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Hello from AI Trip Planner API!');
  });

  it('GET /api/status should return service status', async () => {
    const res = await request(app).get('/api/status');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('operational');
  });
});