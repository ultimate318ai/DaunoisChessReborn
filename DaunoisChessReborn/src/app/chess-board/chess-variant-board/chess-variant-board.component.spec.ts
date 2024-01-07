import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChessVariantBoardComponent } from './chess-variant-board.component';

describe('ChessVariantBoardComponent', () => {
  let component: ChessVariantBoardComponent;
  let fixture: ComponentFixture<ChessVariantBoardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChessVariantBoardComponent]
    });
    fixture = TestBed.createComponent(ChessVariantBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
