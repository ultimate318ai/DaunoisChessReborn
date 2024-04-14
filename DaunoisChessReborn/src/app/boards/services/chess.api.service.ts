import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Chess } from 'chess.ts';

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

  public fetchBestStockFishMove() {
    this.httpClient
      .get(`${this.ipAddress}/move`)
      .subscribe((move) => console.log(move));
  }

  public updateStockFishFen() {
    this.httpClient
      .post(
        `${this.ipAddress}/fen`,
        {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0',
        },
        this._options
      )
      .subscribe({
        next: (response) => console.log(response),
        error: (error) => console.log(error),
      });
  }
}
