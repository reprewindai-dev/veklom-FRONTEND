/**
 * @jest-environment node
 */
import { getToken } from '../api';

describe('getToken (node environment)', () => {
  it('should return null when window is undefined', () => {
    expect(typeof window).toBe('undefined');
    expect(getToken()).toBeNull();
  });
});
