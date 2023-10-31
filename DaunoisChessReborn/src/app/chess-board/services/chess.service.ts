import { Injectable } from '@angular/core';
import { Chess, Move } from 'chess.ts';
import { DaunoisChessError, PieceSymbol, PlayerColor, boardCellNotation } from './chessTypes';

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

  public getMovesFromCell(cellNotation: boardCellNotation): Move[] {
    return this.chess.moves({square: cellNotation, verbose: true});
  }

  public applyChessMove(fromCellNotation: string, toCellNotation: string): Move | null {
    return this.chess.move({from: fromCellNotation, to: toCellNotation})
  }

  public getGameFen(): string {
    return this.chess.fen();
  }

  private playerTurn(): PlayerColor {
    const player = this.chess.fen().split(" ")[1];
    switch(player){
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

  public isKingCellChecked(cell: {pieceSymbol: PieceSymbol | "no piece", pointed: boolean}): boolean {
    return this.chess.inCheck() && (cell.pieceSymbol === 'k' && this.blackToPlay() || cell.pieceSymbol === 'K' && this.whiteToPlay())
  }

}
