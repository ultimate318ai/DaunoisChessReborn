import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveBoardComponent } from './move-board.component';

describe('MoveBoardComponent', () => {
  let component: MoveBoardComponent;
  let fixture: ComponentFixture<MoveBoardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MoveBoardComponent]
    });
    fixture = TestBed.createComponent(MoveBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
