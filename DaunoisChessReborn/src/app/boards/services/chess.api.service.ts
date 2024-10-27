import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { filter, map, Observable } from 'rxjs';
import { PieceSymbol } from './chessTypes';

export type StockFishMove = {
  move: string;
  centipawn: number | null;
  mate: number | null;
  coordinates: { from: string; to: string };
  promotion: PieceSymbol;
};

export type BoardInformation = {
  is_check: boolean;
  turn: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class chessApiService {
  private readonly ipAddress = 'http://localhost:8080';
  private _options = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': this.ipAddress,
    }),
  };

  constructor(private httpClient: HttpClient) {}

  public fetchBestStockFishMove(): Observable<string> {
    const httpResponse = this.httpClient.get(`${this.ipAddress}/move`, {
      observe: 'response',
    }) as Observable<HttpResponse<{ move: string }>>;

    return httpResponse.pipe(
      map((httpResponse) => {
        const move = httpResponse.body?.move;
        if (!move) {
          throw new Error('No moves in response body.');
        }
        return move;
      })
    );
  }

  public fetchBestStockFishMoveList(): Observable<StockFishMove[]> {
    const httpResponse = this.httpClient.get(`${this.ipAddress}/moves`, {
      ...this._options,
      responseType: 'json',
      observe: 'response',
    });

    return httpResponse.pipe(
      map((httpResponse) => {
        const moveList = httpResponse.body as StockFishMove[];
        if (!moveList) {
          throw new Error('No moves in response body.');
        }
        return moveList;
      })
    );
  }

  public fetchStockFishFen(): Observable<string> {
    return this.httpClient
      .get(`${this.ipAddress}/move`, {
        ...this._options,
        responseType: 'json',
        observe: 'response',
      })
      .pipe(map((httpResponse) => httpResponse.body as string));
  }

  public fetchBoardInformation(): Observable<BoardInformation> {
    return this.httpClient
      .get(`${this.ipAddress}/boardInformation`, {
        ...this._options,
        responseType: 'json',
        observe: 'response',
      })
      .pipe(map((httpResponse) => httpResponse.body as BoardInformation));
  }

  private ifChessFen(value: Object): value is string {
    const fenValidation = new RegExp(
      /^(?:(?:[PNBRQK]+|[1-8])\/){7}(?:[PNBRQK]+|[1-8])$/gim
    );
    return value.toString().match(fenValidation) !== null;
  }

  public updateStockFishFen() {
    this.httpClient
      .post(
        `${this.ipAddress}/fen`,
        {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0',
        },
        { ...this._options, responseType: 'json', observe: 'response' }
      )
      .subscribe({
        next: (response) => console.log(response),
        error: (error) => console.log(error),
      });
  }

  public applyChessMove(
    fromCellNotation: string,
    toCellNotation: string,
    promotion?: PieceSymbol
  ): Observable<StockFishMove | null> {
    return this.httpClient
      .post(
        `${this.ipAddress}/move`,
        {
          from: fromCellNotation,
          to: toCellNotation,
          promotion: promotion !== undefined ? promotion.toLowerCase() : null,
        },
        { ...this._options, responseType: 'json', observe: 'response' }
      )
      .pipe(
        map((httpResponse): StockFishMove | null => {
          return httpResponse.body as StockFishMove | null;
        })
      );
  }
}
