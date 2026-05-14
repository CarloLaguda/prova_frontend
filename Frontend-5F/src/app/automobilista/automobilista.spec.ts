import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Automobilista } from './automobilista';

describe('Automobilista', () => {
  let component: Automobilista;
  let fixture: ComponentFixture<Automobilista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Automobilista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Automobilista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
