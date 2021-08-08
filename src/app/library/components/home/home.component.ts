import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { State } from 'src/app/common/services/app-state/app-state.types';
import { EntriesService } from '../../services/entries/entries.service';
import { EntriesItem } from '../../services/entries/entries.types';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends DisposableComponent implements OnInit {
  sidebarState$: Observable<boolean>;
  entries$: Observable<EntriesItem[]>;

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

    this.entries$ = this.entriesService.listEntries();
  }

  ngOnDestroy(): void {
    this.appStateService.patchState({ showSidebarToggle: false });
  }

  hideSidebar() {
    this.appStateService.patchState({ sidebar: false });
  }
}
