import { Body, Vec3, World, type BodyType, Box, type Shape, Plane, Material, Quaternion } from 'cannon-es';
import {
    Box3, BoxGeometry, Euler, InstancedBufferGeometry, Mesh, Vector3, type BufferGeometry,
    type Camera, type Group, type Scene, type WebGLRenderer, Material as ThreeMAterial, Box3Helper,
    PlaneHelper, Plane as Tplane,
    type Object3D
} from 'three';
import * as troikaText from 'troika-three-text'
import { ImageAsset } from './asset/image';
import type { GameScene } from './main-scene';
import type { SharedEventMesh, SharedEvents } from './event';
import { cannonSymbol } from './util/collision-mesh';
import { getObjectsWithSymbol } from './util/get-object-with-symbol';
import { InteractionGroup } from './util/interaction-group';
export class InteropWorld extends Mesh {

    world: World;

    static STATIC = Body.STATIC

    static helpers = false


    objects: Map<Mesh, { updatePos: Vector3, body: Body } | "pending"> = new Map()

    meshObjects: Map<Body, Mesh> = new Map()

    constructor(private scene: GameScene) {
        super()
        this.world = new World({
            gravity: new Vec3(0, -9.8, 0), // m/s²
        })
    }


    toVec3(vector: Vector3) {
        return new Vec3(vector.x, vector.y, vector.z)
    }


    private helperObjects: Array<Object3D> = []



    private createShape(mesh: Mesh) {
        const geo = mesh.geometry
        const bufferDim = geo.boundingBox.getSize(new Vector3()).applyEuler(new Euler(-Math.PI / 2, 0, 0));
        return new Box(new Vec3(Math.abs(bufferDim.x) / 2, Math.min(bufferDim.y, 3), Math.abs(bufferDim.y) / 2))





        /*const vertices: Array<number> = [];
 
 
         const faces = [];
 
         const geometry = mesh.geometry; // Assuming you already have a Three.js mesh
         const positions = geometry.attributes["position"].array;
 
         // Loop through the position array to create Cannon.js vertices
         for (let i = 0; i < positions.length; i += 3) {
             const vertex = new Vector3(positions[i], positions[i + 1], positions[i + 2]).toArray();
             vertices.push(...vertex);
         }
 
         // Loop through the geometry's faces (indices) to create Cannon.js faces
         const indices = geometry.index ? geometry.index.array : null; // Check if the geometry has an index array (for indexed geometry)
         if (indices) {
             for (let i = 0; i < indices.length; i += 3) {
                 const a = indices[i];
                 const b = indices[i + 1];
                 const c = indices[i + 2];
 
                 faces.push([a, b, c].reverse());
             }
         } else {
             // For non-indexed geometry, you can generate faces manually (for example, using the geometry's groups or primitives)
             const positions = geometry.attributes["position"].array;
             for (let i = 0; i < positions.length / 9; i++) {
                 faces.push([i * 3, i * 3 + 1, i * 3 + 2]);
             }
         }
 
 
         const shape = new Trimesh(vertices, faces)
         return shape*/
    }



