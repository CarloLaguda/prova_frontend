import { TestBed } from '@angular/core/testing';

import { Sinistri } from './sinistri';

describe('Sinistri', () => {
  let service: Sinistri;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sinistri);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
