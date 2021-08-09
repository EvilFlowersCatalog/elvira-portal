import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { State } from 'src/app/common/services/app-state/app-state.types';
import { EntriesService } from '../../services/entries/entries.service';
import {
  EntriesItem,
  ListEntriesResponse,
} from '../../services/entries/entries.types';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends DisposableComponent implements OnInit {
  sidebarState$: Observable<boolean>;
  entriesResponse$: Observable<ListEntriesResponse>;
  entries: EntriesItem[];

  constructor(
    private readonly appStateService: AppStateService,
    private readonly entriesService: EntriesService
  ) {
    super();
  }

  ngOnInit(): void {
    this.appStateService.patchState({ showSidebarToggle: true });
    window.onbeforeunload = () => this.ngOnDestroy();
    this.sidebarState$ = this.appStateService.getState$().pipe(
      takeUntil(this.destroySignal$),
      map((data: State) => data.sidebar)
    );

    this.entriesService
      .listEntries()
      .subscribe((data) => (this.entries = data.items));
  }

  ngOnDestroy(): void {
    this.appStateService.patchState({ showSidebarToggle: false });
  }

  hideSidebar() {
    this.appStateService.patchState({ sidebar: false });
  }
}
