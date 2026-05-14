import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DettaglioSinistroComponent } from './dettagli-sinistro';

describe('DettaglioSinistroComponent', () => {
  let component: DettaglioSinistroComponent;
  let fixture: ComponentFixture<DettaglioSinistroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DettaglioSinistroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DettaglioSinistroComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
