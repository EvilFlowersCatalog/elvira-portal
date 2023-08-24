import { Component, Input, OnInit } from '@angular/core'
import { Entry } from 'src/app/types/entry.types';

@Component({
  selector: 'app-swiper',
  templateUrl: './swiper.component.html',
  styleUrls: ['./swiper.component.scss'],
})
export class SwipperComponent implements OnInit {
  selected_index = 0; // Used in html
  @Input() swiper_entries: Entry[]; // Used in html

  ngOnInit(): void {
    this.swiper_entries === undefined ? this.swiper_entries = [] : this.swiper_entries; // Cuz of poping error that, reading lenght of undefined
    this.autoSlideEntries(); // start slider
  }

  selectEntrie(index: number) {
    this.selected_index = index;
  }

  // Automatic slider
  autoSlideEntries(): void {
    setInterval(() => {
      this.nextEntrie();
    }, 5000);
  }

  // Function for changind active entry
  nextEntrie(): void {
    if (this.selected_index === this.swiper_entries.length - 1) {
      this.selected_index = 0
    }
    else {
      this.selected_index++;
    }
  }
}