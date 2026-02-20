/**
 * Registry mapping gameId -> { serialize, deserialize, initialState }
 * Each game's serializer converts between the game's React state and
 * a plain JSON blob suitable for Firestore storage.
 */

export const SERIALIZERS = {
  'snakes-and-ladders': {
    initialState: () => ({
      positions: [0, 0],
      diceValue: null,
      message: 'Roll the dice to begin!',
      moveLog: [],
    }),
    serialize: (state) => ({
      positions: state.positions,
      diceValue: state.diceValue,
      message: state.message,
      moveLog: state.moveLog.slice(-50), // keep last 50 entries
    }),
    deserialize: (data) => ({
      positions: data.positions || [0, 0],
      diceValue: data.diceValue || null,
      message: data.message || '',
      moveLog: data.moveLog || [],
    }),
  },

  'mehen': {
    initialState: () => ({
      pieces: [[0, 0, 0], [0, 0, 0]],
      diceValue: null,
      message: 'Roll the dice to begin!',
      moveLog: [],
    }),
    serialize: (state) => ({
      pieces: state.pieces,
      diceValue: state.diceValue,
      message: state.message,
      moveLog: state.moveLog.slice(-50),
    }),
    deserialize: (data) => ({
      pieces: data.pieces || [[0, 0, 0], [0, 0, 0]],
      diceValue: data.diceValue || null,
      message: data.message || '',
      moveLog: data.moveLog || [],
    }),
  },

  'jackals-and-hounds': {
    initialState: () => ({
      pieces: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
      diceValue: null,
      message: 'Roll the dice to begin!',
      moveLog: [],
    }),
    serialize: (state) => ({
      pieces: state.pieces,
      diceValue: state.diceValue,
      message: state.message,
      moveLog: state.moveLog.slice(-50),
    }),
    deserialize: (data) => ({
      pieces: data.pieces || [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
      diceValue: data.diceValue || null,
      message: data.message || '',
      moveLog: data.moveLog || [],
    }),
  },

  'royal-game-of-ur': {
    initialState: () => ({
      pieces: [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
      ],
      selectedPiece: null,
      diceResult: null,
      message: 'Roll the dice to begin!',
      moveLog: [],
    }),
    serialize: (state) => ({
      pieces: state.pieces,
      selectedPiece: state.selectedPiece,
      diceResult: state.diceResult,
      message: state.message,
      moveLog: state.moveLog.slice(-50),
    }),
    deserialize: (data) => ({
      pieces: data.pieces || [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]],
      selectedPiece: data.selectedPiece ?? null,
      diceResult: data.diceResult ?? null,
      message: data.message || '',
      moveLog: data.moveLog || [],
    }),
  },

  'senet': {
    initialState: () => ({
      pieces: [
        [1, 3, 5, 7, 9],
        [2, 4, 6, 8, 10],
      ],
      selectedPiece: null,
      diceResult: null,
      message: 'Roll the sticks to begin!',
      moveLog: [],
    }),
    serialize: (state) => ({
      pieces: state.pieces,
      selectedPiece: state.selectedPiece,
      diceResult: state.diceResult,
      message: state.message,
      moveLog: state.moveLog.slice(-50),
    }),
    deserialize: (data) => ({
      pieces: data.pieces || [[1, 3, 5, 7, 9], [2, 4, 6, 8, 10]],
      selectedPiece: data.selectedPiece ?? null,
      diceResult: data.diceResult ?? null,
      message: data.message || '',
      moveLog: data.moveLog || [],
    }),
  },

  'pachisi': {
    initialState: () => ({
      pieces: [[-1, -1, -1, -1], [-1, -1, -1, -1]],
      diceResult: null,
      legalMoves: [],
      message: 'Roll the cowrie shells to begin!',
      moveLog: [],
    }),
    serialize: (state) => ({
      pieces: state.pieces,
      diceResult: state.diceResult,
      legalMoves: state.legalMoves,
      message: state.message,
      moveLog: state.moveLog.slice(-50),
    }),
    deserialize: (data) => ({
      pieces: data.pieces || [[-1, -1, -1, -1], [-1, -1, -1, -1]],
      diceResult: data.diceResult ?? null,
      legalMoves: data.legalMoves || [],
      message: data.message || '',
      moveLog: data.moveLog || [],
    }),
  },

  'mythouse': {
    initialState: () => ({
      // Mythouse has complex setup; initial state is pre-setup
      setupComplete: false,
      pieces: null,
      scores: [0, 0],
      cardScores: [0, 0],
      gems: [[], []],
      starlightClaimed: [false, false],
      diceValue: null,
      direction: 'clockwise',
      ordeal: null,
      gameDeck: null,
      gameDeckP2: null,
      majorDeck: null,
      majorDeckP2: null,
      collectedMinor: [[], []],
      collectedMajor: [[], []],
      majorReveal: null,
      message: 'Set up the game to begin!',
      moveLog: [],
    }),
    serialize: (state) => ({
      setupComplete: state.setupComplete,
      pieces: state.pieces,
      scores: state.scores,
      cardScores: state.cardScores,
      gems: state.gems,
      starlightClaimed: state.starlightClaimed,
      diceValue: state.diceValue,
      direction: state.direction,
      ordeal: state.ordeal,
      gameDeck: state.gameDeck,
      gameDeckP2: state.gameDeckP2,
      majorDeck: state.majorDeck,
      majorDeckP2: state.majorDeckP2,
      collectedMinor: state.collectedMinor,
      collectedMajor: state.collectedMajor,
      majorReveal: state.majorReveal,
      message: state.message,
      moveLog: (state.moveLog || []).slice(-50),
    }),
    deserialize: (data) => ({ ...data, moveLog: data.moveLog || [] }),
  },
};
