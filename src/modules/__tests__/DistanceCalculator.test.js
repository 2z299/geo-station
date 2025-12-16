/**
 * DistanceCalculator のテスト
 */
import { describe, it, expect } from 'vitest';
import { DistanceCalculator } from '../DistanceCalculator.js';

describe('DistanceCalculator', () => {
  const calculator = new DistanceCalculator();

  it('should calculate distance between two points correctly', () => {
    // 東京駅から新宿駅までの距離（約6km）
    const tokyoStation = { latitude: 35.681236, longitude: 139.767125 };
    const shinjukuStation = { latitude: 35.689592, longitude: 139.700464 };
    
    const distance = calculator.calculateDistance(
      tokyoStation.latitude,
      tokyoStation.longitude,
      shinjukuStation.latitude,
      shinjukuStation.longitude
    );

    // 距離は約6000メートル（±500mの誤差を許容）
    expect(distance).toBeGreaterThan(5500);
    expect(distance).toBeLessThan(6500);
  });

  it('should return 0 for same coordinates', () => {
    const distance = calculator.calculateDistance(35.681236, 139.767125, 35.681236, 139.767125);
    expect(distance).toBe(0);
  });

  it('should check if position is within radius', () => {
    const currentPos = { latitude: 35.681236, longitude: 139.767125 };
    const targetPos = { latitude: 35.681336, longitude: 139.767225 };
    
    // 20m程度の距離なので、100m以内に入る
    expect(calculator.isWithinRadius(currentPos, targetPos, 100)).toBe(true);
    
    // 10m以下ではない
    expect(calculator.isWithinRadius(currentPos, targetPos, 10)).toBe(false);
  });

  it('should format distance correctly', () => {
    expect(calculator.formatDistance(500)).toBe('500m');
    expect(calculator.formatDistance(999)).toBe('999m');
    expect(calculator.formatDistance(1000)).toBe('1.0km');
    expect(calculator.formatDistance(2500)).toBe('2.5km');
    expect(calculator.formatDistance(10000)).toBe('10.0km');
  });
});
