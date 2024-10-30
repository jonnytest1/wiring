import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { ConnectionViewComponent, NetDisplayComponent } from './connection-view/connection-view.component';
import { ExamplePickerComponent } from './example-wires/example-picker/example-picker.component';
import { LocalStorageSerialization } from './storage';
import { WiringUiModule } from './wiring-ui/wiring-ui.module';
import { WiringComponent } from './wiring.component';
import { PhaserComponent } from './wiring-ui/phaser/phaser.component';

@NgModule({
  imports: [
    CommonModule, WiringUiModule,
    MatSidenavModule,
    MatSortModule,
    MatIconModule,
    PhaserComponent
  ],
  declarations: [WiringComponent, NetDisplayComponent, ConnectionViewComponent, ExamplePickerComponent],
  exports: [WiringComponent, NetDisplayComponent, ConnectionViewComponent, ExamplePickerComponent],
  providers: [LocalStorageSerialization]
})
export class WiringModule { }