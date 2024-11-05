import { Body, Vec3, World, type BodyType, Box, type Shape, Plane, Material, Quaternion } from 'cannon-es';
import {
    Box3, BoxGeometry, Euler, InstancedBufferGeometry, Mesh, Vector3, type BufferGeometry,
    type Camera, type Group, type Scene, type WebGLRenderer, Material as ThreeMAterial
} from 'three';
import * as troikaText from 'troika-three-text'
import { ImageAsset } from './asset/image';
import type { GameScene } from './main-scene';
import type { SharedEventMesh, SharedEvents } from './event';
export class InteropWorld extends Mesh {

    world: World;

    static STATIC = Body.STATIC


    objects: Map<Mesh, { updatePos: Vector3, body: Body } | "pending"> = new Map()

    constructor(private scene: GameScene) {
        super()
        this.world = new World({
            gravity: new Vec3(0, -9.8, 0), // m/s²
        })
    }


    toVec3(vector: Vector3) {
        return new Vec3(vector.x, vector.y, vector.z)
    }


    private addReadyObject(obj: SharedEventMesh, mass: number, type: BodyType = Body.DYNAMIC) {

        const objGeometry = obj.geometry;
        let shape: Shape

        let mat: Material = new Material()
        let pos = obj.position


        if (objGeometry instanceof BoxGeometry) {
            if (type === Body.STATIC) {
                shape = new Plane()
                pos = obj.position.clone().add(new Vector3(0, 0.05, 0))
                mat.friction = 1000000
                mat.restitution = -0.00000001

            } else {
                const params = objGeometry.parameters
                shape = new Box(new Vec3(params.width / 2, params.height / 2, params.depth / 2))
            }

        } else if (objGeometry instanceof InstancedBufferGeometry) {
            const geo = obj.geometry
            const bufferDim = geo.boundingBox.getSize(new Vector3()).applyEuler(new Euler(-Math.PI / 2, 0, 0));
            shape = new Box(new Vec3(Math.abs(bufferDim.x) / 2, Math.min(bufferDim.y, 3), Math.abs(bufferDim.y) / 2))
            mass = 0.01
            mat.friction = 10
        }

        mat.restitution = -0.00000001
        const worldBody = new Body({
            type: type,
            shape: shape,
            mass: mass,
            material: mat,
            position: this.toVec3(pos),
            quaternion: new Quaternion().copy(obj.quaternion as any),
            velocity: new Vec3(0, -2, 0),
        });

        if (shape instanceof Plane && type === Body.STATIC) {
            worldBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
        }

        obj.addEventListener("positionupdate", e => {
            worldBody.position.copy(this.toVec3(obj.position))
            worldBody.velocity = new Vec3()
        })
        this.world.addBody(worldBody)

        if (type !== Body.STATIC) {
            this.objects.set(obj, {
                body: worldBody,
                updatePos: obj.position.clone()
            })
        }
    }

    addGravityObject(obj: SharedEventMesh, mass: number, type: BodyType = Body.DYNAMIC) {

        let objGeometry = obj.geometry;

        if (obj instanceof ImageAsset) {
            if (!obj.ready?.resolvedWith) {
                this.objects.set(obj, "pending")
                obj.addEventListener("loadedgeo", e => {
                    if (this.objects.get(obj) === "pending") {
                        this.addReadyObject(obj, mass, type)
                    }
                })
                return
            } else {
                debugger
            }
        } else if (obj instanceof troikaText.Text) {
            if (!obj._textRenderInfo) {
                this.objects.set(obj, "pending")
                obj.addEventListener("synccomplete", e => {
                    if (this.objects.get(obj) === "pending") {
                        this.addReadyObject(obj, mass, type)
                    }
                })
                return
            } else {
                debugger
            }
        } else if (objGeometry instanceof BoxGeometry) {
            this.addReadyObject(obj, mass, type)
        }

    }

    override onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: ThreeMAterial, group: Group): void {
        this.world.fixedStep()


        let changed = false
        for (const [obj, worldObj] of this.objects.entries()) {
            if (worldObj !== "pending") {

                const velocity = worldObj.body.velocity.length();
                if (velocity < 0.01) {
                    worldObj.body.velocity = new Vec3()
                } else if (velocity > 15) {
                    worldObj.body.velocity.set(0, 0, 0)
                }

                const diff = new Vector3().copy(worldObj.body.position).sub(worldObj.updatePos).length()

                obj.position.copy(worldObj.body.position)

                if (diff > 0.2) {
                    changed = true
                    worldObj.updatePos = obj.position.clone()
                }

                //obj.quaternion.copy(worldObj.quaternion)
            }
        }
        if (changed) {
            this.scene.drawWires()
        }


    }


    removeObject(node: Mesh) {
        const obj = this.objects.get(node)
        if (obj === "pending") {
            this.objects.delete(node)
        } else {
            this.world.removeBody(obj.body)
            this.objects.delete(node)
        }
    }
}