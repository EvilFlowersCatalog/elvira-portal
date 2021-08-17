import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EntriesItem,
  ListEntriesResponse,
} from '../../services/entries/entries.types';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
})
export class FavoritesComponent implements OnInit {
  entriesResponse$: Observable<ListEntriesResponse>;
  entries: EntriesItem[];

  constructor() {}

  ngOnInit(): void {}
}
