import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockfishBoardComponent } from './stockfish-board.component';

describe('StockfishBoardComponent', () => {
  let component: StockfishBoardComponent;
  let fixture: ComponentFixture<StockfishBoardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StockfishBoardComponent]
    });
    fixture = TestBed.createComponent(StockfishBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
