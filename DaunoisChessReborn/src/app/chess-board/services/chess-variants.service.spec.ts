import { TestBed } from '@angular/core/testing';

import { ChessVariantsService } from './chess-variants.service';

describe('ChessVariantsService', () => {
  let service: ChessVariantsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChessVariantsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
