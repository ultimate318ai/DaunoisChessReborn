import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { DEFAULT_FEN, PlayerColorSymbol } from './boards/services/chessTypes';
import { GameType, SkillLevel } from './game-menu/game-menu.component';

export interface ChessGameSettings {
  fen: string;
  gameType: GameType;
  skillLevel: SkillLevel;
  playerSymbol: PlayerColorSymbol;
}

const DEFAULT_SETTING: ChessGameSettings = {
  fen: DEFAULT_FEN,
  gameType: 'Chess',
  skillLevel: 0,
  playerSymbol: 'w',
};

interface State {
  settings: ChessGameSettings;
  isGameSet: boolean;
  isGameLaunched: boolean;
  isGameOver: boolean;
}

const initialState: State = {
  settings: DEFAULT_SETTING,
  isGameSet: false,
  isGameLaunched: false,
  isGameOver: false,
};

export const GameStore = signalStore(
  withState(initialState),
  withMethods((store) => ({
    onNewGame(): void {
      patchState(store, initialState);
    },
    onGameStart(settings: ChessGameSettings): void {
      patchState(store, {
        settings: settings,
        isGameSet: true,
        isGameLaunched: true,
        isGameOver: false,
      });
    },
    onRematch(): void {
      patchState(store, (state) => ({
        ...state,
        settings: {
          ...state.settings,
          fen: DEFAULT_FEN,
          playerColor: state.settings.playerSymbol === 'w' ? 'b' : 'w',
        },
        isGameSet: true,
        isGameLaunched: true,
        isGameOver: false,
      }));
    },
    onGameOver(): void {
      patchState(store, (state) => ({ ...state, isGameOver: true }));
    },
  })),
);
