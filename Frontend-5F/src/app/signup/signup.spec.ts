import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Signup } from './signup';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to user role', () => {
    expect(component.role).toBe('user');
  });

  it('should switch roles correctly', () => {
    component.selectRole('perito');
    expect(component.role).toBe('perito');
    component.selectRole('assicuratore');
    expect(component.role).toBe('assicuratore');
    component.selectRole('user');
    expect(component.role).toBe('user');
  });
});
