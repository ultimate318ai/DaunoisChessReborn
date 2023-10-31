import { Injectable, Inject } from '@angular/core';
import { Chess, Move } from 'chess.ts';
import { boardCellNotation } from './chessTypes';

@Injectable({
  providedIn: 'root'
})
export class ChessService {

  private chess: Chess;

  constructor() {
    this.chess = new Chess();
  }

  public restartChessGame(fen: string) {
    this.chess.clear()
    this.chess = new Chess(fen);
  }

  public getMovesFromCell(cell: boardCellNotation): Move[] {
    return this.chess.moves({square: cell, verbose: true});
  }

  public applyChessMove(fromCell: string, toCell: string): Move | null {
    return this.chess.move({from: fromCell, to: toCell})
  }

  public getGameFen(): string {
    return this.chess.fen();
  }

}
