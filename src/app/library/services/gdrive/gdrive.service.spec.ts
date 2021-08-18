import { TestBed } from '@angular/core/testing';

import { GdriveService } from './gdrive.service';

describe('GdriveService', () => {
  let service: GdriveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GdriveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
