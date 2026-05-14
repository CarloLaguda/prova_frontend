import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DettagliPolizza } from './dettagli-polizza';

describe('DettagliPolizza', () => {
  let component: DettagliPolizza;
  let fixture: ComponentFixture<DettagliPolizza>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DettagliPolizza]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DettagliPolizza);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
