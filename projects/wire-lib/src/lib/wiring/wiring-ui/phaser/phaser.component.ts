import { Component, Input, OnInit, ViewChild, type AfterViewInit, type ElementRef, type OnChanges, type SimpleChanges } from '@angular/core';
import "phaser"
import { GameScene } from './main-scene';
import type { Battery } from '../../wirings/battery';
import type { NodeEl } from '../../wiring.component';

@Component({
  selector: 'app-phaser',
  templateUrl: './phaser.component.html',
  styleUrls: ['./phaser.component.scss'],
  standalone: true
})
export class PhaserComponent implements OnInit, AfterViewInit {

  @ViewChild("phaser")
  canvasRef: ElementRef<HTMLCanvasElement>


  @Input()
  nodes: Array<NodeEl> = [];

  scaleObject: Phaser.Types.Core.ScaleConfig = {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    //parent: 'thegame',
  }
  gameScene: GameScene;


  constructor() {



  }

  ngAfterViewInit(): void {
    this.gameScene = new GameScene(this.nodes);
    var game = new Phaser.Game({
      type: Phaser.WEBGL,
      canvas: this.canvasRef.nativeElement,
      context: this.canvasRef.nativeElement.getContext("webgl2") as unknown as CanvasRenderingContext2D,
      //transparent: true,
      scale: this.scaleObject,
      backgroundColor: 0x6999c3,
      scene: this.gameScene,
      expandParent: false,
    });
  }

  ngOnInit() {
  }
}
