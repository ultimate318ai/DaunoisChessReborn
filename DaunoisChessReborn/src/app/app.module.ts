import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChessBoardComponent } from './chess-board/standard-board/chess-board.component';
import { ChessService } from './chess-board/services/chess.service';
import { ChessboardArrowService } from './chess-board-arrow/board-arrow.service';
import { MoveBoardComponent } from './move-board/move-board.component';
import { GameStatusComponent } from './game-status/game-status.component';
import { GameMenuComponent } from './game-menu/game-menu.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChessVariantBoardComponent } from './chess-board/chess-variant-board/chess-variant-board.component';

@NgModule({
  declarations: [
    AppComponent,
    ChessBoardComponent,
    MoveBoardComponent,
    GameStatusComponent,
    GameMenuComponent,
    ChessVariantBoardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DragDropModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [ChessService, ChessboardArrowService],
  bootstrap: [AppComponent],
})
export class AppModule {}
