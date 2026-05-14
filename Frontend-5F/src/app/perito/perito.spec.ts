import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Perito } from './perito';

describe('Perito', () => {
  let component: Perito;
  let fixture: ComponentFixture<Perito>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Perito]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Perito);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
