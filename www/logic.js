/**
 * Core game logic and formulas
 */

export const INITIAL_SPEED = 0.4;
export const MAX_SPEED = 1.6;

export function calculateWorldSpeed(distance) {
    return Math.min(MAX_SPEED, 0.4 + Math.pow(distance / 15000, 0.65));
}

export function calculateWantedLevel(distance) {
    if (distance > 20000) return 5;
    if (distance > 12000) return 4;
    if (distance > 6000) return 3;
    if (distance > 3000) return 2;
    if (distance > 1000) return 1;
    return 0;
}

export function calculateRank(distance) {
    if (distance < 500) return 'ROOKIE';
    if (distance < 2000) return 'STREET';
    if (distance < 5000) return 'HOTSHOT';
    if (distance < 12000) return 'ELITE';
    if (distance < 25000) return 'LEGEND';
    return 'ESCAPED';
}

export function getTrafficConfig(wantedLevel) {
    const config = [
        { max: 1, rate: 0.005, speed: 0 },   // Level 0
        { max: 2, rate: 0.010, speed: 80 },  // Level 1
        { max: 3, rate: 0.015, speed: 100 }, // Level 2
        { max: 4, rate: 0.025, speed: 120 }, // Level 3
        { max: 5, rate: 0.035, speed: 150 }, // Level 4
        { max: 7, rate: 0.050, speed: 180 }  // Level 5
    ];
    return config[wantedLevel] || config[0];
}

export function getPoliceInterval(wantedLevel) {
    if (wantedLevel < 2) return Infinity;
    if (wantedLevel === 2) return 10;
    if (wantedLevel === 3) return 8;
    if (wantedLevel === 4) return 6;
    if (wantedLevel === 5) return 4;
    return 4;
}
