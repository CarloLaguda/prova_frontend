import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DettagliVeicolo } from './dettagli-veicolo';

describe('DettagliVeicolo', () => {
  let component: DettagliVeicolo;
  let fixture: ComponentFixture<DettagliVeicolo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DettagliVeicolo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DettagliVeicolo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
