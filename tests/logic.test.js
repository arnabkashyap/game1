import { describe, it, expect } from 'vitest';
import { 
    calculateWorldSpeed, 
    calculateWantedLevel, 
    calculateRank, 
    getTrafficConfig, 
    getPoliceInterval,
    MAX_SPEED,
    INITIAL_SPEED
} from '../www/logic.js';

describe('Game Logic Formulas', () => {
    it('should calculate speed correctly based on distance', () => {
        expect(calculateWorldSpeed(0)).toBe(INITIAL_SPEED);
        expect(calculateWorldSpeed(15000)).toBe(1.4); // 0.4 + (15000/15000)^0.65 = 0.4 + 1 = 1.4
        expect(calculateWorldSpeed(1000000)).toBe(MAX_SPEED); // Clamped
    });

    it('should progress wanted levels correctly', () => {
        expect(calculateWantedLevel(500)).toBe(0);
        expect(calculateWantedLevel(1500)).toBe(1);
        expect(calculateWantedLevel(3500)).toBe(2);
        expect(calculateWantedLevel(7000)).toBe(3);
        expect(calculateWantedLevel(13000)).toBe(4);
        expect(calculateWantedLevel(25000)).toBe(5);
    });

    it('should calculate player rank correctly', () => {
        expect(calculateRank(100)).toBe('ROOKIE');
        expect(calculateRank(1000)).toBe('STREET');
        expect(calculateRank(3000)).toBe('HOTSHOT');
        expect(calculateRank(10000)).toBe('ELITE');
        expect(calculateRank(20000)).toBe('LEGEND');
        expect(calculateRank(30000)).toBe('ESCAPED');
    });

    it('should return correct traffic configuration', () => {
        const cfg0 = getTrafficConfig(0);
        expect(cfg0.max).toBe(1);
        expect(cfg0.rate).toBe(0.005);

        const cfg5 = getTrafficConfig(5);
        expect(cfg5.max).toBe(7);
        expect(cfg5.rate).toBe(0.050);
    });

    it('should return correct police spawn intervals', () => {
        expect(getPoliceInterval(1)).toBe(Infinity);
        expect(getPoliceInterval(2)).toBe(10);
        expect(getPoliceInterval(5)).toBe(4);
    });
});
