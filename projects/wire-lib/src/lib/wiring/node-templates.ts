import { BatteryUiComponent } from './wiring-ui/battery-ui/battery-ui.component';
import { CapacatorComponent } from './wiring-ui/capacator/capacator.component';
import { Esp32UiComponent } from './wiring-ui/esp32-ui/esp32-ui.component';
import { LedUiComponent } from './wiring-ui/led-ui/led-ui.component';
import { PicoUiComponent } from './wiring-ui/pico-ui/pico-ui.component';
import { RelayUiComponent } from './wiring-ui/relay-ui/relay-ui.component';
import { ResistorUiComponent } from './wiring-ui/resistor-ui/resistor-ui.component';
import { simpleUiComponent } from './wiring-ui/simple-ui/simple-ui.component';
import { SwitchComponent } from './wiring-ui/switch/switch.component';
import { TransformatorUiComponent } from './wiring-ui/transformator-ui/transformator-ui.component';
import type { NodeTemplate } from './wiring.component';
import { Comparator } from './wirings/comparator';
import { NotGate } from './wirings/not';
import { OrGate } from './wirings/or';
import { Transistor } from './wirings/transistor';


const CompUi = simpleUiComponent({
  nodeC: Comparator,
  icon: "|>",
  text: "t:|>",
  connections: [{
    conName: "positive",
    offset: {
      x: -10,
      y: -20
    }
  }, {
    conName: "negative",
    offset: {
      x: -10,
      y: 20
    }
  }, {
    conName: "vOut",
    offset: {
      x: 20,
      y: 0
    }
  }, {
    conName: "vcc",
    offset: {
      x: 8,
      y: -18
    },
    vccToggle: true
  }, {
    conName: "ground",
    offset: {
      x: 8,
      y: 18
    },
    vccToggle: true
  }]
});


const OrUi = simpleUiComponent({
  nodeC: OrGate,
  icon: ">",
  text: "t:>",
  connections: [{
    conName: "inA",
    offset: {
      x: -10,
      y: -20
    }
  }, {
    conName: "inB",
    offset: {
      x: -10,
      y: 20
    }
  }, {
    conName: "out",
    offset: {
      x: 20,
      y: 0
    }
  }, {
    conName: "vcc",
    offset: {
      x: 8,
      y: -18
    },
    vccToggle: true
  }, {
    conName: "gnd",
    offset: {
      x: 8,
      y: 18
    },
    vccToggle: true
  }]
});

const NotUi = simpleUiComponent({
  nodeC: NotGate,
  icon: "!",
  text: "!",
  connections: [{
    conName: "in",
    offset: {
      x: -10,
      y: 0
    }
  }, {
    conName: "inverted_out",
    offset: {
      x: 20,
      y: 0
    }
  }, {
    conName: "vcc",
    offset: {
      x: 8,
      y: -18
    },
    vccToggle: true
  }, {
    conName: "gnd",
    offset: {
      x: 8,
      y: 18
    },
    vccToggle: true
  }]
});


const TransistorUi = simpleUiComponent({
  nodeC: Transistor,
  icon: "keyboard_option_key",
  text: "keyboard_option_key",
  connections: [{
    conName: "base",
    offset: {
      x: 30,
      y: 0
    }
  }, {
    conName: "collector",
    offset: {
      x: 8,
      y: -18
    }
  }, {
    conName: "emitter",
    offset: {
      x: 8,
      y: 18
    }
  }]
});


export const NODE_TEMPLATES = [
  BatteryUiComponent,
  LedUiComponent,
  ResistorUiComponent,
  SwitchComponent,
  RelayUiComponent,
  TransformatorUiComponent,
  PicoUiComponent,
  Esp32UiComponent,
  CapacatorComponent,
  OrUi,
  NotUi,
  CompUi,
  TransistorUi
] satisfies Array<NodeTemplate>;
