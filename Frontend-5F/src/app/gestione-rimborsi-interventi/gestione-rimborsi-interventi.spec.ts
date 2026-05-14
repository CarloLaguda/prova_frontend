import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestioneRimborsiInterventi } from './gestione-rimborsi-interventi';

describe('GestioneRimborsiInterventi', () => {
  let component: GestioneRimborsiInterventi;
  let fixture: ComponentFixture<GestioneRimborsiInterventi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestioneRimborsiInterventi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestioneRimborsiInterventi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
