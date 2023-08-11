import { Component, Input, OnInit} from '@angular/core'
import { EntriesItem } from '../../types/library.types'

@Component({
    selector: 'app-swiper',
    templateUrl: './swiper.component.html',
    styleUrls: ['./swiper.component.scss'],
})
export class SwipperComponent implements OnInit {
    selectedIndex = 0;
    @Input() swiperEntries: EntriesItem[];

    ngOnInit(): void {
        this.swiperEntries === undefined ? this.swiperEntries = [] : this.swiperEntries;
        this.autoSlideEntries();
    }

    selectEntrie(index: number) {
        this.selectedIndex = index;
    }

    autoSlideEntries(): void {
        setInterval(() => {
            this.nextEntrie();
        }, 5000);
    }

    nextEntrie(): void {
        if(this.selectedIndex === this.swiperEntries.length -1) {
            this.selectedIndex = 0
        }
        else {
            this.selectedIndex++;
        }
    }
}