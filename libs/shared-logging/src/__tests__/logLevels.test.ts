import { describe, it, expect } from 'vitest';
import { LogLevel } from '../log-levels';

describe('LogLevel', () => {
  it('should have correct enum values', () => {
    expect(LogLevel.Info).toBe(1);
    expect(LogLevel.Warning).toBe(2);
    expect(LogLevel.Debug).toBe(3);
    expect(LogLevel.Error).toBe(10);
  });

  it('should export all log levels', () => {
    const levels = Object.keys(LogLevel);
    expect(levels).toContain('Info');
    expect(levels).toContain('Warning');
    expect(levels).toContain('Debug');
    expect(levels).toContain('Error');
  });
});
