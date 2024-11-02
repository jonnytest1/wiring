import type { OnInit } from '@angular/core';
import { Component, Injector } from '@angular/core';
import { Resistor } from '../../wirings/resistor';
import { UINode } from '../ui-node';
import type { CustomControls } from '../custom-controls';

@Component({
  selector: 'app-resistor-ui',
  templateUrl: './resistor-ui.component.html',
  styleUrls: ['./resistor-ui.component.less']
})
export class ResistorUiComponent extends UINode<Resistor> implements OnInit {

  override factory() {
    return Resistor;
  };

  public static templateIcon = "insights"

  getIcon(): string {
    return `assets/icons/resistor-svgrepo-com.svg`
  }
  controls: CustomControls;
  constructor(injector: Injector) {
    super(new Resistor(30), injector)

  }

  ngOnInit() {
    if ("getCustomControls" in window) {
      this.controls = window.getCustomControls()

      const url = new URL(location.href)

      for (const key in this.controls) {
        const prebound = url.searchParams.get(`bound${key}${this.node.nodeUuid}`)
        if (prebound === "resistance") {
          const controlsFnc = this.controls[key]
          Object.defineProperty(this.node, "resistance", {
            get: () => {
              return controlsFnc()
            },
            set() {
              debugger
            }
          })
        }
      }
    }

  }

  setResistance(input: HTMLInputElement) {
    this.node.resistance = +input.value
  }

  bindControl(controlskey: string, controlType: string) {
    if (controlType == "resistance") {
      const controlsFnc = this.controls[controlskey]
      Object.defineProperty(this.node, "resistance", {
        get: () => {
          return controlsFnc()
        },
        set() {
          debugger
        }
      })
    } else {
      debugger
    }
  }

}
