import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { chessApiService, Move } from '../boards/services/chess.api.service';
import { interval, mergeMap, pairwise, Subject, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgStyle } from "../../../node_modules/@angular/common/common_module.d";

@Component({
  selector: 'app-game-bar',
  imports: [NgStyle],
  templateUrl: './game-bar.component.html',
  styleUrl: './game-bar.component.scss'
})
export class GameBarComponent {
  readonly lastMoveMade = input.required<Move>();
  private readonly chessService = inject(chessApiService)
  private readonly destroyRef = inject(DestroyRef);
  readonly gameEvaluation = signal(0)
  readonly stopEvaluation = new Subject<void>();

  constructor() {
    effect(() => {
      console.log("trigger")
      this.lastMoveMade();
      interval(5000).pipe(
        takeUntilDestroyed(this.destroyRef), 
        takeUntil(this.stopEvaluation), 
        mergeMap(() => this.chessService.fetchPositionEvaluation()),
        pairwise()
      ).subscribe(([previousEvaluation, currentEvaluation]) => {
        console.log(previousEvaluation)
        console.log(currentEvaluation)
        
        if (previousEvaluation === currentEvaluation){
          this.stopEvaluation.next()
        }
        this.gameEvaluation.set(currentEvaluation)
    })}) 
  }

}
