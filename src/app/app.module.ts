import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { DragDropModule } from '@angular/cdk/drag-drop';

import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChessboardArrowService } from './boards/chess-board-arrow/board-arrow.service';
import { StockfishBoardComponent } from './boards/stockfish-board/stockfish-board.component';
import { MoveBoardComponent } from './move-board/move-board.component';
import { GameMenuComponent } from './game-menu/game-menu.component';
import { GameStatusComponent } from './game-status/game-status.component';

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    StockfishBoardComponent,
    AppRoutingModule,
    MoveBoardComponent,
    DragDropModule,
    GameMenuComponent,
    GameStatusComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    ChessboardArrowService,
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
