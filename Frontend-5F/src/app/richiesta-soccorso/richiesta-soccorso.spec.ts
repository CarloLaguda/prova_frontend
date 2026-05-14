import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RichiestaSoccorso } from './richiesta-soccorso';

describe('RichiestaSoccorso', () => {
  let component: RichiestaSoccorso;
  let fixture: ComponentFixture<RichiestaSoccorso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RichiestaSoccorso]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RichiestaSoccorso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
