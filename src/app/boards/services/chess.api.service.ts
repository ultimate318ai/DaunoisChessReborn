import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpResponse,
} from '@angular/common/http';
import { filter, map, Observable, retry } from 'rxjs';
import { boardCellNotation, PieceSymbol } from './chessTypes';

export type Move = {
  uci: string;
  from: boardCellNotation;
  to: boardCellNotation;
  promotion: PieceSymbol | null;
  drop: PieceSymbol | null;
};

export type BoardInformation = {
  is_check: boolean;
  turn: boolean;
};

type BackendGetResponse = {
  'App/Inf'?: string;
  'App/Err'?: string;
  value: any;
};

type BackendPutResponse = {
  'App/Inf'?: string;
  'App/Err'?: string;
};

type BackendPostResponse = {
  'App/Inf'?: string;
  'App/Err'?: string;
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
    return this.getOnBackendServer('move');
  }

  public fetchBestStockFishMoveList(): Observable<Move[]> {
    return this.getOnBackendServer('moves');
  }

  public fetchStockFishFen(): Observable<string> {
    return this.getOnBackendServer('fen');
  }

  public fetchBoardInformation(): Observable<BoardInformation> {
    return this.getOnBackendServer('boardInformation');
  }

  private ifChessFen(value: Object): value is string {
    const fenValidation = new RegExp(
      /^(?:(?:[PNBRQK]+|[1-8])\/){7}(?:[PNBRQK]+|[1-8])$/gim
    );
    return value.toString().match(fenValidation) !== null;
  }

  public updateStockFishFen() {
    this.putOnBackendServer('fen', {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0',
    }).subscribe({
      next: (response) => console.log(response),
      error: (error) => console.log(error),
    });
    this.httpClient.put(`${this.ipAddress}/fen`, {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0',
    });
  }

  public applyChessMove(
    fromCellNotation: string,
    toCellNotation: string,
    promotion?: PieceSymbol
  ): Observable<string> {
    return this.putOnBackendServer('move', {
      from: fromCellNotation,
      to: toCellNotation,
      promotion: promotion !== undefined ? promotion.toLowerCase() : null,
    });
  }

  private getOnBackendServer(endpoint: string): Observable<any> {
    return this.httpClient
      .get<BackendGetResponse>(`${this.ipAddress}/${endpoint}`, {
        ...this._options,
        responseType: 'json',
        observe: 'response',
      })
      .pipe(
        map((httpResponse) => {
          console.log(httpResponse);
          const responseBody = httpResponse.body;
          if (!responseBody)
            throw new Error(`no response body for ${endpoint} request`);
          return responseBody.value;
        })
      );
  }

  private putOnBackendServer(
    endpoint: string,
    value: {
      [param: string]:
        | string
        | number
        | boolean
        | null
        | ReadonlyArray<string | number | boolean>;
    }
  ): Observable<string> {
    return this.httpClient
      .get<BackendPutResponse>(`${this.ipAddress}/${endpoint}`, {
        ...this._options,
        responseType: 'json',
        observe: 'response',
      })
      .pipe(
        map((httpResponse) => {
          console.log(httpResponse);
          const responseBody = httpResponse.body;
          if (!responseBody)
            throw new Error(`no response body for ${endpoint} request`);
          return responseBody['App/Err'] !== undefined
            ? responseBody['App/Err']
            : responseBody['App/Inf'] !== undefined
            ? responseBody['App/Inf']
            : '';
        })
      );
  }

  private postOnBackendServer(
    endpoint: string,
    parameter:
      | HttpParams
      | {
          [param: string]:
            | string
            | number
            | boolean
            | null
            | ReadonlyArray<string | number | boolean>;
        }
  ): Observable<any> {
    return this.httpClient
      .post<BackendPostResponse>(`${this.ipAddress}/${endpoint}`, {
        ...this._options,
        responseType: 'json',
        observe: 'response',
      })
      .pipe(
        map((httpResponse) => {
          console.log(httpResponse);
          const responseBody = httpResponse;
          return responseBody;
        })
      );
  }
}
