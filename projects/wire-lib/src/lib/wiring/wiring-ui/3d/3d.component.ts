import { Component, inject, Input, OnInit, ViewChild, type AfterViewInit, type ElementRef, type OnChanges, type OnDestroy, type SimpleChanges } from '@angular/core';
import { GameScene } from './main-scene';
import type { NodeEl } from '../../wiring.component';
import { AmbientLight, DirectionalLight, Fog, PCFSoftShadowMap, PerspectiveCamera, SpotLight, SpotLightHelper, WebGLRenderer } from 'three';
import { CustomControls } from './controls';
import { Router } from '@angular/router';
@Component({
  selector: 'app-3d',
  templateUrl: './3d.component.html',
  styleUrls: ['./3d.component.scss'],
  standalone: true
})
export class PhaserComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild("displaycanvas")
  canvasRef: ElementRef<HTMLCanvasElement>


  @Input()
  nodes: Array<NodeEl> = [];

  /* scaleObject: Phaser.Types.Core.ScaleConfig = {
     mode: Phaser.Scale.FIT,
     autoCenter: Phaser.Scale.CENTER_BOTH,
     //parent: 'thegame',
   }*/
  gameScene: GameScene;

  destroyed = false
  renderer: any;


  router = inject(Router)

  constructor() {



  }


  ngAfterViewInit(): void {



    this.gameScene = new GameScene(this.nodes);
    this.gameScene.context = {
      router: this.router
    }
    const bounds = this.canvasRef.nativeElement.getBoundingClientRect()

    //const width: number = this.game.config.width as number;
    //const height: number = this.game.config.height as number;
    // create the renderer
    this.renderer = new WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      context: this.canvasRef.nativeElement.getContext("webgl2") as WebGLRenderingContext,
      antialias: true
    });
    //renderer.autoClear = true;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio * 5)
    // add a camera
    const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    const controls = new CustomControls(camera, this.renderer.domElement, this.gameScene);
    controls.minDistance = 5;
    controls.maxDistance = 600;
    controls.maxPolarAngle = Math.PI / 2;

    camera.position.set(20, 140, 20);
    camera.lookAt(20, 0, 20);

    controls.target.set(20, 0, 20)

    // add an ambient light
    const ambientLight: AmbientLight = new AmbientLight(0xffffff, 1);
    this.gameScene.add(ambientLight);

    // add a directional light
    /* const directionalLight: DirectionalLight = new DirectionalLight(0xffffff, 0.5);
     directionalLight.castShadow = true;
     directionalLight.position.set(270, 200, 0);
     directionalLight.target.position.set(270, 100, -1000);
     this.gameScene.add(directionalLight);
     this.gameScene.add(directionalLight.target)*/

    // add a spotlight
    /* const spotLight: SpotLight = new SpotLight(0xffffff, 0.2, 0, 0.4, 0.5, 0.1);
     spotLight.position.set(270, 1000, 0);
     spotLight.castShadow = true;
     spotLight.shadow.mapSize.width = 1024;
     spotLight.shadow.mapSize.height = 1024;
     spotLight.shadow.camera.near = 1;
     spotLight.shadow.camera.far = 10000;
     spotLight.shadow.camera.fov = 80;
     spotLight.target.position.set(270, 0, -320);
     this.gameScene.add(spotLight);
     this.gameScene.add(spotLight.target);*/

    // add a fog effect
    //const fog: Fog = new Fog(0x011025, 500, 2000);
    // this.gameScene.fog = fog;


    const animate = () => {
      this.renderer.render(this.gameScene, camera);

    }
    this.renderer.setAnimationLoop(animate);
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {

    this.renderer.setAnimationLoop(null)
  }
}
