import { AfterContentChecked, ComponentRef, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectorRef, Component, ViewChild, ViewContainerRef } from '@angular/core';
import { LocalStorageSerialization } from './storage';
import { Vector2 } from './util/vector';
import { BatteryUiComponent } from './wiring-ui/battery-ui/battery-ui.component';
import type { UINode } from './wiring-ui/ui-node';
import { WiringDataService } from './wiring.service';
import type { Battery } from './wirings/battery';
import type { StrucureReturn } from './wirings/control-collection.a';
import type { LED } from './wirings/led';
import type { Resistor } from './wirings/resistor';
import type { Switch } from './wirings/switch';
import { Wire } from './wirings/wire';
import { NODE_TEMPLATES } from './node-templates';
import { createStateMachine } from '../utils/state-machine';
import { CircuitSolver } from './wirings/computation/circuit-solver';
import { Time } from './wirings/units/time';

export interface NodeTemplate {

  new(...args): UINode;
  templateIcon: string;

}

export interface NodeEl {
  componentRef: ComponentRef<UINode>;
  uiInstance: UINode;

}

@Component({
  selector: 'app-wiring',
  templateUrl: './wiring.component.html',
  styleUrls: ['./wiring.component.scss']
})
export class WiringComponent implements OnInit, AfterContentChecked, OnDestroy {

  batteries: Battery[];
  solver: CircuitSolver;


  lastTime: number;
  interval: NodeJS.Timeout;
  switch: Switch;
  led: LED;
  resist: Resistor;

  dataStructures: Array<StrucureReturn> = [];

  wirePositions: Array<{ positions: Array<Vector2>, wire: Wire }> = [];

  nodeTemplates: Array<NodeTemplate> = NODE_TEMPLATES;


  nodes: Array<NodeEl> = [];
  currentWireCache: string;


  @ViewChild("sidenavcontent", { read: ElementRef })
  sidenavcontent: ElementRef<HTMLElement>

  @ViewChild("viewinsert", { read: ViewContainerRef })
  viewinsert


  engineMode = false


