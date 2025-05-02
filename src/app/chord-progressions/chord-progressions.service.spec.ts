import { TestBed } from '@angular/core/testing';

import { ChordProgressionsService } from './chord-progressions.service';

describe('ChordProgressionsService', () => {
  let service: ChordProgressionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChordProgressionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
