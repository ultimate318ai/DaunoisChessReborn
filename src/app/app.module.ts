import { NgModule, provideZonelessChangeDetection } from '@angular/core';

import {} from '@angular/common/http';
import { ChessboardArrowService } from './boards/chess-board-arrow/board-arrow.service';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
  providers: [
    BrowserModule,
    ChessboardArrowService,
    provideZonelessChangeDetection(),
  ],
})
export class AppModule {}