  states = createStateMachine("default", "rotation").withData<{
    rotation: {
      start: Vector2
      startrotation: number
      node: UINode
    }
  }>()

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly viewRef: ViewContainerRef,
    public data: WiringDataService,
    public serialize: LocalStorageSerialization) {

    this.batteries = [];



    const structureCache = []

    const url = new URL(location.href)
    this.engineMode = url.searchParams?.has("3d")

    const example = url.searchParams.get("template")

    if (example) {
      this.serialize.load({
        remote: true,
        viewRef: () => this.viewinsert,
        displayNodes: this.nodes,
        injectorFactory: () => this.viewRef.injector,
        templateName: example
      }).then(bats => {
        this.batteries.push(...bats)

        this.solver = new CircuitSolver(...this.batteries)

        if (url.searchParams.has("enablebatteries")) {
          bats.forEach(bat => {
            bat.enabled = true
          })
        }
      })
    }

    this.interval = setInterval(() => {
      this.cdr.markForCheck();

      // TODO: structures
      /*this.batteries.forEach((battery, i) => {

        debugger
        const structreArray = battery.getStructure();

        const structCache = JSON.stringify(structreArray);

        if (!this.dataStructures[i] || structureCache[i] !== structCache) {
          this.dataStructures[i] = structreArray;
          structureCache[i] = structCache
        }

      });*/

      const positinons = this.getWirePositions();
      const cachePos = JSON.stringify(positinons.map(pos => ({ ...pos, wire: null })))

      if (this.currentWireCache !== cachePos) {
        this.wirePositions = positinons;
        this.currentWireCache = cachePos
      }
    }, 100);

    this.preloadImages();

    this.data.wireChange.subscribe(() => {
      this.solver?.invalidate()
    })
  }
  preloadImages() {
    for (const image of ['assets/icons/relay_right.png', 'assets/icons/pipico.png']) {
      const img = new Image();
      img.src = image;
    }
  }

  storeToLocal() {
    this.serialize.storeToLocal(this.batteries);
  }
  async load(remote = false) {

    this.batteries.push(...await this.serialize.load({
      remote: remote,
      viewRef: () => this.viewinsert,
      displayNodes: this.nodes,
      injectorFactory: () => this.viewRef.injector,
    }));
  }

  getWires(): Set<Wire> {
    const wires = new Set<Wire>();
    this.nodes.forEach(node => {
      const nodeWires = node.uiInstance.getWires();
      nodeWires.forEach(wire => {
        wires.add(wire);
      });
    });
    return wires;
  }

  getWirePositions() {
    const wireList = this.getWires();

    return [...wireList].map(wire => {

      const scrollOFfset = new Vector2(this.sidenavcontent.nativeElement.scrollLeft, this.sidenavcontent.nativeElement.scrollTop)
      const positions = wire.connections.map(c => {
        const connectionParent = c?.parent;
        const pos = connectionParent?.uiNode?.getInOutComponent(c?.id)?.getVector(c);
        if (!pos) {
          return undefined
        }
        return pos.added(scrollOFfset)
      })
        .filter(v => !!v)

      return {
        positions: positions,
        wire: wire
      }

    });
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  getRemainingBattery(bat: Battery) {
    return bat.remainingCharge.coulomb;
  }

  dragMove(event: MouseEvent) {
    if (this.data.currentWire) {
      const position = new Vector2(event).dividedBy(10).rounded().multipliedBy(10);
      this.data.currentWire = { ...this.data.currentWire, to: position };
    } else if (this.data.editingWire) {
      const position = new Vector2(event).dividedBy(10).rounded().multipliedBy(10);
      this.data.editingWire = { ...this.data.editingWire, toPosition: position };
    } else if (this.data.draggedNode) {
      const node = this.data.draggedNode
      //this.updatePosition(node, event);
    }
    // this.wirePositions = this.getWirePositions()
    this.wirePositions = this.getWirePositions();
  }

  getTypeName(template: NodeTemplate) {
    return template.prototype.factory().typeName
  }

  updatePosition(node: NodeEl, event: MouseEvent) {

    node.uiInstance.setPosition(new Vector2(event).dividedBy(10).rounded().multipliedBy(10));
    this.wirePositions = this.getWirePositions();

  }
  startDragNode(node: NodeEl, evt: DragEvent) {
    this.data.draggedNode = node
  }





  dropped(el: DragEvent, nodeTemplate: NodeTemplate) {

    const position = new Vector2({ x: el.x, y: el.y }).dividedBy(10).rounded().multipliedBy(10);
    const newNode = this.viewRef.createComponent(nodeTemplate, {
      injector: this.viewRef.injector
    });
    if (newNode.instance instanceof BatteryUiComponent) {
      this.batteries.push(newNode.instance.node);

      this.refreshSolver();
    }
    newNode.instance.setPosition(position);

    this.nodes.push({
      componentRef: newNode,
      uiInstance: newNode.instance,
    });
    this.solver.invalidate()
    this.cdr.markForCheck();
  }

  private refreshSolver() {
    this.solver = new CircuitSolver(...this.batteries.map(bat => ({
      source: bat,
      ground: bat.inC,
      breakOnInvalid: false
    })));
  }

  ngAfterContentChecked(): void {
    const now = Date.now();
    if (!this.lastTime) {
      this.lastTime = now;
      return;
    }
    const delta = now - this.lastTime;
    this.lastTime = now;
    this.solver?.invalidate()
    this.solver?.check(new Time(delta / 1000))
  }

  ngOnInit() {
  }




  rotationStart($event: MouseEvent, uiNode: UINode) {
    this.states.setrotation({
      start: new Vector2($event),
      startrotation: uiNode.getRotation() ?? 0,
      node: uiNode
    })
  }

  mousemove($event: MouseEvent) {
    if (this.states.isrotation) {
      const movement = new Vector2($event).subtract(this.states.getrotation.start)

      let negative = false
      if (movement.x < 0) {
        negative = true
      }


      let length = movement.length();
      if (negative) {
        length *= -1
      }
      this.states.getrotation.node.setRotation(this.states.getrotation.startrotation + length)
    }
  }

}
