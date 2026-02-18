// AI decision-making primitives

export function chooseBestMove(legalMoves, evaluateFn) {
  if (legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  let bestScore = -Infinity;
  let bestMove = legalMoves[0];

  for (const move of legalMoves) {
    const score = evaluateFn(move);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

export function randomChoice(arr) {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function evaluateWithNoise(score, noise = 0.3) {
  return score + (Math.random() - 0.5) * 2 * noise * Math.abs(score + 1);
}