    private addReadyObject(obj: SharedEventMesh, mass: number, type: BodyType = Body.DYNAMIC) {

        const objGeometry = obj.geometry;
        let shape: Shape

        let mat: Material = new Material()
        let pos = obj.position


        if (objGeometry instanceof BoxGeometry) {
            if (type === Body.STATIC) {
                shape = new Plane()
                //pos = obj.position.clone().add(new Vector3(0, 0.05, 0))
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
        } else {
            debugger
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
        this.meshObjects.set(worldBody, obj)
        const children = getObjectsWithSymbol(obj, cannonSymbol.s);

        if (children.length) {




            worldBody.addEventListener('collide', (e) => {
                const original = this.meshObjects.get(e.body)
                const target = this.meshObjects.get(e.target)

                if (original instanceof InteractionGroup && !e.handled && target instanceof InteractionGroup) {
                    original.onCollsion?.({
                        event: e,
                        setHandled() {
                            e.handled = true
                        },
                        group1: original,
                        group2: target
                    })
                }
                /*if (target instanceof InteractionGroup) {
                    target.onCollsion?.(e)
                }*/
            })


            /*  for (const child of children) {
                  if (cannonSymbol.s in child) {
                      const data = getSymbolData(child, cannonSymbol)
                      const childBody = new Body({
                          type: Body.STATIC,
                          shape: this.createShape(child),
                          mass: 1,
  
                      })
                      childBody.collisionResponse = false
                      childBody.collisionFilterGroup = 66
                      childBody.collisionFilterMask = -1
                      this.detectionchildObjects.set(childBody, child)
                      this.world.addBody(childBody)
  
                      const lockConstraint = new LockConstraint(worldBody, childBody);
                      this.world.addConstraint(lockConstraint);
  
                      childBody.addEventListener('collide', (e) => {
  
                          if (childBody.position.isZero()) {
                              return
                          }
                          if (e.body.position.isZero()) {
                              return
                          }
                          const mesh = this.detectionchildObjects.get(e.body)
                          if (mesh && mesh != child && implementsSymbol(mesh, cannonSymbol)) {
                              const data = getSymbolData(mesh, cannonSymbol)
                              data.onCollide?.({
                                  other: getSymbolData(child, cannonSymbol),
  
                              })
                          }
  
  
  
                      });
                  }
              }
  */

        }

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
        } else {
            if (InteropWorld.helpers) {
                //for helper
                this.objects.set(obj, {
                    body: worldBody,
                    updatePos: obj.position.clone()
                })
            }


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

        // console.time("physics")

        const time = Date.now()
        try {
            this.world.fixedStep()
        } catch (e) {
            debugger
        }

        if (Date.now() - time > 1000) {
            debugger
        }
        // console.timeEnd("physics")

        for (let helper of this.helperObjects) {
            helper.removeFromParent()
        }
        this.helperObjects.length = 0

        let changed = false
        for (const [obj, worldObj] of this.objects.entries()) {
            if (worldObj !== "pending") {

                const velocity = worldObj.body.velocity.length();
                if (velocity < 0.01) {
                    worldObj.body.velocity = new Vec3()
                } else if (velocity > 15) {
                    // worldObj.body.velocity.set(0, 0, 0)
                }

                const diff = new Vector3().copy(worldObj.body.position).sub(worldObj.updatePos).length()

                obj.position.copy(worldObj.body.position)
                //obj.scale.copy(new Vector3(1, 1, 1))

                if (diff > 0.2) {
                    changed = true
                    worldObj.updatePos = obj.position.clone()



                }

                if (InteropWorld.helpers) {
                    const physicsObj = worldObj.body.shapes[0]
                    if (physicsObj instanceof Box) {
                        const halfExtents = physicsObj.halfExtents;
                        const size = new Vector3(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2);

                        const b3 = new Box3();
                        b3.setFromCenterAndSize(
                            new Vector3(worldObj.body.position.x, worldObj.body.position.y, worldObj.body.position.z),
                            size
                        );
                        const helper = new Box3Helper(b3);
                        scene.add(helper)
                        this.helperObjects.push(helper)
                    } else if (physicsObj instanceof Plane) {
                        const plane = new Tplane(new Vector3(0, 1, 0), 0); // Default normal pointing up

                        //new Vector3(0, 1, 0), 0
                        const planeHelper = new PlaneHelper(plane, 100000);
                        planeHelper.position.copy(worldObj.body.position);
                        planeHelper.lookAt(new Vector3(worldObj.body.position.clone() as any).add(plane.normal))
                        this.add(planeHelper);
                        this.helperObjects.push(planeHelper)
                    }
                }
                //obj.quaternion.copy(worldObj.quaternion)
            }
        }
        if (changed) {
            this.scene.drawWires()
        }
        if (InteropWorld.helpers) {

            for (const [worldObj, obj] of this.meshObjects.entries()) {



                const b3 = new Box3().setFromObject(obj);
                //obj.updateMatrixWorld(true);

                // const worldPos = obj.getWorldPosition(wPos);
                worldObj.position.copy(this.toVec3(b3.getCenter(new Vector3())))


                /* b3.setFromCenterAndSize(
                     worldPos,
                     new Vector3(2, 2, 2)
                 );*/

                const helper = new Box3Helper(b3);
                scene.add(helper)
                this.helperObjects.push(helper)
            }
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
