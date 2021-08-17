import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewFeedDialogComponent } from './new-feed-dialog.component';

describe('NewFeedDialogComponent', () => {
  let component: NewFeedDialogComponent;
  let fixture: ComponentFixture<NewFeedDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewFeedDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewFeedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
