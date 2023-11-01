import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChessBoardComponent } from './chess-board/chess-board.component';
import { ChessService } from './chess-board/services/chess.service';

@NgModule({
  declarations: [AppComponent, ChessBoardComponent],
  imports: [BrowserModule, AppRoutingModule],
  providers: [ChessService],
  bootstrap: [AppComponent],
})
export class AppModule {}
