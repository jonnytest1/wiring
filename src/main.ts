import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WiringModule, WiringComponent, templateService, examples } from "wire-lib"

@NgModule({
  declarations: [

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatIconModule,
    WiringModule
  ], exports: [
    WiringModule
  ],
  providers: [{
    provide: templateService,
    useValue: () => {
      return Promise.resolve(examples)
    }
  }],
  bootstrap: [WiringComponent]
})
export class RootMOdule { }



platformBrowserDynamic().bootstrapModule(RootMOdule, {

})
  .catch(err => console.error(err));
