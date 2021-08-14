import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedsOverviewComponent } from './feeds-overview.component';

describe('FeedsOverviewComponent', () => {
  let component: FeedsOverviewComponent;
  let fixture: ComponentFixture<FeedsOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FeedsOverviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedsOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
