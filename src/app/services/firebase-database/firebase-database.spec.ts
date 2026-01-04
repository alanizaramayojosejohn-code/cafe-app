import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FirebaseDatabaseService } from './firebase-database';
import { Database } from '@angular/fire/database';

const databaseMock = {};

describe('FirebaseDatabaseService', () => {
  let service: FirebaseDatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FirebaseDatabaseService,
        { provide: Database, useValue: databaseMock }
      ]
    });

    service = TestBed.inject(FirebaseDatabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
