import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntryInfoDialogComponent } from './entry-info-dialog.component';

describe('EntryInfoDialogComponent', () => {
  let component: EntryInfoDialogComponent;
  let fixture: ComponentFixture<EntryInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntryInfoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntryInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
