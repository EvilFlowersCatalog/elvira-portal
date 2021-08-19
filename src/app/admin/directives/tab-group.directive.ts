import { AfterContentInit, ContentChildren, Directive, HostListener, QueryList } from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';

@Directive({
    selector: '[elTabGroup]',
})
export class TabGroupDirective extends DisposableComponent implements AfterContentInit {
    @ContentChildren(MatTab) tabs: QueryList<MatTab>;
    @HostListener('selectedIndexChange', ['$event']) onMouseEnter(event: number) {
        this.onIndexChanged(event);
    }

    constructor(protected matTabGroup: MatTabGroup, protected router: Router, protected route: ActivatedRoute) {
        super();
    }

    ngAfterContentInit() {
        this.route.queryParams.pipe(takeUntil(this.destroySignal$)).subscribe(({ index }) => {
            index = index ?? 0;
            index = index >= this.tabs.length ? 0 : index;
            this.router.navigate([], { queryParams: { index } });
            this.matTabGroup.selectedIndex = index;
        });
    }

    private onIndexChanged(index: number) {
        this.router.navigate([], { queryParams: { index } });
    }
}
