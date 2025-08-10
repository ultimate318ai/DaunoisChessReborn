import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { boardCellNotation, PieceSymbol } from './chessTypes';

export type Move = {
  uci: string;
  from: boardCellNotation;
  to: boardCellNotation;
  promotion: PieceSymbol | null;
  drop: PieceSymbol | null;
};

export type BoardMove = Move & {
  capturedPiece: PieceSymbol | null;
};

export type BoardInformation = {
  is_check: boolean;
  turn: 'w' | 'b';
};

type BackendGetResponse = {
  'App/Inf'?: string;
  'App/Err'?: string;
  value: any;
};

type BackendDeleteResponse = {
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

  public fetchBestMove(): Observable<string> {
    return this.getOnBackendServer('move');
  }

  public fetchMoveList(): Observable<Move[]> {
    return this.getOnBackendServer('moves');
  }

  public fetchFen(): Observable<string> {
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

  public updateFen(fen: string): Observable<string> {
    return this.putOnBackendServer('fen', fen);
  }

  public undoLastChessMove(): Observable<Move | null> {
    return this.deleteOnBackendServer('move');
  }

  public applyChessMove(move: Move): Observable<string> {
    const { from, to, promotion } = move;
    return this.putOnBackendServer('move', {
      from,
      to,
      promotion,
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
          const responseBody = httpResponse.body;
          if (!responseBody)
            throw new Error(`no response body for ${endpoint} request`);
          return responseBody.value;
        })
      );
  }

  private deleteOnBackendServer(endpoint: string): Observable<any> {
    return this.httpClient
      .delete<BackendDeleteResponse>(`${this.ipAddress}/${endpoint}`, {
        ...this._options,
        responseType: 'json',
        observe: 'response',
      })
      .pipe(
        map((httpResponse) => {
          const responseBody = httpResponse.body;
          if (!responseBody)
            throw new Error(`no response body for ${endpoint} request`);
          return responseBody.value;
        })
      );
  }

  private putOnBackendServer(endpoint: string, value: any): Observable<string> {
    return this.httpClient
      .put<BackendPutResponse>(`${this.ipAddress}/${endpoint}`, value, {
        ...this._options,
        responseType: 'json',
        observe: 'response',
      })
      .pipe(
        map((httpResponse) => {
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
    parameters: any
  ): Observable<any> {
    return this.httpClient
      .post<BackendPostResponse>(`${this.ipAddress}/${endpoint}`, parameters, {
        ...this._options,
        responseType: 'json',
        observe: 'response',
      })
      .pipe(
        map((httpResponse) => {
          const responseBody = httpResponse;
          return responseBody;
        })
      );
  }
}
