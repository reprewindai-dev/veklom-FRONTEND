import { getToken } from '../api';

describe('getToken (browser environment)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should return null when no tokens are in localStorage', () => {
    expect(getToken()).toBeNull();
  });

  it('should return token from veklom.access_token', () => {
    window.localStorage.setItem('veklom.access_token', 'test-token-1');
    expect(getToken()).toBe('test-token-1');
  });

  it('should return token from veklom_token if veklom.access_token is not present', () => {
    window.localStorage.setItem('veklom_token', 'test-token-2');
    expect(getToken()).toBe('test-token-2');
  });

  it('should prefer veklom.access_token over veklom_token', () => {
    window.localStorage.setItem('veklom_token', 'test-token-2');
    window.localStorage.setItem('veklom.access_token', 'test-token-1');

    expect(getToken()).toBe('test-token-1');
  });
});
