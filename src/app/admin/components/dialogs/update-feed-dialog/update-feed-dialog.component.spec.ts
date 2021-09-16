import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateFeedDialogComponent } from './update-feed-dialog.component';

describe('UpdateFeedDialogComponent', () => {
  let component: UpdateFeedDialogComponent;
  let fixture: ComponentFixture<UpdateFeedDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateFeedDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateFeedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
