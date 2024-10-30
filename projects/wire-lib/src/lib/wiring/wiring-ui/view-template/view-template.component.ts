import { ChangeDetectorRef, Component, ComponentRef, Input, OnInit, TemplateRef, ViewChild, ViewContainerRef, type OnDestroy } from '@angular/core';

@Component({
    selector: 'app-view-template',
    templateUrl: './view-template.component.html',
    styleUrls: ['./view-template.component.less']
})
export class ViewTemplateComponent implements OnInit, OnDestroy {

    @ViewChild('dynamic', {
        read: ViewContainerRef
    })
    viewContainerRef: ViewContainerRef

    @ViewChild('dynamic') templateRef: TemplateRef<any>

    @Input()
    addingData: ComponentRef<any>

    constructor(private cdr: ChangeDetectorRef) { }


    ngOnInit() {
    }

    ngAfterViewInit() {
        this.viewContainerRef.insert(this.addingData.hostView)
        this.addingData.hostView.markForCheck()
        this.cdr.markForCheck()
    }
    ngOnDestroy(): void {
        // this.addingData.hostView.destroy()
    }
}
