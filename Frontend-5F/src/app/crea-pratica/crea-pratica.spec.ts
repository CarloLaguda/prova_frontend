import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreaPratica } from './crea-pratica';

describe('CreaPratica', () => {
  let component: CreaPratica;
  let fixture: ComponentFixture<CreaPratica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreaPratica]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreaPratica);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
