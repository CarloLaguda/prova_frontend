import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuovoVeicolo } from './nuovo-veicolo';

describe('NuovoVeicolo', () => {
  let component: NuovoVeicolo;
  let fixture: ComponentFixture<NuovoVeicolo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuovoVeicolo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuovoVeicolo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
