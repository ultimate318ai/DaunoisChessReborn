import * as ffish from 'ffish';
import { Injectable } from '@angular/core';
import {
  DaunoisChessError,
  PieceSymbol,
  PlayerColor,
  BoardCellNotation,
} from './chessTypes';
import { ChessVariant } from 'src/app/game-menu/gameSettings';

@Injectable({
  providedIn: 'root',
})
export class ChessVariantsService {
  private chess!: ffish.Board;
  private ffish!: ffish.FairyStockfish;

  constructor() {
    ffish.Module().then((loadedModule) => {
      this.ffish = loadedModule;
      this.chess = new this.ffish.Board('chess');
      console.log('ffish loaded');
    });
  }

  public coordinatesToMoveSan(from: string, to: string): string | undefined {
    return this.chessMoveSanList.find((moveSan) => {
      const _move = this.sanToMove(moveSan);
      return from === _move.from && to === _move.to;
    });
  }

  public sanToMove(sanMove: string): {
    piece: PieceSymbol;
    from: BoardCellNotation;
    to: BoardCellNotation;
    promotion: PieceSymbol | null;
  } {
    const cleanMove = sanMove.replace(/=/, '').replace(/[+#]?[?!]*$/, '');

    let matches, piece, from, to, promotion;

    matches = cleanMove.match(
      /([pnbrqkPNBRQK])?([a-h][1-8])x?-?([a-h][1-8])([qrbnQRBN])?/
    );
    if (matches) {
      piece = matches[1];
      from = matches[2];
      to = matches[3];
      promotion = matches[4];
    }
    return {
      piece: piece as PieceSymbol,
      from: from as BoardCellNotation,
      to: to as BoardCellNotation,
      promotion: promotion as PieceSymbol,
    };
  }
  get chessMoveSanList(): string[] {
    return this.chess.legalMovesSan().split(' ');
  }

  public restartChessGame(fen: string, variant: ChessVariant) {
    this.chess = new this.ffish.Board(variant, fen);
  }

  public getMovesSanFromCell(cellNotation: BoardCellNotation): string[] {
    return this.chessMoveSanList.filter((sanMove) => {
      const { from } = this.sanToMove(sanMove);

      return from && from === cellNotation;
    });
  }

  public applyChessMoveSan(moveSan: string): void {
    this.chess.pushSan(moveSan);
  }

  public undoLastChessMove(): string | null {
    const last_move = this.chess.moveStack().split(' ').pop();
    return last_move !== undefined ? last_move : null;
  }

  public getGameFen(): string {
    return this.chess.fen();
  }

  private playerTurn(): PlayerColor {
    const player = this.chess.fen().split(' ')[1];
    switch (player) {
      case 'w':
      case 'b':
        return player;
      default:
        throw new DaunoisChessError(`Wrong player to play in fen : ${player}`);
    }
  }

  public blackToPlay(): boolean {
    return this.playerTurn() === 'b';
  }

  public whiteToPlay(): boolean {
    return this.playerTurn() === 'w';
  }

  public isKingCellChecked(cell: {
    pieceSymbol: PieceSymbol | 'no piece';
    pointed: boolean;
  }): boolean {
    return (
      this.chess.isCheck() &&
      ((cell.pieceSymbol === 'k' && this.blackToPlay()) ||
        (cell.pieceSymbol === 'K' && this.whiteToPlay()))
    );
  }

  public moveSanInvolvesPromotion(moveSan: string): boolean {
    const { promotion } = this.sanToMove(moveSan);
    return promotion !== null;
  }

  public isGameFinished(): boolean {
    return this.chess.isGameOver();
  }

  public getEndGameStatus(): string {
    if (this.whiteToPlay() && this.isGameFinished()) return '0 - 1';
    if (this.blackToPlay() && this.isGameFinished()) return '1 - 0';
    return '1/2 - 1/2';
  }

  public isFenValid(fen: string): boolean {
    return this.ffish.validateFen(fen) === 1;
  }
}
