import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnioCoins } from './unio-coins';

describe('UnioCoins', () => {
  let component: UnioCoins;
  let fixture: ComponentFixture<UnioCoins>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnioCoins]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnioCoins);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
