import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { map, mergeMap, Observable, of } from 'rxjs';
import { boardCellNotation, PieceSymbol } from './chessTypes';

export interface Move {
  uci: string;
  from: boardCellNotation;
  to: boardCellNotation;
  promotion: PieceSymbol | null;
  isEnPassant: boolean;
  drop: PieceSymbol | null;
}

export type BoardMove = Move & {
  capturedPiece: PieceSymbol | null;
};

export interface BoardInformation {
  is_check: boolean;
  turn: 'w' | 'b';
}

interface BackendGetResponse<T> {
  'App/Inf'?: string;
  'App/Err'?: string;
  value: T;
}

interface BackendDeleteResponse<T> {
  'App/Inf'?: string;
  'App/Err'?: string;
  value: T;
}

interface BackendPutResponse {
  'App/Inf'?: string;
  'App/Err'?: string;
}

interface BackendPostResponse<T> {
  'App/Inf'?: string;
  'App/Err'?: string;
  value: T;
}

@Injectable({
  providedIn: 'root',
})
export class chessApiService {
  private httpClient = inject(HttpClient);

  private readonly ipAddress = 'http://localhost:8080';
  private _options = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': this.ipAddress,
    }),
  };


  public fetchBestMoveUci(): Observable<string> {
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

  public updateFen(fen: string): Observable<null> {
    return this.putOnBackendServer('fen', fen).pipe(mergeMap(() => of(null)));
  }

  public undoLastChessMove(): Observable<Move | null> {
    return this.deleteOnBackendServer('move');
  }

  public applyChessMove(move: Move): Observable<null> {
    const { from, to, promotion } = move;
    return this.putOnBackendServer('move', {
      from,
      to,
      promotion,
    }).pipe(mergeMap(() => of(null)));
  }

  public applyStockfishMove(): Observable<Move> {
    return this.postOnBackendServer<Move>('move').pipe(
        map((httpResponse) => {
          const responseBody = httpResponse.body;
          if (!responseBody)
            throw new Error(`no response body for move post request`);
          return responseBody.value;
        })
      );
  }


  public resetBoardState(): Observable<null> {
    return this.deleteOnBackendServer("boardInformation").pipe(mergeMap(() => of(null)));
  }

  private getOnBackendServer<RType = string>(endpoint: string): Observable<RType> {
    return this.httpClient
      .get<BackendGetResponse<RType>>(`${this.ipAddress}/${endpoint}`, {
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

  private deleteOnBackendServer<RType = string>(endpoint: string): Observable<RType> {
    return this.httpClient
      .delete<BackendDeleteResponse<RType>>(`${this.ipAddress}/${endpoint}`, {
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

  private putOnBackendServer(endpoint: string, value?: unknown): Observable<HttpResponse<BackendPutResponse>> {
    if (!value){
          return this.httpClient
      .put<BackendPutResponse>(`${this.ipAddress}/${endpoint}`, null, {
        ...this._options,
        responseType: 'json',
        observe: 'response',
      })
    }
    return this.httpClient
      .put<BackendPutResponse>(`${this.ipAddress}/${endpoint}`, value, {
        ...this._options,
        responseType: 'json',
        observe: 'response',
      })
    
  }

  private postOnBackendServer<RType = string>(
    endpoint: string,
    parameters?: unknown
  ): Observable<HttpResponse<BackendPostResponse<RType>>> {
    if (!parameters) {
       return this.httpClient
      .post<BackendPostResponse<RType>>(`${this.ipAddress}/${endpoint}`, null, {
        ...this._options,
        responseType: 'json',
        observe: 'response',
      })
    }
    return this.httpClient
      .post<BackendPostResponse<RType>>(`${this.ipAddress}/${endpoint}`, parameters, {
        ...this._options,
        responseType: 'json',
        observe: 'response',
      })
  }
}
