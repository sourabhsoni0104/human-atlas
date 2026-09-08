import assert from 'node:assert/strict';
import * as THREE from 'three';
import {clampAtlasScale,createAtlasManipulator,normalizeAngle,twoHandScale} from '../app/xr/manipulation.ts';
import {rayFromController} from '../app/xr/input.ts';

assert.equal(clampAtlasScale(.01),.15);
assert.equal(clampAtlasScale(8),3);
assert.equal(twoHandScale(1,1,2),2);
assert.equal(twoHandScale(2,1,2),3);
assert.ok(Math.abs(normalizeAngle(Math.PI*3)-Math.PI)<1e-9);

const controller=new THREE.Object3D();controller.position.set(1,2,3);controller.rotation.y=Math.PI/2;controller.updateMatrixWorld(true);
const ray=rayFromController(controller);assert.deepEqual(ray.origin.toArray(),[1,2,3]);assert.ok(ray.direction.distanceTo(new THREE.Vector3(-1,0,0))<1e-9);

const atlas=new THREE.Group(),left=new THREE.Object3D(),right=new THREE.Object3D(),manipulator=createAtlasManipulator(atlas);
atlas.position.set(0,0,-1.8);left.position.set(-.2,1,-1);left.updateMatrixWorld(true);manipulator.start({index:0,targetRay:left});left.position.x=.1;left.updateMatrixWorld(true);manipulator.update();assert.ok(Math.abs(atlas.position.x-.3)<1e-9);
right.position.set(.3,1,-1);right.updateMatrixWorld(true);manipulator.start({index:1,targetRay:right});right.position.set(.7,1,-1);right.updateMatrixWorld(true);manipulator.update();assert.ok(Math.abs(atlas.scale.x-3)<1e-9);manipulator.clear();

console.log('XR ray conversion, grab translation, rotation math, and scale clamps passed.');
