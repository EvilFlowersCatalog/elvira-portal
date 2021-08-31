import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { FiltersService } from '../../services/filters/filters.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  searchForm: FormGroup;

  constructor(private readonly filtersService: FiltersService) {
    this.searchForm = new FormGroup({ searchInput: new FormControl('') });
  }

  ngOnInit(): void {}

  search() {
    this.filtersService
      .entriesSearch(this.searchForm.value.searchInput)
      .subscribe();
  }
}
