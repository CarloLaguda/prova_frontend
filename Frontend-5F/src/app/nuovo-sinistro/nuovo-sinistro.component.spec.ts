import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NuovoSinistroComponent } from './nuovo-sinistro.component';

describe('NuovoSinistroComponent', () => {
  let component: NuovoSinistroComponent;
  let fixture: ComponentFixture<NuovoSinistroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuovoSinistroComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NuovoSinistroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
