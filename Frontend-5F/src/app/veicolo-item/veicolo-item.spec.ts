import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VeicoloItem } from './veicolo-item';

describe('VeicoloItem', () => {
  let component: VeicoloItem;
  let fixture: ComponentFixture<VeicoloItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VeicoloItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VeicoloItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
