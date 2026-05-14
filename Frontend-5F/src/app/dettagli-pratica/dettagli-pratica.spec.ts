import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DettagliPratica } from './dettagli-pratica';

describe('DettagliPratica', () => {
  let component: DettagliPratica;
  let fixture: ComponentFixture<DettagliPratica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DettagliPratica]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DettagliPratica);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
