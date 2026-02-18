// Dice rolling utilities for all games

export function rollD4() {
  return Math.floor(Math.random() * 4) + 1;
}

export function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollD8() {
  return Math.floor(Math.random() * 8) + 1;
}

export function rollD12() {
  return Math.floor(Math.random() * 12) + 1;
}

export function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

// Senet: 4 flat sticks, each with a light and dark side
// 0 dark-up = 5 moves (+ extra turn), 1 = 1 (+ extra turn), 2 = 2, 3 = 3, 4 = 4 (+ extra turn)
export function rollStickDice() {
  const sticks = Array.from({ length: 4 }, () => Math.random() < 0.5 ? 1 : 0);
  const darkUp = sticks.filter(s => s === 1).length;
  const total = darkUp === 0 ? 5 : darkUp;
  const extraTurn = total === 1 || total === 4 || total === 5;
  return { sticks, darkUp, total, extraTurn };
}

// Royal Game of Ur: 4 tetrahedral dice, each has 2 marked + 2 unmarked vertices
// Each die: 50% chance of 0 or 1. Total 0-4.
export function rollTetrahedralDice() {
  const dice = Array.from({ length: 4 }, () => Math.random() < 0.5 ? 1 : 0);
  const total = dice.reduce((a, b) => a + b, 0);
  return { dice, total };
}

// Pachisi: 6 cowrie shells, count mouth-up
// 0 mouth-up = 25 (grace roll). Grace throws (1, 6, 25) grant extra turn.
export function rollCowrieShells() {
  const shells = Array.from({ length: 6 }, () => Math.random() < 0.5 ? 1 : 0);
  const mouthUp = shells.filter(s => s === 1).length;
  const total = mouthUp === 0 ? 25 : mouthUp;
  const extraTurn = total === 1 || total === 6 || total === 25;
  return { shells, mouthUp, total, extraTurn };
}
