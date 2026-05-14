import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaVeicoli } from './lista-veicoli';

describe('ListaVeicoli', () => {
  let component: ListaVeicoli;
  let fixture: ComponentFixture<ListaVeicoli>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaVeicoli]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaVeicoli);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
