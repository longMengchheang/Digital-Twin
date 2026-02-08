import { describe, test, expect, spyOn } from 'bun:test';
import {
  errorResponse,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
} from './api-response';

describe('API Response Helpers', () => {
  test('errorResponse returns correct status and message', async () => {
    const res = errorResponse('Custom error', 418);
    expect(res.status).toBe(418);
    const json = await res.json();
    expect(json).toEqual({ msg: 'Custom error' });
  });

  test('badRequest returns 400', async () => {
    const res = badRequest('Bad input');
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ msg: 'Bad input' });
  });

  test('unauthorized returns 401 with default message', async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ msg: 'No token, authorization denied.' });
  });

  test('unauthorized returns 401 with custom message', async () => {
    const res = unauthorized('Custom auth error');
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ msg: 'Custom auth error' });
  });

  test('forbidden returns 403', async () => {
    const res = forbidden();
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json).toEqual({ msg: 'Forbidden.' });
  });

  test('notFound returns 404', async () => {
    const res = notFound();
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toEqual({ msg: 'Not found.' });
  });

  test('conflict returns 409', async () => {
    const res = conflict();
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json).toEqual({ msg: 'Conflict.' });
  });

  test('serverError logs error and returns 500', async () => {
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');
    const res = serverError(error, 'Test context');

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ msg: 'Server error.' });
    expect(consoleSpy).toHaveBeenCalledWith('Test context:', error);

    consoleSpy.mockRestore();
  });

  test('serverError returns custom user message', async () => {
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');
    const res = serverError(error, 'Test context', 'Something broke');

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ msg: 'Something broke' });

    consoleSpy.mockRestore();
  });
});
