import { Component, inject, Input, OnInit, ViewChild, type AfterViewInit, type ElementRef, type OnChanges, type OnDestroy, type SimpleChanges } from '@angular/core';
import { GameScene } from './main-scene';
import type { NodeEl } from '../../wiring.component';
import { AmbientLight, DirectionalLight, Fog, PCFSoftShadowMap, PerspectiveCamera, SpotLight, SpotLightHelper, Vector3, WebGLRenderer, type Intersection } from 'three';
import { CustomControls } from './controls';
import { Router } from '@angular/router';
import { getFiles, storeFile } from './util/data';
import { rotateDeg } from './util/rotation';
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
  controls: CustomControls;

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
    this.controls = new CustomControls(camera, this.renderer.domElement, this.gameScene);
    this.controls.minDistance = 5;
    this.controls.maxDistance = 600;
    this.controls.maxPolarAngle = Math.PI / 2;

    camera.position.set(0, 140, 20);
    camera.lookAt(0, 0, 0);

    this.controls.target.set(20, 0, 20)

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


    getFiles().then(f => {




      for (let file = 0; file < f.length; file++) {
        const fileMap = {}
        const element = f[file];

        const files: Array<File> = [element]
        if (files) {
          for (let i = 0; i < files.length; i++) {
            const name = files[i].name.split(".")
            const ending = name.pop()

            fileMap[name.join(".")] ??= {}
            fileMap[name.join(".")][ending] = files[i]
            fileMap[name.join(".")][files[i].name] = files[i]
          }

        }
        this.gameScene.addModel(fileMap, { point: new Vector3(0, 15 + (file * 10), 0) } as Intersection).then(m => {
          if (file == 1) {
            rotateDeg(m.object, -90)
            m.object.position.add(new Vector3(-40, 0, -34))
            m.object.dispatchEvent({ type: "positionupdate" })
          }
        })
      }



    })




    const animate = () => {
      this.renderer.render(this.gameScene, camera);

    }
    this.renderer.setAnimationLoop(animate);
  }

  ngOnInit() {
  }
  drop(ev: DragEvent) {
    ev.preventDefault()
    const files = ev.dataTransfer?.files;

    const fileMap = {}


    if (files) {
      for (let i = 0; i < files.length; i++) {
        const name = files[i].name.split(".")
        const ending = name.pop()

        fileMap[name.join(".")] ??= {}
        fileMap[name.join(".")][ending] = files[i]
        fileMap[name.join(".")][files[i].name] = files[i]
      }

    }

    storeFile(files[0]);



    const intersect = this.controls.raycastEvent(ev)
    this.gameScene.addModel(fileMap, intersect[0])
  }
  ngOnDestroy(): void {

    this.renderer.setAnimationLoop(null)
  }
}
