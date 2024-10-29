import { Injectable } from '@angular/core';
import { PieceSymbol, boardCellNotation, boardCellsType } from './chessTypes';
import { Move } from 'chess.ts';
import { BehaviorSubject } from 'rxjs';

interface State {
  fen: string | undefined;
  moveStack: Array<Move>;
}

const initialState: State = {
  fen: undefined,
  moveStack: [],
};

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private boardCells: boardCellsType = {};

  private state$ = new BehaviorSubject<State>(initialState);
  state = this.state$.asObservable();

  setFen(fen: string): void {
    this.state$.next({ ...this.state$.value, fen: fen });
  }

  setMoveStack(MoveStack: Array<Move>) {
    this.state$.next({ ...this.state$.value, moveStack: MoveStack });
  }

  public UpdateBoardCells(fen: string): void {
    /**
     * Put fen pieces into board cells.
     * Fen is like this : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
     * //TODO: parse fen and check
     */
    const boardCells: boardCellsType = {};
    const boardPartFen = fen.split(' ')[0];
    let row = 0;
    let column = 0;
    let cellName: boardCellNotation;
    for (let fenRow of boardPartFen.split('/')) {
      column = 0;
      for (let fenRowItem of fenRow) {
        if (!isNaN(parseFloat(fenRowItem))) {
          for (let index = 0; index < +fenRowItem; index++) {
            cellName = `${this.fromCoordinatesToBoardCellNotation([
              column + index,
              8 - row,
            ])}` as boardCellNotation;
            boardCells[cellName] = { pieceSymbol: 'no piece', pointed: false };
          }
          column += +fenRowItem;
          continue;
        }
        cellName = `${this.fromCoordinatesToBoardCellNotation([
          column,
          8 - row,
        ])}` as boardCellNotation;
        boardCells[cellName] = {
          pieceSymbol: fenRowItem as PieceSymbol,
          pointed: false,
        };
        column++;
      }
      row++;
    }
    this.boardCells = boardCells;
  }

  public fromCoordinatesToBoardCellNotation(
    coordinates: [number, number]
  ): boardCellNotation {
    return String.fromCharCode(97 + coordinates[0]).concat(
      '' + coordinates[1]
    ) as boardCellNotation;
  }

  public fromBoardCellLetterNotationToCoordinates(
    cellNotation: boardCellNotation
  ): [number, number] {
    return [cellNotation[0].charCodeAt(0) - 97, +cellNotation[1]];
  }

  public getBoardCellsValues(): {
    pieceSymbol: PieceSymbol | 'no piece';
    pointed: boolean;
  }[] {
    return Object.values(this.boardCells);
  }

  public getBoardCellsKeys(): string[] {
    return Object.keys(this.boardCells);
  }

  public getBoardEntries(): [
    string,
    { pieceSymbol: PieceSymbol | 'no piece'; pointed: boolean }
  ][] {
    return Object.entries(this.boardCells);
  }

  public changeCellPointedState(pointedCells: string[], state: boolean): void {
    pointedCells.forEach((oldPointedCellName: string) => {
      this.boardCells[oldPointedCellName].pointed = state;
    });
  }

  getUrlFromPieceSymbol(pieceSymbol: PieceSymbol): string | undefined {
    /**
     * Get piece picture url using piece type and player color.
     * @param piece: The piece used to get the url from.
     * @returns url string for piece given.
     */
    const baseUrl = 'https://upload.wikimedia.org/wikipedia/commons';
    let pieceUrl;
    switch (pieceSymbol) {
      case 'p':
      case 'P':
        pieceUrl =
          pieceSymbol.toUpperCase() === pieceSymbol
            ? '/4/45/Chess_plt45.svg'
            : '/c/c7/Chess_pdt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'n':
      case 'N':
        pieceUrl =
          pieceSymbol.toUpperCase() === pieceSymbol
            ? '/7/70/Chess_nlt45.svg'
            : '/e/ef/Chess_ndt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'b':
      case 'B':
        pieceUrl =
          pieceSymbol.toUpperCase() === pieceSymbol
            ? '/b/b1/Chess_blt45.svg'
            : '/9/98/Chess_bdt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'r':
      case 'R':
        pieceUrl =
          pieceSymbol.toUpperCase() === pieceSymbol
            ? '/7/72/Chess_rlt45.svg'
            : '/f/ff/Chess_rdt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'q':
      case 'Q':
        pieceUrl =
          pieceSymbol.toUpperCase() === pieceSymbol
            ? '/1/15/Chess_qlt45.svg'
            : '/4/47/Chess_qdt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'k':
      case 'K':
        pieceUrl =
          pieceSymbol.toUpperCase() === pieceSymbol
            ? '/4/42/Chess_klt45.svg'
            : '/f/f0/Chess_kdt45.svg';
        return `${baseUrl}${pieceUrl}`;
    }
  }
}
