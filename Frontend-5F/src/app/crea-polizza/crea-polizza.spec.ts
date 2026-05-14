import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreaPolizza } from './crea-polizza';

describe('CreaPolizza', () => {
  let component: CreaPolizza;
  let fixture: ComponentFixture<CreaPolizza>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreaPolizza]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreaPolizza);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
