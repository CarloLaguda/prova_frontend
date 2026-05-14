import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Assicurazione } from './assicurazione';

describe('Assicurazione', () => {
  let component: Assicurazione;
  let fixture: ComponentFixture<Assicurazione>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Assicurazione]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Assicurazione);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
