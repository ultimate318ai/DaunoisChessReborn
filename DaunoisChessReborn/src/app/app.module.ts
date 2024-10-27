import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ChessService } from './boards/services/chess.service';
import { ChessboardArrowService } from './boards/chess-board-arrow/board-arrow.service';
import { MoveBoardComponent } from './move-board/move-board.component';
import { GameStatusComponent } from './game-status/game-status.component';
import { GameMenuComponent } from './game-menu/game-menu.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StockfishBoardComponent } from './boards/stockfish-board/stockfish-board.component';

@NgModule({
  declarations: [
    AppComponent,
    MoveBoardComponent,
    GameStatusComponent,
    GameMenuComponent,
    StockfishBoardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DragDropModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [ChessService, ChessboardArrowService],
  bootstrap: [AppComponent],
})
export class AppModule {}
