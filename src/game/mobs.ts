import * as THREE from 'three';
import { MobEntity, MobType } from '../types';
import { VoxelWorld } from './world';
import { soundManager } from './audio';
import { isVipActive } from '../utils/googleAuth';

export class MobManager {
  public mobs: MobEntity[] = [];
  public mobMeshes: Map<string, THREE.Group> = new Map();
  public difficulty: 'peaceful' | 'easy' | 'normal' = 'normal';
  public isPaused: boolean = false;

  private skeletonMat = new THREE.MeshLambertMaterial({ color: 0xd6d6d6 });
  private skeletonEyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  private rabbitMat = new THREE.MeshLambertMaterial({ color: 0xc49a6c });
  private rabbitEarsMat = new THREE.MeshLambertMaterial({ color: 0xffb6c1 });
  private rabbitEyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  private hurtMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });

  // Villager materials
  private villagerSkinMat = new THREE.MeshLambertMaterial({ color: 0xbd886c });
  private villagerRobeMat = new THREE.MeshLambertMaterial({ color: 0x5c3d23 }); // Brown robe
  private villagerNoseMat = new THREE.MeshLambertMaterial({ color: 0xa87459 });
  private villagerEyeMat = new THREE.MeshBasicMaterial({ color: 0x2e7d32 }); // Green eyes
  private villagerWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  private villagerFarmerHatMat = new THREE.MeshLambertMaterial({ color: 0xd4af37 }); // Straw hat
  private villagerLibrarianMat = new THREE.MeshLambertMaterial({ color: 0xc0392b }); // Red hat/collar
  private villagerSmithMat = new THREE.MeshLambertMaterial({ color: 0x212121 }); // Black apron

  // Creeper, Zombie, Animal materials
  private creeperMat = new THREE.MeshLambertMaterial({ color: 0x43a047 });
  private creeperFaceMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  private zombieSkinMat = new THREE.MeshLambertMaterial({ color: 0x558b2f });
  private zombieShirtMat = new THREE.MeshLambertMaterial({ color: 0x00838f });
  private zombiePantsMat = new THREE.MeshLambertMaterial({ color: 0x1a237e });
  private pigMat = new THREE.MeshLambertMaterial({ color: 0xf48fb1 });
  private pigSnoutMat = new THREE.MeshLambertMaterial({ color: 0xf06292 });
  private cowMat = new THREE.MeshLambertMaterial({ color: 0x4e342e });
  private cowWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  private cowHornMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8 });

  // New Mobs: Sheep, Chicken, Wolf, Spider, Enderman, Iron Golem
  private sheepWoolMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
  private sheepSkinMat = new THREE.MeshLambertMaterial({ color: 0xe6c8a8 });
  private chickenWhiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  private chickenBeakMat = new THREE.MeshLambertMaterial({ color: 0xffa726 });
  private chickenWattleMat = new THREE.MeshLambertMaterial({ color: 0xe53935 });
  private wolfFurMat = new THREE.MeshLambertMaterial({ color: 0xbdbdbd });
  private wolfLightMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
  private wolfDarkMat = new THREE.MeshLambertMaterial({ color: 0x424242 });
  private spiderBodyMat = new THREE.MeshLambertMaterial({ color: 0x262121 });
  private spiderEyeMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
  private endermanMat = new THREE.MeshLambertMaterial({ color: 0x111116 });
  private endermanEyeMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });
  private golemIronMat = new THREE.MeshLambertMaterial({ color: 0xd7d7d2 });
  private golemVineMat = new THREE.MeshLambertMaterial({ color: 0x388e3c });
  private golemEyeMat = new THREE.MeshBasicMaterial({ color: 0xd50000 });

  // Seraphim Boss materials
  private seraphimRobeMat = new THREE.MeshLambertMaterial({ color: 0xfffcf0, emissive: 0xffe57f, emissiveIntensity: 0.25 });
  private seraphimGoldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.7, emissive: 0xffaa00, emissiveIntensity: 0.35 });
  private seraphimWingMat = new THREE.MeshLambertMaterial({ color: 0xfffde7, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  private seraphimFieryWingMat = new THREE.MeshStandardMaterial({ color: 0xff7043, roughness: 0.3, emissive: 0xff3d00, emissiveIntensity: 0.6, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
  private seraphimFireMat = new THREE.MeshBasicMaterial({ color: 0xff3d00 });
  private seraphimEyeMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
  private seraphimEyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xfff9c4 });
  private seraphimWheelMat = new THREE.MeshStandardMaterial({ color: 0xffa000, metalness: 0.8, roughness: 0.2, emissive: 0xff6f00, emissiveIntensity: 0.5 });
  private seraphimHaloMat = new THREE.MeshBasicMaterial({ color: 0xffd740 });
  private seraphimBladeMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
  private seraphimPortraitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });

  public onSeraphimDefeated?: () => void;
  public seraphimProjectiles: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[] = [];
  private projectileGeom = new THREE.SphereGeometry(0.35, 8, 8);
  private projectileMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });

  private creeperFuseState: Map<string, { timer: number; hissed: boolean }> = new Map();

  private nextMobId: number = 1;
  private spawnTimer: number = 0;

  constructor(private scene: THREE.Scene, private world: VoxelWorld) {
    // Load Seraphim Boss portrait art & 3D texture mapping
    const texLoader = new THREE.TextureLoader();
    texLoader.load('/biblical_seraphim.jpg', (tex) => {
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      this.seraphimPortraitMat.map = tex;
      this.seraphimPortraitMat.needsUpdate = true;
      this.seraphimFieryWingMat.map = tex;
      this.seraphimFieryWingMat.needsUpdate = true;
      this.seraphimWingMat.map = tex;
      this.seraphimWingMat.needsUpdate = true;
      this.seraphimWheelMat.map = tex;
      this.seraphimWheelMat.needsUpdate = true;
    });

    // Pre-spawn some friendly rabbits and an initial night guard
    this.spawnInitialMobs();
  }

  private spawnInitialMobs() {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 15;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = this.findSurfaceY(x, z);
      this.createMob('rabbit', x, y, z);
    }
  }

  private findSurfaceY(x: number, z: number): number {
    for (let y = this.world.worldHeight; y >= 0; y--) {
      if (this.world.getBlock(x, y, z) !== 'air') {
        return y + 1;
      }
    }
    return 10;
  }

  private buildSkeletonMesh(): THREE.Group {
    const group = new THREE.Group();

    // 1. Head (0.5 x 0.5 x 0.5)
    const headGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeom, this.skeletonMat);
    head.position.y = 1.65;
    head.name = 'head';

    // Eyes
    const eyeGeom = new THREE.BoxGeometry(0.1, 0.08, 0.05);
    const eyeL = new THREE.Mesh(eyeGeom, this.skeletonEyeMat);
    eyeL.position.set(-0.12, 0.05, 0.25);
    head.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, this.skeletonEyeMat);
    eyeR.position.set(0.12, 0.05, 0.25);
    head.add(eyeR);

    // Mouth slit
    const mouthGeom = new THREE.BoxGeometry(0.24, 0.06, 0.05);
    const mouth = new THREE.Mesh(mouthGeom, this.skeletonEyeMat);
    mouth.position.set(0, -0.12, 0.25);
    head.add(mouth);

    group.add(head);

    // 2. Body / Ribcage
    const bodyGeom = new THREE.BoxGeometry(0.5, 0.65, 0.25);
    const body = new THREE.Mesh(bodyGeom, this.skeletonMat);
    body.position.y = 1.05;
    body.name = 'body';
    group.add(body);

    // 3. Arms
    const armGeom = new THREE.BoxGeometry(0.14, 0.65, 0.14);
    const leftArm = new THREE.Mesh(armGeom, this.skeletonMat);
    leftArm.position.set(-0.35, 1.05, 0.15);
    leftArm.rotation.x = -Math.PI / 3; // outstretched spooky arms
    leftArm.name = 'arm_l';
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeom, this.skeletonMat);
    rightArm.position.set(0.35, 1.05, 0.15);
    rightArm.rotation.x = -Math.PI / 3;
    rightArm.name = 'arm_r';
    group.add(rightArm);

    // 4. Legs
    const legGeom = new THREE.BoxGeometry(0.14, 0.72, 0.14);
    const leftLeg = new THREE.Mesh(legGeom, this.skeletonMat);
    leftLeg.position.set(-0.14, 0.36, 0);
    leftLeg.name = 'leg_l';
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeom, this.skeletonMat);
    rightLeg.position.set(0.14, 0.36, 0);
    rightLeg.name = 'leg_r';
    group.add(rightLeg);

    return group;
  }

  private buildRabbitMesh(): THREE.Group {
    const group = new THREE.Group();

    // Body
    const bodyGeom = new THREE.BoxGeometry(0.35, 0.3, 0.45);
    const body = new THREE.Mesh(bodyGeom, this.rabbitMat);
    body.position.y = 0.22;
    body.name = 'body';
    group.add(body);

    // Head
    const headGeom = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    const head = new THREE.Mesh(headGeom, this.rabbitMat);
    head.position.set(0, 0.35, 0.22);
    head.name = 'head';

    // Eyes
    const eyeGeom = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    const eyeL = new THREE.Mesh(eyeGeom, this.rabbitEyeMat);
    eyeL.position.set(-0.13, 0.03, 0.04);
    head.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, this.rabbitEyeMat);
    eyeR.position.set(0.13, 0.03, 0.04);
    head.add(eyeR);

    // Long Ears
    const earGeom = new THREE.BoxGeometry(0.06, 0.24, 0.04);
    const earL = new THREE.Mesh(earGeom, this.rabbitEarsMat);
    earL.position.set(-0.07, 0.2, -0.04);
    earL.rotation.x = -0.15;
    head.add(earL);

    const earR = new THREE.Mesh(earGeom, this.rabbitEarsMat);
    earR.position.set(0.07, 0.2, -0.04);
    earR.rotation.x = -0.15;
    head.add(earR);

    group.add(head);

    // Little tail
    const tailGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const tail = new THREE.Mesh(tailGeom, this.rabbitMat);
    tail.position.set(0, 0.25, -0.25);
    group.add(tail);

    // Paws
    const pawGeom = new THREE.BoxGeometry(0.08, 0.12, 0.12);
    const pawFL = new THREE.Mesh(pawGeom, this.rabbitMat);
    pawFL.position.set(-0.12, 0.06, 0.14);
    pawFL.name = 'paw_fl';
    group.add(pawFL);

    const pawFR = new THREE.Mesh(pawGeom, this.rabbitMat);
    pawFR.position.set(0.12, 0.06, 0.14);
    pawFR.name = 'paw_fr';
    group.add(pawFR);

    const pawBL = new THREE.Mesh(pawGeom, this.rabbitMat);
    pawBL.position.set(-0.13, 0.06, -0.14);
    pawBL.name = 'paw_bl';
    group.add(pawBL);

    const pawBR = new THREE.Mesh(pawGeom, this.rabbitMat);
    pawBR.position.set(0.13, 0.06, -0.14);
    pawBR.name = 'paw_br';
    group.add(pawBR);

    return group;
  }

  private buildVillagerMesh(profession: 'farmer' | 'librarian' | 'weaponsmith' | 'cleric' = 'farmer'): THREE.Group {
    const group = new THREE.Group();

    // 1. Head (0.5 x 0.62 x 0.5)
    const headGeom = new THREE.BoxGeometry(0.5, 0.62, 0.5);
    const head = new THREE.Mesh(headGeom, this.villagerSkinMat);
    head.position.y = 1.7;
    head.name = 'head';

    // Iconic Villager Nose (0.12 x 0.28 x 0.16)
    const noseGeom = new THREE.BoxGeometry(0.12, 0.28, 0.16);
    const nose = new THREE.Mesh(noseGeom, this.villagerNoseMat);
    nose.position.set(0, -0.08, 0.32);
    head.add(nose);

    // Green Villager Eyes with white sclera
    const eyeWhiteGeom = new THREE.BoxGeometry(0.12, 0.08, 0.04);
    const eyeGreenGeom = new THREE.BoxGeometry(0.06, 0.08, 0.05);

    const eyeLWhite = new THREE.Mesh(eyeWhiteGeom, this.villagerWhiteMat);
    eyeLWhite.position.set(-0.13, 0.06, 0.25);
    head.add(eyeLWhite);
    const eyeL = new THREE.Mesh(eyeGreenGeom, this.villagerEyeMat);
    eyeL.position.set(-0.11, 0.06, 0.26);
    head.add(eyeL);

    const eyeRWhite = new THREE.Mesh(eyeWhiteGeom, this.villagerWhiteMat);
    eyeRWhite.position.set(0.13, 0.06, 0.25);
    head.add(eyeRWhite);
    const eyeR = new THREE.Mesh(eyeGreenGeom, this.villagerEyeMat);
    eyeR.position.set(0.11, 0.06, 0.26);
    head.add(eyeR);

    // Unibrow
    const browGeom = new THREE.BoxGeometry(0.42, 0.06, 0.04);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x4a2c11 });
    const brow = new THREE.Mesh(browGeom, browMat);
    brow.position.set(0, 0.13, 0.255);
    head.add(brow);

    // Profession headgear
    if (profession === 'farmer') {
      const hatBrim = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.8), this.villagerFarmerHatMat);
      hatBrim.position.y = 0.34;
      head.add(hatBrim);
      const hatTop = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.52), this.villagerFarmerHatMat);
      hatTop.position.y = 0.44;
      head.add(hatTop);
    } else if (profession === 'librarian') {
      const bookHat = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.12, 0.54), this.villagerLibrarianMat);
      bookHat.position.y = 0.33;
      head.add(bookHat);
    }

    group.add(head);

    // 2. Long Robe / Torso (0.54 x 0.85 x 0.38)
    const robeGeom = new THREE.BoxGeometry(0.54, 0.85, 0.38);
    const robe = new THREE.Mesh(robeGeom, this.villagerRobeMat);
    robe.position.y = 1.05;
    robe.name = 'body';

    // Smith apron
    if (profession === 'weaponsmith') {
      const apron = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.7, 0.04), this.villagerSmithMat);
      apron.position.set(0, -0.05, 0.19);
      robe.add(apron);
    }
    group.add(robe);

    // 3. Folded Arms (Classic crossed arms)
    const sleeveGeom = new THREE.BoxGeometry(0.58, 0.22, 0.22);
    const foldedArms = new THREE.Mesh(sleeveGeom, this.villagerRobeMat);
    foldedArms.position.set(0, 1.08, 0.25);
    foldedArms.name = 'folded_arms';
    group.add(foldedArms);

    // 4. Legs
    const legGeom = new THREE.BoxGeometry(0.18, 0.65, 0.18);
    const legL = new THREE.Mesh(legGeom, this.villagerRobeMat);
    legL.position.set(-0.14, 0.32, 0);
    legL.name = 'leg_l';
    group.add(legL);

    const legR = new THREE.Mesh(legGeom, this.villagerRobeMat);
    legR.position.set(0.14, 0.32, 0);
    legR.name = 'leg_r';
    group.add(legR);

    return group;
  }

  private buildCreeperMesh(): THREE.Group {
    const group = new THREE.Group();

    // 1. Head
    const headGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeom, this.creeperMat);
    head.position.y = 1.45;
    head.name = 'head';

    // Face: Eyes
    const eyeGeom = new THREE.BoxGeometry(0.12, 0.12, 0.05);
    const eyeL = new THREE.Mesh(eyeGeom, this.creeperFaceMat);
    eyeL.position.set(-0.12, 0.06, 0.25);
    head.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, this.creeperFaceMat);
    eyeR.position.set(0.12, 0.06, 0.25);
    head.add(eyeR);

    // Mouth (inverted T)
    const mouthCenter = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.05), this.creeperFaceMat);
    mouthCenter.position.set(0, -0.06, 0.25);
    head.add(mouthCenter);
    const mouthBottom = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.10, 0.05), this.creeperFaceMat);
    mouthBottom.position.set(0, -0.16, 0.25);
    head.add(mouthBottom);
    group.add(head);

    // 2. Torso
    const bodyGeom = new THREE.BoxGeometry(0.48, 0.65, 0.26);
    const body = new THREE.Mesh(bodyGeom, this.creeperMat);
    body.position.y = 0.90;
    body.name = 'body';
    group.add(body);

    // 3. Four stubby legs
    const legGeom = new THREE.BoxGeometry(0.18, 0.32, 0.18);
    const legFL = new THREE.Mesh(legGeom, this.creeperMat);
    legFL.position.set(-0.15, 0.16, 0.12);
    legFL.name = 'paw_fl';
    group.add(legFL);

    const legFR = new THREE.Mesh(legGeom, this.creeperMat);
    legFR.position.set(0.15, 0.16, 0.12);
    legFR.name = 'paw_fr';
    group.add(legFR);

    const legBL = new THREE.Mesh(legGeom, this.creeperMat);
    legBL.position.set(-0.15, 0.16, -0.12);
    legBL.name = 'paw_bl';
    group.add(legBL);

    const legBR = new THREE.Mesh(legGeom, this.creeperMat);
    legBR.position.set(0.15, 0.16, -0.12);
    legBR.name = 'paw_br';
    group.add(legBR);

    return group;
  }

  private buildZombieMesh(): THREE.Group {
    const group = new THREE.Group();

    // 1. Head
    const headGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeom, this.zombieSkinMat);
    head.position.y = 1.65;
    head.name = 'head';

    const eyeGeom = new THREE.BoxGeometry(0.08, 0.06, 0.04);
    const eyeL = new THREE.Mesh(eyeGeom, new THREE.MeshBasicMaterial({ color: 0x1b3012 }));
    eyeL.position.set(-0.12, 0.03, 0.25);
    head.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, new THREE.MeshBasicMaterial({ color: 0x1b3012 }));
    eyeR.position.set(0.12, 0.03, 0.25);
    head.add(eyeR);
    group.add(head);

    // 2. Torso (Cyan shirt)
    const bodyGeom = new THREE.BoxGeometry(0.5, 0.72, 0.28);
    const body = new THREE.Mesh(bodyGeom, this.zombieShirtMat);
    body.position.y = 1.05;
    body.name = 'body';
    group.add(body);

    // 3. Outstretched Arms (Zombie pose!)
    const armGeom = new THREE.BoxGeometry(0.14, 0.65, 0.14);
    const armL = new THREE.Mesh(armGeom, this.zombieSkinMat);
    armL.position.set(-0.35, 1.15, 0.28);
    armL.rotation.x = -Math.PI / 2;
    armL.name = 'arm_l';
    group.add(armL);

    const armR = new THREE.Mesh(armGeom, this.zombieSkinMat);
    armR.position.set(0.35, 1.15, 0.28);
    armR.rotation.x = -Math.PI / 2;
    armR.name = 'arm_r';
    group.add(armR);

    // 4. Legs (Dark blue jeans)
    const legGeom = new THREE.BoxGeometry(0.18, 0.7, 0.18);
    const legL = new THREE.Mesh(legGeom, this.zombiePantsMat);
    legL.position.set(-0.14, 0.35, 0);
    legL.name = 'leg_l';
    group.add(legL);

    const legR = new THREE.Mesh(legGeom, this.zombiePantsMat);
    legR.position.set(0.14, 0.35, 0);
    legR.name = 'leg_r';
    group.add(legR);

    return group;
  }

  private buildPigMesh(): THREE.Group {
    const group = new THREE.Group();

    // Body
    const bodyGeom = new THREE.BoxGeometry(0.55, 0.5, 0.75);
    const body = new THREE.Mesh(bodyGeom, this.pigMat);
    body.position.y = 0.5;
    body.name = 'body';
    group.add(body);

    // Head
    const headGeom = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const head = new THREE.Mesh(headGeom, this.pigMat);
    head.position.set(0, 0.65, 0.45);
    head.name = 'head';

    // Snout
    const snoutGeom = new THREE.BoxGeometry(0.2, 0.14, 0.08);
    const snout = new THREE.Mesh(snoutGeom, this.pigSnoutMat);
    snout.position.set(0, -0.06, 0.23);
    head.add(snout);

    // Eyes
    const eyeGeom = new THREE.BoxGeometry(0.06, 0.06, 0.04);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
    eyeL.position.set(-0.18, 0.06, 0.18);
    head.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
    eyeR.position.set(0.18, 0.06, 0.18);
    head.add(eyeR);
    group.add(head);

    // Legs
    const legGeom = new THREE.BoxGeometry(0.16, 0.35, 0.16);
    const paws = [
      [-0.18, 0.18, 0.22, 'paw_fl'],
      [0.18, 0.18, 0.22, 'paw_fr'],
      [-0.18, 0.18, -0.22, 'paw_bl'],
      [0.18, 0.18, -0.22, 'paw_br']
    ] as const;

    paws.forEach(([lx, ly, lz, name]) => {
      const leg = new THREE.Mesh(legGeom, this.pigMat);
      leg.position.set(lx, ly, lz);
      leg.name = name;
      group.add(leg);
    });

    return group;
  }

  private buildCowMesh(): THREE.Group {
    const group = new THREE.Group();

    // Body
    const bodyGeom = new THREE.BoxGeometry(0.65, 0.65, 0.95);
    const body = new THREE.Mesh(bodyGeom, this.cowMat);
    body.position.y = 0.7;
    body.name = 'body';

    // White cow spots
    const spot = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.4, 0.45), this.cowWhiteMat);
    spot.position.set(0, 0.05, 0);
    body.add(spot);
    group.add(body);

    // Head
    const headGeom = new THREE.BoxGeometry(0.44, 0.44, 0.44);
    const head = new THREE.Mesh(headGeom, this.cowMat);
    head.position.set(0, 0.95, 0.58);
    head.name = 'head';

    // Horns
    const hornGeom = new THREE.BoxGeometry(0.08, 0.16, 0.08);
    const hornL = new THREE.Mesh(hornGeom, this.cowHornMat);
    hornL.position.set(-0.24, 0.22, -0.05);
    head.add(hornL);
    const hornR = new THREE.Mesh(hornGeom, this.cowHornMat);
    hornR.position.set(0.24, 0.22, -0.05);
    head.add(hornR);
    group.add(head);

    // Legs
    const legGeom = new THREE.BoxGeometry(0.18, 0.48, 0.18);
    const paws = [
      [-0.22, 0.24, 0.32, 'paw_fl'],
      [0.22, 0.24, 0.32, 'paw_fr'],
      [-0.22, 0.24, -0.32, 'paw_bl'],
      [0.22, 0.24, -0.32, 'paw_br']
    ] as const;

    paws.forEach(([lx, ly, lz, name]) => {
      const leg = new THREE.Mesh(legGeom, this.cowMat);
      leg.position.set(lx, ly, lz);
      leg.name = name;
      group.add(leg);
    });

    return group;
  }

  private buildSheepMesh(): THREE.Group {
    const group = new THREE.Group();

    // Fluffy wool body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.58, 0.92), this.sheepWoolMat);
    body.position.y = 0.68;
    body.name = 'body';
    group.add(body);

    // Wool collar around head + beige face
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.44), this.sheepSkinMat);
    head.position.set(0, 0.88, 0.56);
    head.name = 'head';

    const woolCrown = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.36), this.sheepWoolMat);
    woolCrown.position.set(0, 0.18, -0.04);
    head.add(woolCrown);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), eyeMat);
    eyeL.position.set(-0.14, 0.04, 0.22);
    head.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), eyeMat);
    eyeR.position.set(0.14, 0.04, 0.22);
    head.add(eyeR);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), this.pigSnoutMat);
    nose.position.set(0, -0.09, 0.22);
    head.add(nose);
    group.add(head);

    // 4 hooves
    const legGeom = new THREE.BoxGeometry(0.16, 0.44, 0.16);
    const paws = [
      [-0.2, 0.22, 0.28, 'paw_fl'],
      [0.2, 0.22, 0.28, 'paw_fr'],
      [-0.2, 0.22, -0.28, 'paw_bl'],
      [0.2, 0.22, -0.28, 'paw_br']
    ] as const;
    paws.forEach(([lx, ly, lz, name]) => {
      const leg = new THREE.Mesh(legGeom, this.sheepSkinMat);
      leg.position.set(lx, ly, lz);
      leg.name = name;
      group.add(leg);
    });

    return group;
  }

  private buildChickenMesh(): THREE.Group {
    const group = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.46), this.chickenWhiteMat);
    body.position.y = 0.36;
    body.name = 'body';
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.24), this.chickenWhiteMat);
    head.position.set(0, 0.56, 0.22);
    head.name = 'head';

    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.14), this.chickenBeakMat);
    beak.position.set(0, -0.01, 0.16);
    head.add(beak);

    const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.08), this.chickenWattleMat);
    wattle.position.set(0, -0.1, 0.13);
    head.add(wattle);

    const comb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.14), this.chickenWattleMat);
    comb.position.set(0, 0.17, 0);
    head.add(comb);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), eyeMat);
    eyeL.position.set(-0.11, 0.05, 0.08);
    head.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), eyeMat);
    eyeR.position.set(0.11, 0.05, 0.08);
    head.add(eyeR);
    group.add(head);

    // Flapping wings
    const wingGeom = new THREE.BoxGeometry(0.06, 0.22, 0.34);
    const wingL = new THREE.Mesh(wingGeom, this.chickenWhiteMat);
    wingL.position.set(-0.21, 0.38, 0);
    wingL.name = 'wing_l';
    group.add(wingL);

    const wingR = new THREE.Mesh(wingGeom, this.chickenWhiteMat);
    wingR.position.set(0.21, 0.38, 0);
    wingR.name = 'wing_r';
    group.add(wingR);

    // Orange legs
    const legGeom = new THREE.BoxGeometry(0.06, 0.22, 0.08);
    const legL = new THREE.Mesh(legGeom, this.chickenBeakMat);
    legL.position.set(-0.09, 0.11, 0);
    legL.name = 'leg_l';
    group.add(legL);

    const legR = new THREE.Mesh(legGeom, this.chickenBeakMat);
    legR.position.set(0.09, 0.11, 0);
    legR.name = 'leg_r';
    group.add(legR);

    return group;
  }

  private buildWolfMesh(): THREE.Group {
    const group = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.78), this.wolfFurMat);
    body.position.y = 0.52;
    body.name = 'body';
    group.add(body);

    // Fluffy collar
    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.28), this.wolfLightMat);
    mane.position.set(0, 0.54, 0.26);
    group.add(mane);

    // Head + Snout
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.38), this.wolfFurMat);
    head.position.set(0, 0.68, 0.52);
    head.name = 'head';

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.22), this.wolfLightMat);
    snout.position.set(0, -0.07, 0.24);
    head.add(snout);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.05), this.wolfDarkMat);
    nose.position.set(0, -0.03, 0.35);
    head.add(nose);

    const earGeom = new THREE.BoxGeometry(0.1, 0.14, 0.08);
    const earL = new THREE.Mesh(earGeom, this.wolfFurMat);
    earL.position.set(-0.13, 0.24, -0.04);
    head.add(earL);
    const earR = new THREE.Mesh(earGeom, this.wolfFurMat);
    earR.position.set(0.13, 0.24, -0.04);
    head.add(earR);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), eyeMat);
    eyeL.position.set(-0.11, 0.05, 0.19);
    head.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), eyeMat);
    eyeR.position.set(0.11, 0.05, 0.19);
    head.add(eyeR);
    group.add(head);

    // Tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.42), this.wolfFurMat);
    tail.position.set(0, 0.58, -0.52);
    tail.rotation.x = 0.45;
    tail.name = 'tail';
    group.add(tail);

    const legGeom = new THREE.BoxGeometry(0.12, 0.36, 0.12);
    const paws = [
      [-0.14, 0.18, 0.24, 'paw_fl'],
      [0.14, 0.18, 0.24, 'paw_fr'],
      [-0.14, 0.18, -0.24, 'paw_bl'],
      [0.14, 0.18, -0.24, 'paw_br']
    ] as const;
    paws.forEach(([lx, ly, lz, name]) => {
      const leg = new THREE.Mesh(legGeom, this.wolfFurMat);
      leg.position.set(lx, ly, lz);
      leg.name = name;
      group.add(leg);
    });

    return group;
  }

  private buildSpiderMesh(): THREE.Group {
    const group = new THREE.Group();

    // Abdomen
    const abdomen = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.48, 0.82), this.spiderBodyMat);
    abdomen.position.set(0, 0.42, -0.42);
    abdomen.name = 'body';
    group.add(abdomen);

    // Thorax
    const thorax = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.36, 0.36), this.spiderBodyMat);
    thorax.position.set(0, 0.38, 0.12);
    group.add(thorax);

    // Head with glowing red eyes
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.46), this.spiderBodyMat);
    head.position.set(0, 0.4, 0.48);
    head.name = 'head';

    const eyeOffsets = [
      [-0.14, 0.06],
      [0.14, 0.06],
      [-0.08, -0.06],
      [0.08, -0.06]
    ];
    eyeOffsets.forEach(([ex, ey]) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.05), this.spiderEyeMat);
      eye.position.set(ex, ey, 0.23);
      head.add(eye);
    });
    group.add(head);

    // 8 Articulated spider legs (4 left, 4 right)
    const legGeom = new THREE.BoxGeometry(0.78, 0.1, 0.1);
    for (let i = 0; i < 4; i++) {
      const zPos = 0.24 - i * 0.2;
      const legL = new THREE.Mesh(legGeom, this.spiderBodyMat);
      legL.position.set(-0.56, 0.28, zPos);
      legL.rotation.z = 0.35;
      legL.rotation.y = (i - 1.5) * 0.22;
      legL.name = `sleg_l_${i}`;
      group.add(legL);

      const legR = new THREE.Mesh(legGeom, this.spiderBodyMat);
      legR.position.set(0.56, 0.28, zPos);
      legR.rotation.z = -0.35;
      legR.rotation.y = -(i - 1.5) * 0.22;
      legR.name = `sleg_r_${i}`;
      group.add(legR);
    }

    return group;
  }

  private buildEndermanMesh(): THREE.Group {
    const group = new THREE.Group();

    // Tall slender head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), this.endermanMat);
    head.position.y = 2.6;
    head.name = 'head';

    // Glowing purple eyes
    const eyeGeom = new THREE.BoxGeometry(0.14, 0.06, 0.05);
    const eyeL = new THREE.Mesh(eyeGeom, this.endermanEyeMat);
    eyeL.position.set(-0.14, 0.02, 0.25);
    head.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, this.endermanEyeMat);
    eyeR.position.set(0.14, 0.02, 0.25);
    head.add(eyeR);
    group.add(head);

    // Torso
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.72, 0.24), this.endermanMat);
    body.position.y = 2.0;
    body.name = 'body';
    group.add(body);

    // Extra long slender arms
    const armGeom = new THREE.BoxGeometry(0.12, 1.45, 0.12);
    const armL = new THREE.Mesh(armGeom, this.endermanMat);
    armL.position.set(-0.32, 1.62, 0);
    armL.name = 'arm_l';
    group.add(armL);

    const armR = new THREE.Mesh(armGeom, this.endermanMat);
    armR.position.set(0.32, 1.62, 0);
    armR.name = 'arm_r';
    group.add(armR);

    // Extra long legs
    const legGeom = new THREE.BoxGeometry(0.12, 1.65, 0.12);
    const legL = new THREE.Mesh(legGeom, this.endermanMat);
    legL.position.set(-0.14, 0.82, 0);
    legL.name = 'leg_l';
    group.add(legL);

    const legR = new THREE.Mesh(legGeom, this.endermanMat);
    legR.position.set(0.14, 0.82, 0);
    legR.name = 'leg_r';
    group.add(legR);

    return group;
  }

  private buildIronGolemMesh(): THREE.Group {
    const group = new THREE.Group();

    // Towering Iron Head with Villager nose & red eyes
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.52), this.golemIronMat);
    head.position.y = 2.48;
    head.name = 'head';

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.16), this.golemIronMat);
    nose.position.set(0, -0.1, 0.3);
    head.add(nose);

    const eyeGeom = new THREE.BoxGeometry(0.1, 0.08, 0.04);
    const eyeL = new THREE.Mesh(eyeGeom, this.golemEyeMat);
    eyeL.position.set(-0.14, 0.08, 0.26);
    head.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, this.golemEyeMat);
    eyeR.position.set(0.14, 0.08, 0.26);
    head.add(eyeR);
    group.add(head);

    // Broad muscular chest + waist
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.82, 0.62), this.golemIronMat);
    chest.position.y = 1.78;
    chest.name = 'body';

    // Mossy green vines
    const vine = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.26, 0.64), this.golemVineMat);
    vine.position.set(0, 0.1, 0);
    chest.add(vine);
    group.add(chest);

    const waist = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.4), this.golemIronMat);
    waist.position.y = 1.22;
    group.add(waist);

    // Heavy long guardian arms
    const armGeom = new THREE.BoxGeometry(0.28, 1.45, 0.32);
    const armL = new THREE.Mesh(armGeom, this.golemIronMat);
    armL.position.set(-0.74, 1.45, 0);
    armL.name = 'arm_l';
    group.add(armL);

    const armR = new THREE.Mesh(armGeom, this.golemIronMat);
    armR.position.set(0.74, 1.45, 0);
    armR.name = 'arm_r';
    group.add(armR);

    // Thick pillar legs
    const legGeom = new THREE.BoxGeometry(0.32, 1.05, 0.34);
    const legL = new THREE.Mesh(legGeom, this.golemIronMat);
    legL.position.set(-0.26, 0.52, 0);
    legL.name = 'leg_l';
    group.add(legL);

    const legR = new THREE.Mesh(legGeom, this.golemIronMat);
    legR.position.set(0.26, 0.52, 0);
    legR.name = 'leg_r';
    group.add(legR);

    return group;
  }

  private createBiblicalEye(scale: number = 1.0): THREE.Group {
    const eyeGroup = new THREE.Group();
    // Celestial Eye Sclera (luminous pale gold)
    const scleraGeom = new THREE.BoxGeometry(0.18 * scale, 0.11 * scale, 0.06 * scale);
    const sclera = new THREE.Mesh(scleraGeom, this.seraphimEyeWhiteMat);
    eyeGroup.add(sclera);

    // Burning Ruby/Crimson Pupil of Divine Sight
    const pupilGeom = new THREE.BoxGeometry(0.08 * scale, 0.08 * scale, 0.08 * scale);
    const pupil = new THREE.Mesh(pupilGeom, this.seraphimEyeMat);
    pupil.position.z = 0.02 * scale;
    eyeGroup.add(pupil);

    return eyeGroup;
  }

  private buildSeraphimMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'seraphim_root';

    // =========================================================
    // 1. CENTRAL DIVINE INCANDESCENT CORE (神聖熾熱之火核心)
    // =========================================================
    const coreGroup = new THREE.Group();
    coreGroup.name = 'fire_core';
    coreGroup.position.set(0, 1.8, 0);

    // Blazing Core Sphere/Cube of Celestial Fire
    const innerCoreGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const innerCore = new THREE.Mesh(innerCoreGeom, this.seraphimFireMat);
    coreGroup.add(innerCore);

    // Outer Translucent Radiant Auric Shell
    const auraShellGeom = new THREE.BoxGeometry(1.05, 1.05, 1.05);
    const auraShell = new THREE.Mesh(auraShellGeom, this.seraphimGoldMat);
    coreGroup.add(auraShell);

    // High-Resolution Biblically Accurate 3D Volumetric Avatar Plates
    const portraitPlateGeom = new THREE.PlaneGeometry(1.6, 1.6);
    const portraitPlateFront = new THREE.Mesh(portraitPlateGeom, this.seraphimPortraitMat);
    portraitPlateFront.position.set(0, 0, 0.54);
    coreGroup.add(portraitPlateFront);

    const portraitPlateBack = new THREE.Mesh(portraitPlateGeom, this.seraphimPortraitMat);
    portraitPlateBack.position.set(0, 0, -0.54);
    portraitPlateBack.rotation.y = Math.PI;
    coreGroup.add(portraitPlateBack);

    const portraitPlateLeft = new THREE.Mesh(portraitPlateGeom, this.seraphimPortraitMat);
    portraitPlateLeft.position.set(-0.54, 0, 0);
    portraitPlateLeft.rotation.y = Math.PI / 2;
    coreGroup.add(portraitPlateLeft);

    const portraitPlateRight = new THREE.Mesh(portraitPlateGeom, this.seraphimPortraitMat);
    portraitPlateRight.position.set(0.54, 0, 0);
    portraitPlateRight.rotation.y = -Math.PI / 2;
    coreGroup.add(portraitPlateRight);

    // Head Visage with Radiant Countenance
    const headGeom = new THREE.BoxGeometry(0.65, 0.65, 0.65);
    const head = new THREE.Mesh(headGeom, this.seraphimRobeMat);
    head.position.set(0, 0.8, 0);
    head.name = 'head';

    // Burning Celestial Eyes on Face
    const eyeFaceL = this.createBiblicalEye(1.2);
    eyeFaceL.position.set(-0.18, 0.05, 0.34);
    head.add(eyeFaceL);

    const eyeFaceR = this.createBiblicalEye(1.2);
    eyeFaceR.position.set(0.18, 0.05, 0.34);
    head.add(eyeFaceR);

    // Third All-Seeing Eye on Forehead
    const eyeThird = this.createBiblicalEye(1.3);
    eyeThird.position.set(0, 0.22, 0.34);
    head.add(eyeThird);

    // Sacred Crown of Holy Flames atop Head
    const crownGeom = new THREE.BoxGeometry(0.72, 0.16, 0.72);
    const crown = new THREE.Mesh(crownGeom, this.seraphimGoldMat);
    crown.position.y = 0.38;
    head.add(crown);

    // Radiant Golden Halo
    const haloGeom = new THREE.TorusGeometry(0.7, 0.08, 8, 24);
    const halo = new THREE.Mesh(haloGeom, this.seraphimHaloMat);
    halo.position.set(0, 0.75, 0);
    halo.rotation.x = Math.PI / 2;
    halo.name = 'halo';
    head.add(halo);

    coreGroup.add(head);
    group.add(coreGroup);

    // =========================================================
    // 2. OPHANIM INTERLOCKING GYROSCOPIC WHEELS OF FIRE (神火之輪)
    // "Wheels within wheels, full of eyes round about" (Ezekiel 1:16-18)
    // =========================================================
    const ophanimGroup = new THREE.Group();
    ophanimGroup.position.set(0, 1.8, 0);

    // Outer Flaming Wheel
    const ringOuterGeom = new THREE.TorusGeometry(1.65, 0.1, 10, 32);
    const ringOuter = new THREE.Mesh(ringOuterGeom, this.seraphimWheelMat);
    ringOuter.name = 'ophanim_ring_outer';

    // Stud Outer Ring with 8 Glowing Celestial Eyes
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const eye = this.createBiblicalEye(0.9);
      eye.position.set(Math.cos(angle) * 1.65, Math.sin(angle) * 1.65, 0);
      eye.rotation.z = angle;
      ringOuter.add(eye);
    }
    ophanimGroup.add(ringOuter);

    // Inner Concentric Flaming Wheel (Perpendicular)
    const ringInnerGeom = new THREE.TorusGeometry(1.35, 0.09, 8, 28);
    const ringInner = new THREE.Mesh(ringInnerGeom, this.seraphimGoldMat);
    ringInner.rotation.x = Math.PI / 2;
    ringInner.name = 'ophanim_ring_inner';

    // Stud Inner Ring with 6 Glowing Celestial Eyes
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const eye = this.createBiblicalEye(0.85);
      eye.position.set(Math.cos(angle) * 1.35, Math.sin(angle) * 1.35, 0);
      eye.rotation.z = angle;
      ringInner.add(eye);
    }
    ophanimGroup.add(ringInner);

    group.add(ophanimGroup);

    // =========================================================
    // 3. SIX BIBLICAL WINGS (聖經六翼 - Isaiah 6:2)
    // "Two wings covering face, two covering feet, two flying"
    // =========================================================

    // ---------------------------------------------------------
    // PAIR 1: FACE-COVERING WINGS (遮面雙翼 - wing_face_l, wing_face_r)
    // ---------------------------------------------------------
    const faceWingGeom = new THREE.BoxGeometry(1.1, 2.5, 0.08);

    const wingFaceL = new THREE.Group();
    wingFaceL.name = 'wing_face_l';
    wingFaceL.position.set(-0.35, 2.0, 0.2);
    const wingFaceLMesh = new THREE.Mesh(faceWingGeom, this.seraphimFieryWingMat);
    wingFaceLMesh.position.set(0.3, 0.9, 0.25);
    wingFaceLMesh.rotation.y = -0.3;
    wingFaceLMesh.rotation.z = -0.2;
    wingFaceL.add(wingFaceLMesh);

    // Add sacred eyes to face-covering wing
    for (let i = 0; i < 3; i++) {
      const eye = this.createBiblicalEye(0.9);
      eye.position.set(0.2, 0.5 + i * 0.55, 0.35);
      wingFaceL.add(eye);
    }
    group.add(wingFaceL);

    const wingFaceR = new THREE.Group();
    wingFaceR.name = 'wing_face_r';
    wingFaceR.position.set(0.35, 2.0, 0.2);
    const wingFaceRMesh = new THREE.Mesh(faceWingGeom, this.seraphimFieryWingMat);
    wingFaceRMesh.position.set(-0.3, 0.9, 0.25);
    wingFaceRMesh.rotation.y = 0.3;
    wingFaceRMesh.rotation.z = 0.2;
    wingFaceR.add(wingFaceRMesh);

    // Add sacred eyes to face-covering wing
    for (let i = 0; i < 3; i++) {
      const eye = this.createBiblicalEye(0.9);
      eye.position.set(-0.2, 0.5 + i * 0.55, 0.35);
      wingFaceR.add(eye);
    }
    group.add(wingFaceR);

    // ---------------------------------------------------------
    // PAIR 2: FEET-COVERING WINGS (遮腳雙翼 - wing_feet_l, wing_feet_r)
    // ---------------------------------------------------------
    const feetWingGeom = new THREE.BoxGeometry(1.0, 2.2, 0.08);

    const wingFeetL = new THREE.Group();
    wingFeetL.name = 'wing_feet_l';
    wingFeetL.position.set(-0.3, 1.4, 0.15);
    const wingFeetLMesh = new THREE.Mesh(feetWingGeom, this.seraphimFieryWingMat);
    wingFeetLMesh.position.set(0.2, -0.9, 0.2);
    wingFeetLMesh.rotation.y = -0.25;
    wingFeetLMesh.rotation.z = 0.15;
    wingFeetL.add(wingFeetLMesh);

    for (let i = 0; i < 3; i++) {
      const eye = this.createBiblicalEye(0.85);
      eye.position.set(0.15, -0.4 - i * 0.45, 0.3);
      wingFeetL.add(eye);
    }
    group.add(wingFeetL);

    const wingFeetR = new THREE.Group();
    wingFeetR.name = 'wing_feet_r';
    wingFeetR.position.set(0.3, 1.4, 0.15);
    const wingFeetRMesh = new THREE.Mesh(feetWingGeom, this.seraphimFieryWingMat);
    wingFeetRMesh.position.set(-0.2, -0.9, 0.2);
    wingFeetRMesh.rotation.y = 0.25;
    wingFeetRMesh.rotation.z = -0.15;
    wingFeetR.add(wingFeetRMesh);

    for (let i = 0; i < 3; i++) {
      const eye = this.createBiblicalEye(0.85);
      eye.position.set(-0.15, -0.4 - i * 0.45, 0.3);
      wingFeetR.add(eye);
    }
    group.add(wingFeetR);

    // ---------------------------------------------------------
    // PAIR 3: FLIGHT WINGS (飛翔雙翼 - wing_fly_l, wing_fly_r)
    // ---------------------------------------------------------
    const flyWingMainGeom = new THREE.BoxGeometry(3.0, 1.2, 0.09);
    const flyWingSecondaryGeom = new THREE.BoxGeometry(2.4, 0.8, 0.08);

    const wingFlyL = new THREE.Group();
    wingFlyL.name = 'wing_fly_l';
    wingFlyL.position.set(-0.5, 1.8, -0.3);
    const wingFlyLMain = new THREE.Mesh(flyWingMainGeom, this.seraphimWingMat);
    wingFlyLMain.position.set(-1.4, 0.4, 0);
    wingFlyLMain.rotation.z = 0.25;
    wingFlyL.add(wingFlyLMain);

    const wingFlyLSecondary = new THREE.Mesh(flyWingSecondaryGeom, this.seraphimFieryWingMat);
    wingFlyLSecondary.position.set(-1.1, -0.2, 0.04);
    wingFlyLSecondary.rotation.z = 0.1;
    wingFlyL.add(wingFlyLSecondary);

    // Stud flight wing with 4 glowing celestial eyes
    for (let i = 0; i < 4; i++) {
      const eye = this.createBiblicalEye(0.9);
      eye.position.set(-0.7 - i * 0.55, 0.35 + (i % 2) * 0.2, 0.08);
      wingFlyL.add(eye);
    }
    group.add(wingFlyL);

    const wingFlyR = new THREE.Group();
    wingFlyR.name = 'wing_fly_r';
    wingFlyR.position.set(0.5, 1.8, -0.3);
    const wingFlyRMain = new THREE.Mesh(flyWingMainGeom, this.seraphimWingMat);
    wingFlyRMain.position.set(1.4, 0.4, 0);
    wingFlyRMain.rotation.z = -0.25;
    wingFlyR.add(wingFlyRMain);

    const wingFlyRSecondary = new THREE.Mesh(flyWingSecondaryGeom, this.seraphimFieryWingMat);
    wingFlyRSecondary.position.set(1.1, -0.2, 0.04);
    wingFlyRSecondary.rotation.z = -0.1;
    wingFlyR.add(wingFlyRSecondary);

    for (let i = 0; i < 4; i++) {
      const eye = this.createBiblicalEye(0.9);
      eye.position.set(0.7 + i * 0.55, 0.35 + (i % 2) * 0.2, 0.08);
      wingFlyR.add(eye);
    }
    group.add(wingFlyR);

    // =========================================================
    // 4. DIVINE HOLY SWORD & ETHEREAL ROBE DRAPES
    // =========================================================
    // Holy Blade held in divine authority
    const bladeArm = new THREE.Group();
    bladeArm.name = 'blade_arm';
    bladeArm.position.set(0.7, 1.6, 0.2);

    const bladeGeom = new THREE.BoxGeometry(0.14, 1.8, 0.32);
    const blade = new THREE.Mesh(bladeGeom, this.seraphimBladeMat);
    blade.position.set(0, -0.5, 0.4);
    blade.rotation.x = 0.5;
    bladeArm.add(blade);

    // Sword Crossguard with Eye
    const crossguardGeom = new THREE.BoxGeometry(0.55, 0.12, 0.2);
    const crossguard = new THREE.Mesh(crossguardGeom, this.seraphimGoldMat);
    crossguard.position.set(0, 0.2, 0.4);
    const swordEye = this.createBiblicalEye(0.8);
    swordEye.position.set(0, 0.2, 0.52);
    crossguard.add(swordEye);
    bladeArm.add(crossguard);

    group.add(bladeArm);

    // Orbiting Holy Fire Sparks
    const sparksGroup = new THREE.Group();
    sparksGroup.name = 'holy_sparks';
    for (let i = 0; i < 8; i++) {
      const spark = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), this.seraphimHaloMat);
      const angle = (i / 8) * Math.PI * 2;
      spark.position.set(Math.cos(angle) * 1.8, Math.sin(angle * 2) * 0.5 + 1.8, Math.sin(angle) * 1.8);
      sparksGroup.add(spark);
    }
    group.add(sparksGroup);

    return group;
  }

  public createMob(
    type: MobType,
    x: number,
    y: number,
    z: number,
    profession?: 'farmer' | 'librarian' | 'weaponsmith' | 'cleric'
  ): MobEntity {
    const id = `mob_${this.nextMobId++}`;
    const isSkeleton = type === 'skeleton';
    const isVillager = type === 'villager';
    const isCreeper = type === 'creeper';
    const isZombie = type === 'zombie';
    const isSeraphim = type === 'seraphim';

    const chosenProf = profession || (
      Math.random() < 0.35 ? 'farmer' :
      Math.random() < 0.6 ? 'librarian' :
      Math.random() < 0.85 ? 'weaponsmith' : 'cleric'
    );

    const trades = isVillager ? this.generateTradesForProfession(chosenProf) : undefined;
    const hpMap: Record<MobType, number> = {
      seraphim: 350,
      iron_golem: 100,
      enderman: 40,
      villager: 24,
      skeleton: 20,
      zombie: 20,
      creeper: 20,
      spider: 16,
      wolf: 14,
      cow: 12,
      pig: 10,
      sheep: 10,
      rabbit: 6,
      chicken: 5
    };
    const maxHp = hpMap[type] ?? 12;

    const entity: MobEntity = {
      id,
      type,
      position: { x, y, z },
      rotationY: Math.random() * Math.PI * 2,
      velocity: { x: 0, y: 0, z: 0 },
      health: maxHp,
      maxHealth: maxHp,
      state: 'idle',
      stateTimer: 1 + Math.random() * 2,
      attackCooldown: 0,
      hurtCooldown: 0,
      isGrounded: !isSeraphim,
      profession: isVillager ? chosenProf : undefined,
      trades,
      bossTitle: isSeraphim ? '天界熾天使 · 塞拉芬 (Seraphim)' : undefined,
      bossPhase: isSeraphim ? 1 : undefined,
      bossAttackTimer: isSeraphim ? 2.0 : undefined
    };

    let mesh: THREE.Group;
    if (isSeraphim) {
      mesh = this.buildSeraphimMesh();
      soundManager.playSeraphimSpawn();
    } else if (isSkeleton) {
      mesh = this.buildSkeletonMesh();
    } else if (isVillager) {
      mesh = this.buildVillagerMesh(chosenProf);
    } else if (isCreeper) {
      mesh = this.buildCreeperMesh();
    } else if (isZombie) {
      mesh = this.buildZombieMesh();
    } else if (type === 'pig') {
      mesh = this.buildPigMesh();
    } else if (type === 'cow') {
      mesh = this.buildCowMesh();
    } else if (type === 'sheep') {
      mesh = this.buildSheepMesh();
    } else if (type === 'chicken') {
      mesh = this.buildChickenMesh();
    } else if (type === 'wolf') {
      mesh = this.buildWolfMesh();
    } else if (type === 'spider') {
      mesh = this.buildSpiderMesh();
    } else if (type === 'enderman') {
      mesh = this.buildEndermanMesh();
    } else if (type === 'iron_golem') {
      mesh = this.buildIronGolemMesh();
    } else {
      mesh = this.buildRabbitMesh();
    }

    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.mobMeshes.set(id, mesh);
    this.mobs.push(entity);

    return entity;
  }

  private generateTradesForProfession(prof: 'farmer' | 'librarian' | 'weaponsmith' | 'cleric') {
    if (prof === 'farmer') {
      return [
        { id: 't1', inputItem: 'wheat', inputCount: 8, outputItem: 'emerald', outputCount: 1 },
        { id: 't2', inputItem: 'emerald', inputCount: 1, outputItem: 'bread', outputCount: 4 },
        { id: 't3', inputItem: 'hay_block', inputCount: 1, outputItem: 'emerald', outputCount: 2 }
      ];
    } else if (prof === 'librarian') {
      return [
        { id: 't1', inputItem: 'stick', inputCount: 8, outputItem: 'emerald', outputCount: 1 },
        { id: 't2', inputItem: 'emerald', inputCount: 2, outputItem: 'bookshelf', outputCount: 1 },
        { id: 't3', inputItem: 'glass', inputCount: 4, outputItem: 'emerald', outputCount: 1 }
      ];
    } else if (prof === 'weaponsmith') {
      return [
        { id: 't1', inputItem: 'iron_ore', inputCount: 4, outputItem: 'emerald', outputCount: 1 },
        { id: 't2', inputItem: 'emerald', inputCount: 3, outputItem: 'iron_sword', outputCount: 1 },
        { id: 't3', inputItem: 'emerald', inputCount: 4, outputItem: 'iron_pickaxe', outputCount: 1 },
        { id: 't4', inputItem: 'emerald', inputCount: 6, outputItem: 'diamond_sword', outputCount: 1 }
      ];
    } else {
      return [
        { id: 't1', inputItem: 'emerald', inputCount: 2, outputItem: 'glowstone', outputCount: 4 },
        { id: 't2', inputItem: 'emerald', inputCount: 4, outputItem: 'golden_apple', outputCount: 1 },
        { id: 't3', inputItem: 'bone', inputCount: 6, outputItem: 'emerald', outputCount: 1 }
      ];
    }
  }

  public removeMob(id: string) {
    const idx = this.mobs.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.mobs.splice(idx, 1);
    }
    const mesh = this.mobMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      this.mobMeshes.delete(id);
    }
  }

  public clearAllMobs(keepBoss: boolean = false) {
    for (const [id, mesh] of this.mobMeshes.entries()) {
      const mob = this.mobs.find((m) => m.id === id);
      if (keepBoss && mob && mob.type === 'seraphim') continue;
      this.scene.remove(mesh);
      this.mobMeshes.delete(id);
    }
    this.mobs = keepBoss ? this.mobs.filter((m) => m.type === 'seraphim') : [];
    if (!keepBoss) {
      this.clearProjectiles();
    }
  }

  public clearProjectiles() {
    for (const p of this.seraphimProjectiles) {
      this.scene.remove(p.mesh);
    }
    this.seraphimProjectiles = [];
  }

  public spawnVillageVillagers(
    villages: ({ x: number; y: number; z: number } | { centerX: number; centerZ: number; groundY: number })[]
  ) {
    const currentVillagers = this.mobs.filter((m) => m.type === 'villager').length;
    if (currentVillagers >= 8) return;

    const profs: ('farmer' | 'librarian' | 'weaponsmith' | 'cleric')[] = [
      'farmer',
      'librarian',
      'weaponsmith',
      'cleric'
    ];

    villages.forEach((v) => {
      const cx = 'centerX' in v ? v.centerX : v.x;
      const cz = 'centerZ' in v ? v.centerZ : v.z;
      for (let i = 0; i < 3; i++) {
        const vx = cx + (i === 0 ? 2 : i === 1 ? -3 : 3);
        const vz = cz + (i === 0 ? -2 : i === 1 ? 2 : -3);
        const vy = this.findSurfaceY(vx, vz);
        const prof = profs[i % profs.length];
        this.createMob('villager', vx, vy, vz, prof);
      }

      // Spawn a protective Iron Golem in the village if needed
      const currentGolems = this.mobs.filter((m) => m.type === 'iron_golem').length;
      if (currentGolems < 2) {
        const gx = cx;
        const gz = cz + 4;
        const gy = this.findSurfaceY(gx, gz);
        this.createMob('iron_golem', gx, gy, gz);
      }
    });
  }

  public damageMob(
    id: string,
    damage: number,
    knockbackDir?: THREE.Vector3
  ): { died: boolean; dropItem?: string; dropCount?: number } {
    const mob = this.mobs.find((m) => m.id === id);
    if (!mob) return { died: false };

    mob.health -= damage;
    mob.hurtCooldown = 0.35;
    if (mob.type === 'seraphim') {
      soundManager.playSeraphimHurt();
    } else if (mob.type === 'villager') {
      soundManager.playVillagerNo();
    } else {
      soundManager.playHit();
    }

    // Knockback (Iron Golem has heavy knockback resistance)
    if (knockbackDir) {
      const kbMult = mob.type === 'seraphim' || mob.type === 'iron_golem' ? 1.5 : 5;
      mob.velocity.x = knockbackDir.x * kbMult;
      mob.velocity.y = mob.type === 'seraphim' ? 0.5 : 3;
      mob.velocity.z = knockbackDir.z * kbMult;
    }

    // Enderman short-range blink teleport when hurt
    if (mob.health > 0 && mob.type === 'enderman' && Math.random() < 0.65) {
      const blinkAngle = Math.random() * Math.PI * 2;
      const blinkDist = 4 + Math.random() * 4;
      const nx = mob.position.x + Math.cos(blinkAngle) * blinkDist;
      const nz = mob.position.z + Math.sin(blinkAngle) * blinkDist;
      mob.position.x = nx;
      mob.position.z = nz;
      mob.position.y = this.findSurfaceY(nx, nz);
    }

    if (mob.health <= 0) {
      // Death
      this.removeMob(id);
      if (mob.type === 'seraphim') {
        soundManager.playSeraphimDefeat();
        this.clearProjectiles();
        this.onSeraphimDefeated?.();
        return { died: true, dropItem: 'diamond_sword', dropCount: 1 };
      }
      if (mob.type === 'villager') {
        return { died: true, dropItem: 'emerald', dropCount: 1 };
      }
      if (mob.type === 'creeper') {
        return { died: true, dropItem: 'tnt', dropCount: 1 };
      }
      if (mob.type === 'zombie') {
        return { died: true, dropItem: Math.random() < 0.5 ? 'iron_ore' : 'porkchop', dropCount: 1 };
      }
      if (mob.type === 'spider') {
        return { died: true, dropItem: Math.random() < 0.35 ? 'emerald' : 'redstone', dropCount: 1 };
      }
      if (mob.type === 'enderman') {
        return { died: true, dropItem: Math.random() < 0.45 ? 'diamond' : 'emerald', dropCount: 1 };
      }
      if (mob.type === 'iron_golem') {
        return { died: true, dropItem: 'iron_ore', dropCount: 3 };
      }
      if (mob.type === 'cow') {
        return { died: true, dropItem: 'steak', dropCount: 2 };
      }
      if (mob.type === 'pig') {
        return { died: true, dropItem: 'porkchop', dropCount: 2 };
      }
      if (mob.type === 'sheep') {
        return { died: true, dropItem: 'wheat', dropCount: 2 };
      }
      if (mob.type === 'chicken') {
        return { died: true, dropItem: Math.random() < 0.5 ? 'arrow' : 'apple', dropCount: 2 };
      }
      if (mob.type === 'wolf') {
        return { died: true, dropItem: 'bone', dropCount: 2 };
      }
      const isSkeleton = mob.type === 'skeleton';
      return {
        died: true,
        dropItem: isSkeleton ? 'bone' : 'apple',
        dropCount: isSkeleton ? 2 : 1
      };
    }

    return { died: false };
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    onPlayerAttacked: (damage: number) => void,
    mobSpawnMultiplier: number
  ) {
    if (this.isPaused) return;

    // 0. Update Seraphim Holy Projectiles
    for (let pIdx = this.seraphimProjectiles.length - 1; pIdx >= 0; pIdx--) {
      const p = this.seraphimProjectiles[pIdx];
      p.life -= delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Hit player check
      const pDist = p.mesh.position.distanceTo(playerPos);
      if (pDist < 1.35) {
        onPlayerAttacked(4); // 2 hearts damage
        soundManager.playHit();
        this.scene.remove(p.mesh);
        this.seraphimProjectiles.splice(pIdx, 1);
        continue;
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.seraphimProjectiles.splice(pIdx, 1);
      }
    }

    // 1. Spawning cycle
    if (this.difficulty === 'peaceful') {
      for (let i = this.mobs.length - 1; i >= 0; i--) {
        const t = this.mobs[i].type;
        if (t === 'skeleton' || t === 'zombie' || t === 'creeper' || t === 'spider' || t === 'enderman') {
          this.removeMob(this.mobs[i].id);
        }
      }
    }

    this.spawnTimer += delta;
    if (this.spawnTimer >= 5.0) {
      this.spawnTimer = 0;
      this.trySpawnAroundPlayer(playerPos, mobSpawnMultiplier);
    }

    // 2. Update each mob AI and physics
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];
      const mesh = this.mobMeshes.get(mob.id);
      if (!mesh) continue;

      // Cooldowns
      if (mob.hurtCooldown > 0) mob.hurtCooldown -= delta;
      if (mob.attackCooldown > 0) mob.attackCooldown -= delta;

      // Distance to player
      const dx = playerPos.x - mob.position.x;
      const dz = playerPos.z - mob.position.z;
      const distToPlayer = Math.sqrt(dx * dx + dz * dz);

      // Despawn if way too far (never despawn Seraphim Boss or Iron Golem!)
      if (distToPlayer > 85 && mob.type !== 'seraphim' && mob.type !== 'iron_golem') {
        this.removeMob(mob.id);
        continue;
      }

      // AI Decision Logic
      if (mob.type === 'seraphim') {
        this.updateSeraphimAI(mob, dx, dz, distToPlayer, delta, onPlayerAttacked, playerPos);
      } else if (mob.type === 'skeleton') {
        this.updateSkeletonAI(mob, dx, dz, distToPlayer, delta, onPlayerAttacked);
      } else if (mob.type === 'zombie') {
        this.updateZombieAI(mob, dx, dz, distToPlayer, delta, onPlayerAttacked);
      } else if (mob.type === 'creeper') {
        this.updateCreeperAI(mob, mesh, dx, dz, distToPlayer, delta, onPlayerAttacked);
      } else if (mob.type === 'spider') {
        this.updateSpiderAI(mob, dx, dz, distToPlayer, delta, onPlayerAttacked);
      } else if (mob.type === 'enderman') {
        this.updateEndermanAI(mob, dx, dz, distToPlayer, delta, onPlayerAttacked);
      } else if (mob.type === 'iron_golem') {
        this.updateIronGolemAI(mob, dx, dz, distToPlayer, delta);
      } else if (mob.type === 'wolf') {
        this.updateWolfAI(mob, dx, dz, distToPlayer, delta);
      } else if (mob.type === 'villager') {
        this.updateVillagerAI(mob, dx, dz, distToPlayer, delta);
      } else if (mob.type === 'rabbit') {
        this.updateRabbitAI(mob, dx, dz, distToPlayer, delta);
      } else {
        this.updateAnimalAI(mob, dx, dz, distToPlayer, delta);
      }

      // Physics and Terrain Collision
      this.applyMobPhysics(mob, delta);

      // Update mesh position and animations
      mesh.position.set(mob.position.x, mob.position.y, mob.position.z);
      mesh.rotation.y = mob.rotationY;

      // Hurt visual tinting
      this.applyHurtEffect(mesh, mob.hurtCooldown > 0);

      // Limb swing animations
      this.animateMobLimbs(mesh, mob, delta);
    }
  }

  private updateSeraphimAI(
    mob: MobEntity,
    dx: number,
    dz: number,
    dist: number,
    delta: number,
    onPlayerAttacked: (dmg: number) => void,
    playerPos: THREE.Vector3
  ) {
    mob.bossPhase = mob.health <= 175 ? 2 : 1;
    mob.bossTitle = mob.bossPhase === 2
      ? '🔥【神聖狂暴 · 壇上紅炭】天界熾天使 · 塞拉芬 (Seraphim, 350 HP)'
      : '✨【聖經六翼 · 全知聖眼】天界熾天使 · 塞拉芬 (Seraphim, 350 HP)';

    // Always face the player
    mob.rotationY = Math.atan2(dx, dz);

    const isPhase2 = mob.bossPhase === 2;
    // Divine hovering altitude
    const targetHoverY = 22 + Math.sin(Date.now() * 0.002) * (isPhase2 ? 3.5 : 2.0);

    // 3D Celestial Flight AI
    if (dist > 22) {
      // Approach player
      const angle = Math.atan2(dx, dz);
      const speed = isPhase2 ? 7.5 : 4.5;
      mob.velocity.x = Math.sin(angle) * speed;
      mob.velocity.z = Math.cos(angle) * speed;
      mob.velocity.y = (targetHoverY - mob.position.y) * 1.5;
    } else if (dist < 10) {
      // Strafe or retreat
      const angle = Math.atan2(dx, dz) + Math.PI;
      const speed = isPhase2 ? 6.0 : 3.5;
      mob.velocity.x = Math.sin(angle) * speed;
      mob.velocity.z = Math.cos(angle) * speed;
      mob.velocity.y = (targetHoverY - mob.position.y) * 1.5;
    } else {
      // Circling majestic orbit around player
      const orbitAngle = Math.atan2(dz, dx) + (isPhase2 ? 1.6 : 1.2);
      const speed = isPhase2 ? 6.5 : 3.8;
      mob.velocity.x = Math.cos(orbitAngle) * speed;
      mob.velocity.z = Math.sin(orbitAngle) * speed;
      mob.velocity.y = (targetHoverY - mob.position.y) * 1.5;
    }

    // Direct melee damage if swooping close in phase 2
    if (isPhase2 && dist < 3.2) {
      onPlayerAttacked(5);
      soundManager.playHit();
    }

    // Boss Attack Timer
    if (typeof mob.bossAttackTimer !== 'number') mob.bossAttackTimer = 2.0;
    mob.bossAttackTimer -= delta;

    if (mob.bossAttackTimer <= 0) {
      mob.bossAttackTimer = isPhase2 ? 1.8 : 3.0;
      soundManager.playSeraphimAttack();

      const roll = Math.random();

      if (roll < 0.4) {
        // BIBLICAL ABILITY 1: 【壇上取下的神聖紅炭 (Burning Live Coals of the Altar - Isaiah 6:6)】
        // Heavy flaming coal cubes that explode with divine purifying fire
        const coalGeom = new THREE.BoxGeometry(0.55, 0.55, 0.55);
        const coalMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
        const dir = new THREE.Vector3(dx, playerPos.y + 0.8 - mob.position.y, dz).normalize();

        const pMesh = new THREE.Mesh(coalGeom, coalMat);
        pMesh.position.set(mob.position.x, mob.position.y + 1.8, mob.position.z);
        this.scene.add(pMesh);

        this.seraphimProjectiles.push({
          mesh: pMesh,
          velocity: dir.multiplyScalar(isPhase2 ? 18 : 13),
          life: 4.5
        });
      } else if (roll < 0.75) {
        // BIBLICAL ABILITY 2: 【六翼熾火神聖羽刃 (Seraphic Fiery Feathers Barrage)】
        // 5-way spread of fiery wings feathers
        const spreadAngles = [-0.3, -0.15, 0, 0.15, 0.3];
        spreadAngles.forEach((spread) => {
          const dir = new THREE.Vector3(dx, playerPos.y + 1.2 - mob.position.y, dz).normalize();
          const rotatedDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
          const pMesh = new THREE.Mesh(this.projectileGeom, this.projectileMat);
          pMesh.position.set(mob.position.x, mob.position.y + 1.6, mob.position.z);
          this.scene.add(pMesh);

          this.seraphimProjectiles.push({
            mesh: pMesh,
            velocity: rotatedDir.multiplyScalar(isPhase2 ? 16 : 12),
            life: 4.5
          });
        });
      } else {
        // BIBLICAL ABILITY 3: 【三聖頌神聖天音震動 & 全知聖眼神光 (Trisagion Shockwave & Omniscient Gaze - Isaiah 6:3-4)】
        // 8 radiating beams in all directions (Ophanim wheels attack)
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const dir = new THREE.Vector3(Math.cos(angle), -0.15, Math.sin(angle)).normalize();
          const pMesh = new THREE.Mesh(this.projectileGeom, this.projectileMat);
          pMesh.position.set(mob.position.x, mob.position.y + 1.6, mob.position.z);
          this.scene.add(pMesh);

          this.seraphimProjectiles.push({
            mesh: pMesh,
            velocity: dir.multiplyScalar(14),
            life: 4.0
          });
        }
      }
    }
  }

  private updateCreeperAI(
    mob: MobEntity,
    mesh: THREE.Group,
    dx: number,
    dz: number,
    dist: number,
    delta: number,
    onPlayerAttacked: (dmg: number) => void
  ) {
    let fuse = this.creeperFuseState.get(mob.id);
    if (!fuse) {
      fuse = { timer: 0, hissed: false };
      this.creeperFuseState.set(mob.id, fuse);
    }

    if (dist <= 3.4) {
      // In explosion priming range!
      mob.state = 'attack';
      mob.velocity.x = 0;
      mob.velocity.z = 0;
      mob.rotationY = Math.atan2(dx, dz);

      if (!fuse.hissed) {
        soundManager.playCreeperHiss();
        fuse.hissed = true;
      }

      fuse.timer += delta;
      // White flashing & swelling
      const swell = 1.0 + (fuse.timer / 1.4) * 0.35;
      mesh.scale.set(swell, swell, swell);

      if (fuse.timer >= 1.4) {
        // DETONATE!
        this.world.explodeAt(mob.position.x, mob.position.y + 0.5, mob.position.z, 3.5);
        if (dist <= 5.0) {
          onPlayerAttacked(Math.floor(15 - dist * 2));
        }
        this.removeMob(mob.id);
        this.creeperFuseState.delete(mob.id);
        return;
      }
    } else if (dist <= 16) {
      // Chase player silently
      mob.state = 'chase';
      const speed = 2.1;
      const angle = Math.atan2(dx, dz);
      mob.rotationY = angle;
      mob.velocity.x = Math.sin(angle) * speed;
      mob.velocity.z = Math.cos(angle) * speed;

      // Reset fuse if escaped
      if (fuse.timer > 0) {
        fuse.timer = Math.max(0, fuse.timer - delta * 2);
        mesh.scale.set(1, 1, 1);
        if (fuse.timer === 0) fuse.hissed = false;
      }
    } else {
      mob.state = 'idle';
      mob.velocity.x = 0;
      mob.velocity.z = 0;
      mesh.scale.set(1, 1, 1);
      if (fuse.timer > 0) {
        fuse.timer = 0;
        fuse.hissed = false;
      }
    }
  }

  private updateZombieAI(
    mob: MobEntity,
    dx: number,
    dz: number,
    dist: number,
    delta: number,
    onPlayerAttacked: (dmg: number) => void
  ) {
    if (dist <= 1.4) {
      mob.state = 'attack';
      mob.velocity.x *= 0.5;
      mob.velocity.z *= 0.5;
      mob.rotationY = Math.atan2(dx, dz);

      if (mob.attackCooldown <= 0) {
        mob.attackCooldown = 1.2;
        soundManager.playPlayerHurt();
        onPlayerAttacked(3);
      }
    } else if (dist <= 18) {
      mob.state = 'chase';
      const speed = 2.0;
      const angle = Math.atan2(dx, dz);
      mob.rotationY = angle;
      mob.velocity.x = Math.sin(angle) * speed;
      mob.velocity.z = Math.cos(angle) * speed;

      // Occasional zombie groan
      if (Math.random() < 0.005) {
        soundManager.playZombieGroan();
      }
    } else {
      mob.state = 'idle';
      mob.velocity.x = 0;
      mob.velocity.z = 0;
    }
  }

  private updateAnimalAI(
    mob: MobEntity,
    dx: number,
    dz: number,
    dist: number,
    delta: number
  ) {
    // Wander peacefully
    mob.stateTimer -= delta;
    if (mob.stateTimer <= 0) {
      if (mob.state === 'idle') {
        mob.state = 'wander';
        mob.rotationY = Math.random() * Math.PI * 2;
        mob.stateTimer = 2.5 + Math.random() * 3.5;
        if (Math.random() < 0.25) {
          soundManager.playAnimalSound();
        }
      } else {
        mob.state = 'idle';
        mob.velocity.x = 0;
        mob.velocity.z = 0;
        mob.stateTimer = 2 + Math.random() * 2;
      }
    }

    if (mob.state === 'wander') {
      const speed = mob.type === 'rabbit' ? 1.4 : mob.type === 'chicken' ? 1.1 : 0.9;
      mob.velocity.x = Math.sin(mob.rotationY) * speed;
      mob.velocity.z = Math.cos(mob.rotationY) * speed;
      if (mob.isGrounded && Math.random() < 0.08) {
        mob.velocity.y = mob.type === 'rabbit' ? 2.5 : mob.type === 'chicken' ? 2.1 : 1.5;
      }
    }
  }

  private updateSpiderAI(
    mob: MobEntity,
    dx: number,
    dz: number,
    dist: number,
    delta: number,
    onPlayerAttacked: (dmg: number) => void
  ) {
    if (dist <= 1.5) {
      mob.state = 'attack';
      mob.velocity.x *= 0.5;
      mob.velocity.z *= 0.5;
      mob.rotationY = Math.atan2(dx, dz);

      if (mob.attackCooldown <= 0) {
        mob.attackCooldown = 1.0;
        soundManager.playPlayerHurt();
        onPlayerAttacked(this.difficulty === 'easy' ? 1.5 : 2.5);
      }
    } else if (dist <= 18) {
      mob.state = 'chase';
      const angle = Math.atan2(dx, dz);
      mob.rotationY = angle;
      const speed = 3.2;
      mob.velocity.x = Math.sin(angle) * speed;
      mob.velocity.z = Math.cos(angle) * speed;
      // Agile pounce jump
      if (mob.isGrounded && dist < 5.5 && Math.random() < 0.08) {
        mob.velocity.y = 3.8;
      }
    } else {
      mob.stateTimer -= delta;
      if (mob.stateTimer <= 0) {
        mob.state = mob.state === 'idle' ? 'wander' : 'idle';
        mob.rotationY = Math.random() * Math.PI * 2;
        mob.stateTimer = 2 + Math.random() * 2;
      }
      if (mob.state === 'wander') {
        mob.velocity.x = Math.sin(mob.rotationY) * 1.4;
        mob.velocity.z = Math.cos(mob.rotationY) * 1.4;
      } else {
        mob.velocity.x = 0;
        mob.velocity.z = 0;
      }
    }
  }

  private updateEndermanAI(
    mob: MobEntity,
    dx: number,
    dz: number,
    dist: number,
    delta: number,
    onPlayerAttacked: (dmg: number) => void
  ) {
    if (dist <= 1.8) {
      mob.state = 'attack';
      mob.velocity.x *= 0.4;
      mob.velocity.z *= 0.4;
      mob.rotationY = Math.atan2(dx, dz);
      if (mob.attackCooldown <= 0) {
        mob.attackCooldown = 1.1;
        soundManager.playPlayerHurt();
        onPlayerAttacked(this.difficulty === 'easy' ? 2.5 : 4.0);
      }
    } else if (dist <= 16) {
      mob.state = 'chase';
      const angle = Math.atan2(dx, dz);
      mob.rotationY = angle;
      const speed = 3.0;
      mob.velocity.x = Math.sin(angle) * speed;
      mob.velocity.z = Math.cos(angle) * speed;
    } else {
      mob.stateTimer -= delta;
      if (mob.stateTimer <= 0) {
        mob.state = mob.state === 'idle' ? 'wander' : 'idle';
        mob.rotationY = Math.random() * Math.PI * 2;
        mob.stateTimer = 2.5 + Math.random() * 3;
      }
      if (mob.state === 'wander') {
        mob.velocity.x = Math.sin(mob.rotationY) * 1.1;
        mob.velocity.z = Math.cos(mob.rotationY) * 1.1;
      } else {
        mob.velocity.x = 0;
        mob.velocity.z = 0;
      }
    }
  }

  private updateWolfAI(
    mob: MobEntity,
    dx: number,
    dz: number,
    dist: number,
    delta: number
  ) {
    // Hunts nearby skeletons or rabbits; otherwise stays friendly and trots near player
    let prey: MobEntity | null = null;
    let preyDist = 12;
    for (const other of this.mobs) {
      if (other.id === mob.id) continue;
      if (other.type === 'skeleton' || other.type === 'rabbit') {
        const pd = Math.hypot(other.position.x - mob.position.x, other.position.z - mob.position.z);
        if (pd < preyDist) {
          preyDist = pd;
          prey = other;
        }
      }
    }

    if (prey) {
      const pdx = prey.position.x - mob.position.x;
      const pdz = prey.position.z - mob.position.z;
      const angle = Math.atan2(pdx, pdz);
      mob.rotationY = angle;
      if (preyDist <= 1.4) {
        mob.state = 'attack';
        mob.velocity.x *= 0.4;
        mob.velocity.z *= 0.4;
        if (mob.attackCooldown <= 0) {
          mob.attackCooldown = 1.0;
          this.damageMob(prey.id, 4, new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)));
        }
      } else {
        mob.state = 'chase';
        mob.velocity.x = Math.sin(angle) * 2.8;
        mob.velocity.z = Math.cos(angle) * 2.8;
      }
      return;
    }

    if (dist < 4.5) {
      mob.state = 'idle';
      mob.velocity.x *= 0.5;
      mob.velocity.z *= 0.5;
      mob.rotationY = Math.atan2(dx, dz);
    } else {
      this.updateAnimalAI(mob, dx, dz, dist, delta);
    }
  }

  private updateIronGolemAI(
    mob: MobEntity,
    dx: number,
    dz: number,
    dist: number,
    delta: number
  ) {
    // Protects village & player by targeting nearby hostile monsters
    let targetMonster: MobEntity | null = null;
    let closestMonsterDist = 16;
    for (const other of this.mobs) {
      if (
        other.type === 'zombie' ||
        other.type === 'skeleton' ||
        other.type === 'creeper' ||
        other.type === 'spider' ||
        other.type === 'enderman'
      ) {
        const md = Math.hypot(other.position.x - mob.position.x, other.position.z - mob.position.z);
        if (md < closestMonsterDist) {
          closestMonsterDist = md;
          targetMonster = other;
        }
      }
    }

    if (targetMonster) {
      const mdx = targetMonster.position.x - mob.position.x;
      const mdz = targetMonster.position.z - mob.position.z;
      const angle = Math.atan2(mdx, mdz);
      mob.rotationY = angle;
      if (closestMonsterDist <= 2.1) {
        mob.state = 'attack';
        mob.velocity.x *= 0.3;
        mob.velocity.z *= 0.3;
        if (mob.attackCooldown <= 0) {
          mob.attackCooldown = 1.1;
          const kb = new THREE.Vector3(Math.sin(angle), 0.7, Math.cos(angle)).normalize();
          this.damageMob(targetMonster.id, 10, kb);
        }
      } else {
        mob.state = 'chase';
        mob.velocity.x = Math.sin(angle) * 2.2;
        mob.velocity.z = Math.cos(angle) * 2.2;
      }
      return;
    }

    // Patrol peacefully
    mob.stateTimer -= delta;
    if (mob.stateTimer <= 0) {
      if (mob.state === 'idle') {
        mob.state = 'wander';
        mob.rotationY = Math.random() * Math.PI * 2;
        mob.stateTimer = 3 + Math.random() * 3;
      } else {
        mob.state = 'idle';
        mob.velocity.x = 0;
        mob.velocity.z = 0;
        mob.stateTimer = 2 + Math.random() * 2;
      }
    }
    if (mob.state === 'wander') {
      mob.velocity.x = Math.sin(mob.rotationY) * 0.8;
      mob.velocity.z = Math.cos(mob.rotationY) * 0.8;
    }
  }

  private updateSkeletonAI(
    mob: MobEntity,
    dx: number,
    dz: number,
    dist: number,
    delta: number,
    onPlayerAttacked: (dmg: number) => void
  ) {
    const chaseRange = 18;
    const attackRange = 1.4;

    if (dist <= attackRange) {
      // In attack range
      mob.state = 'attack';
      mob.velocity.x *= 0.5;
      mob.velocity.z *= 0.5;
      mob.rotationY = Math.atan2(dx, dz);

      if (mob.attackCooldown <= 0) {
        mob.attackCooldown = 1.5;
        soundManager.playPlayerHurt();
        const damage = this.difficulty === 'easy' ? 1.5 : 2.5;
        onPlayerAttacked(damage);
      }
    } else if (dist <= chaseRange) {
      // Chase player aggressively!
      mob.state = 'chase';
      const speed = 2.4;
      const angle = Math.atan2(dx, dz);
      mob.rotationY = angle;
      mob.velocity.x = Math.sin(angle) * speed;
      mob.velocity.z = Math.cos(angle) * speed;
    } else {
      // Idle or wander
      mob.stateTimer -= delta;
      if (mob.stateTimer <= 0) {
        if (mob.state === 'idle') {
          mob.state = 'wander';
          mob.rotationY = Math.random() * Math.PI * 2;
          mob.stateTimer = 2 + Math.random() * 3;
        } else {
          mob.state = 'idle';
          mob.velocity.x = 0;
          mob.velocity.z = 0;
          mob.stateTimer = 1.5 + Math.random() * 2;
        }
      }

      if (mob.state === 'wander') {
        const speed = 1.0;
        mob.velocity.x = Math.sin(mob.rotationY) * speed;
        mob.velocity.z = Math.cos(mob.rotationY) * speed;
      }
    }
  }

  private updateRabbitAI(
    mob: MobEntity,
    dx: number,
    dz: number,
    dist: number,
    delta: number
  ) {
    const fleeRange = 6.5;

    if (dist < fleeRange) {
      // Flee away from player!
      mob.state = 'flee';
      const fleeAngle = Math.atan2(-dx, -dz);
      mob.rotationY = fleeAngle;
      const speed = 3.8;
      mob.velocity.x = Math.sin(fleeAngle) * speed;
      mob.velocity.z = Math.cos(fleeAngle) * speed;

      // Small hops when fleeing
      if (mob.isGrounded && Math.random() < 0.25) {
        mob.velocity.y = 3.5;
      }
    } else {
      // Wander peacefully
      mob.stateTimer -= delta;
      if (mob.stateTimer <= 0) {
        if (mob.state === 'idle') {
          mob.state = 'wander';
          mob.rotationY = Math.random() * Math.PI * 2;
          mob.stateTimer = 2 + Math.random() * 3;
        } else {
          mob.state = 'idle';
          mob.velocity.x = 0;
          mob.velocity.z = 0;
          mob.stateTimer = 2 + Math.random() * 2;
        }
      }

      if (mob.state === 'wander') {
        const speed = 1.2;
        mob.velocity.x = Math.sin(mob.rotationY) * speed;
        mob.velocity.z = Math.cos(mob.rotationY) * speed;
        if (mob.isGrounded && Math.random() < 0.1) {
          mob.velocity.y = 2.5; // gentle cute hop
        }
      }
    }
  }

  private updateVillagerAI(
    mob: MobEntity,
    dx: number,
    dz: number,
    dist: number,
    delta: number
  ) {
    // If player is close by (< 4 blocks), villager looks curiously at player and stops
    if (dist < 4.0) {
      mob.state = 'idle';
      mob.velocity.x *= 0.3;
      mob.velocity.z *= 0.3;
      // Turn to face player smoothly
      const targetAngle = Math.atan2(dx, dz);
      let angleDiff = targetAngle - mob.rotationY;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      mob.rotationY += angleDiff * Math.min(1, delta * 4);

      // Occasional friendly greeting grunt
      mob.stateTimer -= delta;
      if (mob.stateTimer <= 0) {
        if (Math.random() < 0.4) {
          soundManager.playVillagerHrmm();
        }
        mob.stateTimer = 8 + Math.random() * 8;
      }
      return;
    }

    // Peaceful wander around village
    mob.stateTimer -= delta;
    if (mob.stateTimer <= 0) {
      if (mob.state === 'idle') {
        mob.state = 'wander';
        mob.rotationY = Math.random() * Math.PI * 2;
        mob.stateTimer = 3 + Math.random() * 4;
        if (Math.random() < 0.2) {
          soundManager.playVillagerHrmm();
        }
      } else {
        mob.state = 'idle';
        mob.velocity.x = 0;
        mob.velocity.z = 0;
        mob.stateTimer = 2 + Math.random() * 3;
      }
    }

    if (mob.state === 'wander') {
      const speed = 1.1; // Gentle stroll
      mob.velocity.x = Math.sin(mob.rotationY) * speed;
      mob.velocity.z = Math.cos(mob.rotationY) * speed;
    }
  }

  private applyMobPhysics(mob: MobEntity, delta: number) {
    // Gravity (Chickens flap gently to glide)
    mob.velocity.y -= 16 * delta;
    if (mob.type === 'chicken' && mob.velocity.y < -2.4) {
      mob.velocity.y = -2.4;
    }

    // Proposed new positions
    const nextX = mob.position.x + mob.velocity.x * delta;
    const nextZ = mob.position.z + mob.velocity.z * delta;
    let nextY = mob.position.y + mob.velocity.y * delta;

    // Check foot block
    const blockAtNext = this.world.getBlock(nextX, mob.position.y + 0.1, nextZ);
    const blockAbove = this.world.getBlock(nextX, mob.position.y + 1.1, nextZ);

    if (blockAtNext !== 'air') {
      // Can step up 1 block?
      if (blockAbove === 'air' && mob.isGrounded) {
        nextY = Math.floor(mob.position.y) + 1.0;
        mob.velocity.y = 0;
      } else {
        // Blocked horizontally
        mob.velocity.x = 0;
        mob.velocity.z = 0;
        if (mob.state === 'wander') {
          mob.rotationY += Math.PI * 0.5 + Math.random() * 0.5;
        }
      }
    }

    // Ground check
    const floorY = this.findSurfaceY(nextX, nextZ);
    if (nextY <= floorY) {
      nextY = floorY;
      mob.velocity.y = 0;
      mob.isGrounded = true;
    } else {
      mob.isGrounded = false;
    }

    mob.position.x = nextX;
    mob.position.y = nextY;
    mob.position.z = nextZ;
  }

  private applyHurtEffect(mesh: THREE.Group, isHurt: boolean) {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.userData.origMaterial) {
          child.userData.origMaterial = child.material;
        }
        if (isHurt) {
          child.material = this.hurtMat;
        } else if (child.userData.origMaterial && child.material === this.hurtMat) {
          child.material = child.userData.origMaterial;
        }
      }
    });
  }

  private animateMobLimbs(mesh: THREE.Group, mob: MobEntity, delta: number) {
    const isMoving = Math.abs(mob.velocity.x) > 0.1 || Math.abs(mob.velocity.z) > 0.1;
    const time = performance.now() * 0.008;
    const vipDynamicActive = isVipActive();

    // 全新世界動態 (VIP 會員專屬動態物理): 呼吸律動與重心微擺
    if (vipDynamicActive) {
      const breathPulse = Math.sin(time * 3 + mob.rotationY) * 0.025;
      mesh.position.y = mob.position.y + Math.max(0, breathPulse);

      // Subtle dynamic banking / tilt when moving or turning
      if (isMoving) {
        mesh.rotation.z = Math.sin(time * 2) * 0.04;
      } else {
        mesh.rotation.z = 0;
      }
    }

    if (mob.type === 'skeleton') {
      const legL = mesh.getObjectByName('leg_l');
      const legR = mesh.getObjectByName('leg_r');
      const armL = mesh.getObjectByName('arm_l');
      const armR = mesh.getObjectByName('arm_r');
      const head = mesh.getObjectByName('head');

      if (legL && legR) {
        if (isMoving) {
          const swingScale = vipDynamicActive ? 0.75 : 0.6;
          legL.rotation.x = Math.sin(time) * swingScale;
          legR.rotation.x = -Math.sin(time) * swingScale;
        } else {
          legL.rotation.x = 0;
          legR.rotation.x = 0;
        }
      }

      // VIP Dynamic Arms & Bow Aiming Sway
      if (vipDynamicActive) {
        if (armR) {
          armR.rotation.x = -1.2 + Math.sin(time * 1.5) * 0.08;
        }
        if (armL) {
          armL.rotation.x = -1.1 + Math.cos(time * 1.5) * 0.08;
        }
        if (head && mob.state === 'chase') {
          head.rotation.y = Math.sin(time * 4) * 0.1;
        }
      }
    } else if (mob.type === 'villager') {
      const legL = mesh.getObjectByName('leg_l');
      const legR = mesh.getObjectByName('leg_r');
      const head = mesh.getObjectByName('head');
      const body = mesh.getObjectByName('body');

      if (legL && legR) {
        if (isMoving) {
          const swingScale = vipDynamicActive ? 0.65 : 0.5;
          legL.rotation.x = Math.sin(time) * swingScale;
          legR.rotation.x = -Math.sin(time) * swingScale;
        } else {
          legL.rotation.x = 0;
          legR.rotation.x = 0;
        }
      }

      if (head) {
        if (mob.state === 'idle') {
          head.rotation.y = Math.sin(time * 0.4) * (vipDynamicActive ? 0.16 : 0.08);
          if (vipDynamicActive) {
            head.rotation.x = Math.sin(time * 0.6) * 0.06; // Dynamic curtsy nod
          }
        } else if (isMoving && vipDynamicActive) {
          head.rotation.y = Math.sin(time * 1.2) * 0.05;
        }
      }

      if (vipDynamicActive && body) {
        // Dynamic breathing scale
        const scaleBreath = 1.0 + Math.sin(time * 2.2) * 0.015;
        body.scale.set(1.0, scaleBreath, 1.0);
      }
    } else if (mob.type === 'rabbit') {
      // Rabbit hop tilt & dynamic ear twitches
      const body = mesh.getObjectByName('body');
      if (body) {
        if (!mob.isGrounded) {
          body.rotation.x = -0.3;
        } else {
          body.rotation.x = 0;
        }
        if (vipDynamicActive && mob.isGrounded) {
          body.scale.y = 1.0 + Math.sin(time * 4) * 0.03;
        }
      }

      // VIP Dynamic ear twitches
      if (vipDynamicActive) {
        const earL = mesh.getObjectByName('ear_l');
        const earR = mesh.getObjectByName('ear_r');
        if (earL && earR) {
          earL.rotation.z = Math.sin(time * 5) * 0.08;
          earR.rotation.z = -Math.sin(time * 5) * 0.08;
        }
      }
    } else if (mob.type === 'seraphim') {
      const isPhase2 = mob.bossPhase === 2;
      const flyFreq = isPhase2 ? 7.5 : 4.5;
      const flapAngle = Math.sin(time * flyFreq) * (isPhase2 ? 0.45 : 0.3);

      // 1. FLIGHT WINGS (飛翔雙翼 - majestic sweeping wing flaps)
      const wingFlyL = mesh.getObjectByName('wing_fly_l');
      const wingFlyR = mesh.getObjectByName('wing_fly_r');
      if (wingFlyL && wingFlyR) {
        wingFlyL.rotation.y = flapAngle;
        wingFlyL.rotation.z = 0.2 + Math.cos(time * flyFreq) * 0.12;
        wingFlyR.rotation.y = -flapAngle;
        wingFlyR.rotation.z = -0.2 - Math.cos(time * flyFreq) * 0.12;
      }

      // 2. FACE-COVERING WINGS (遮面雙翼 - gentle celestial breathing & reverence)
      const wingFaceL = mesh.getObjectByName('wing_face_l');
      const wingFaceR = mesh.getObjectByName('wing_face_r');
      if (wingFaceL && wingFaceR) {
        const breath = Math.sin(time * 2.4) * 0.08;
        wingFaceL.rotation.y = 0.3 + breath;
        wingFaceL.rotation.x = breath * 0.5;
        wingFaceR.rotation.y = -0.3 - breath;
        wingFaceR.rotation.x = breath * 0.5;
      }

      // 3. FEET-COVERING WINGS (遮腳雙翼 - holy gentle swaying)
      const wingFeetL = mesh.getObjectByName('wing_feet_l');
      const wingFeetR = mesh.getObjectByName('wing_feet_r');
      if (wingFeetL && wingFeetR) {
        const feetBreath = Math.cos(time * 2.0) * 0.06;
        wingFeetL.rotation.y = 0.25 + feetBreath;
        wingFeetL.rotation.x = -feetBreath * 0.5;
        wingFeetR.rotation.y = -0.25 - feetBreath;
        wingFeetR.rotation.x = -feetBreath * 0.5;
      }

      // 4. OPHANIM INTERLOCKING GYROSCOPIC WHEELS OF FIRE (輪中之輪旋轉)
      const ringOuter = mesh.getObjectByName('ophanim_ring_outer');
      const ringInner = mesh.getObjectByName('ophanim_ring_inner');
      const spinSpeed = isPhase2 ? 3.0 : 1.4;
      if (ringOuter) {
        ringOuter.rotation.x += delta * spinSpeed * 1.5;
        ringOuter.rotation.z += delta * spinSpeed * 0.9;
      }
      if (ringInner) {
        ringInner.rotation.y += delta * spinSpeed * -2.0;
        ringInner.rotation.x += delta * spinSpeed * -1.1;
      }

      // 5. PULSING FLAMING HOLY CORE
      const core = mesh.getObjectByName('fire_core');
      if (core) {
        const pulse = 1.0 + Math.sin(time * (isPhase2 ? 8 : 4.5)) * (isPhase2 ? 0.16 : 0.08);
        core.scale.set(pulse, pulse, pulse);
      }

      // 6. ROTATING HALO & ORBITING SPARKS
      const halo = mesh.getObjectByName('halo');
      if (halo) {
        halo.rotation.z += delta * (isPhase2 ? 3.2 : 1.6);
      }

      const sparks = mesh.getObjectByName('holy_sparks');
      if (sparks) {
        sparks.rotation.y += delta * (isPhase2 ? 2.5 : 1.2);
      }
    } else if (mob.type === 'spider') {
      for (let i = 0; i < 4; i++) {
        const legL = mesh.getObjectByName(`sleg_l_${i}`);
        const legR = mesh.getObjectByName(`sleg_r_${i}`);
        const phase = i % 2 === 0 ? 0 : Math.PI;
        if (legL) legL.rotation.y = (i - 1.5) * 0.22 + (isMoving ? Math.sin(time * 2.2 + phase) * 0.28 : 0);
        if (legR) legR.rotation.y = -(i - 1.5) * 0.22 - (isMoving ? Math.sin(time * 2.2 + phase) * 0.28 : 0);
      }
    } else if (mob.type === 'chicken') {
      const legL = mesh.getObjectByName('leg_l');
      const legR = mesh.getObjectByName('leg_r');
      const wingL = mesh.getObjectByName('wing_l');
      const wingR = mesh.getObjectByName('wing_r');
      if (legL && legR) {
        legL.rotation.x = isMoving ? Math.sin(time * 1.8) * 0.65 : 0;
        legR.rotation.x = isMoving ? -Math.sin(time * 1.8) * 0.65 : 0;
      }
      if (wingL && wingR) {
        const flap = !mob.isGrounded ? Math.sin(time * 4.5) * 0.75 + 0.5 : isMoving ? Math.sin(time * 2) * 0.15 : 0;
        wingL.rotation.z = flap;
        wingR.rotation.z = -flap;
      }
    } else if (mob.type === 'zombie' || mob.type === 'enderman' || mob.type === 'iron_golem') {
      const legL = mesh.getObjectByName('leg_l');
      const legR = mesh.getObjectByName('leg_r');
      const armL = mesh.getObjectByName('arm_l');
      const armR = mesh.getObjectByName('arm_r');
      const swing = isMoving ? Math.sin(time) * 0.6 : 0;
      if (legL && legR) {
        legL.rotation.x = swing;
        legR.rotation.x = -swing;
      }
      if (armL && armR && mob.type !== 'zombie') {
        armL.rotation.x = mob.state === 'attack' ? -1.4 : -swing * 0.85;
        armR.rotation.x = mob.state === 'attack' ? -1.4 : swing * 0.85;
      }
    } else if (
      mob.type === 'pig' ||
      mob.type === 'cow' ||
      mob.type === 'sheep' ||
      mob.type === 'wolf' ||
      mob.type === 'creeper'
    ) {
      const fl = mesh.getObjectByName('paw_fl');
      const fr = mesh.getObjectByName('paw_fr');
      const bl = mesh.getObjectByName('paw_bl');
      const br = mesh.getObjectByName('paw_br');
      const swing = isMoving ? Math.sin(time * 1.2) * 0.55 : 0;
      if (fl) fl.rotation.x = swing;
      if (br) br.rotation.x = swing;
      if (fr) fr.rotation.x = -swing;
      if (bl) bl.rotation.x = -swing;
      if (mob.type === 'wolf') {
        const tail = mesh.getObjectByName('tail');
        if (tail) tail.rotation.z = Math.sin(time * 2.5) * 0.25;
      }
    }
  }

  private trySpawnAroundPlayer(playerPos: THREE.Vector3, mobSpawnMultiplier: number) {
    const currentMonsters = this.mobs.filter(
      (m) => m.type === 'skeleton' || m.type === 'zombie' || m.type === 'creeper' || m.type === 'spider' || m.type === 'enderman'
    ).length;
    const currentAnimals = this.mobs.filter(
      (m) => m.type === 'rabbit' || m.type === 'cow' || m.type === 'pig' || m.type === 'sheep' || m.type === 'chicken' || m.type === 'wolf'
    ).length;

    // Monsters: high multiplier at night or stormy weather (never spawn in peaceful)
    const maxMonsters = this.difficulty === 'peaceful' ? 0 : Math.floor(9 * mobSpawnMultiplier);
    if (this.difficulty !== 'peaceful' && currentMonsters < maxMonsters && Math.random() < mobSpawnMultiplier) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 22 + Math.random() * 18;
      const x = playerPos.x + Math.cos(angle) * dist;
      const z = playerPos.z + Math.sin(angle) * dist;
      const y = this.findSurfaceY(x, z);

      const roll = Math.random();
      const mobType: MobType =
        roll < 0.28
          ? 'zombie'
          : roll < 0.54
          ? 'skeleton'
          : roll < 0.74
          ? 'spider'
          : roll < 0.90
          ? 'creeper'
          : 'enderman';
      this.createMob(mobType, x, y, z);
    }

    // Peaceful / Biome-adaptive Animals
    if (currentAnimals < 9 && Math.random() < 0.5) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * 18;
      const x = playerPos.x + Math.cos(angle) * dist;
      const z = playerPos.z + Math.sin(angle) * dist;
      const y = this.findSurfaceY(x, z);
      const biome = this.world.getBiome(x, z);

      let animalType: MobType = 'sheep';
      const roll = Math.random();
      if (biome === 'snow') {
        animalType = roll < 0.45 ? 'wolf' : roll < 0.75 ? 'rabbit' : 'sheep';
      } else if (biome === 'forest') {
        animalType = roll < 0.28 ? 'wolf' : roll < 0.55 ? 'chicken' : roll < 0.8 ? 'sheep' : 'pig';
      } else if (biome === 'desert') {
        animalType = 'rabbit';
      } else if (biome === 'swamp') {
        animalType = roll < 0.5 ? 'pig' : 'chicken';
      } else {
        animalType = roll < 0.24 ? 'cow' : roll < 0.48 ? 'pig' : roll < 0.72 ? 'sheep' : roll < 0.9 ? 'chicken' : 'rabbit';
      }
      this.createMob(animalType, x, y, z);
    }
  }

  public checkPlayerAttackRay(
    rayOrigin: THREE.Vector3,
    rayDir: THREE.Vector3,
    range: number = 3.8
  ): { hitMob: MobEntity; distance: number } | null {
    let closestMob: MobEntity | null = null;
    let closestDist = range;

    for (const mob of this.mobs) {
      const isBoss = mob.type === 'seraphim';
      const isTall = mob.type === 'enderman' || mob.type === 'iron_golem';
      const isSpider = mob.type === 'spider';
      const isSmall = mob.type === 'rabbit' || mob.type === 'chicken';
      const effectiveMaxDist = isBoss ? 16.0 : range;
      const boxCenterY = mob.position.y + (isBoss ? 1.8 : isTall ? 1.4 : isSpider ? 0.45 : isSmall ? 0.35 : 0.8);
      const boxSize = isBoss
        ? new THREE.Vector3(3.2, 4.0, 3.2)
        : isTall
        ? new THREE.Vector3(1.0, 2.75, 1.0)
        : isSpider
        ? new THREE.Vector3(1.3, 0.9, 1.3)
        : isSmall
        ? new THREE.Vector3(0.65, 0.7, 0.65)
        : new THREE.Vector3(0.85, 1.8, 0.85);

      const mobBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(mob.position.x, boxCenterY, mob.position.z),
        boxSize
      );

      const ray = new THREE.Ray(rayOrigin, rayDir);
      const hitPoint = ray.intersectBox(mobBox, new THREE.Vector3());
      if (hitPoint) {
        const d = rayOrigin.distanceTo(hitPoint);
        if (d <= effectiveMaxDist && d < closestDist) {
          closestDist = d;
          closestMob = mob;
        }
      }
    }

    return closestMob ? { hitMob: closestMob, distance: closestDist } : null;
  }

  public checkPlayerInteractRay(
    rayOrigin: THREE.Vector3,
    rayDir: THREE.Vector3,
    range: number = 4.2
  ): MobEntity | null {
    let closestVillager: MobEntity | null = null;
    let closestDist = range;

    for (const mob of this.mobs) {
      if (mob.type !== 'villager') continue;
      const mobBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(mob.position.x, mob.position.y + 0.9, mob.position.z),
        new THREE.Vector3(1.0, 2.0, 1.0)
      );

      const ray = new THREE.Ray(rayOrigin, rayDir);
      const hitPoint = ray.intersectBox(mobBox, new THREE.Vector3());
      if (hitPoint) {
        const d = rayOrigin.distanceTo(hitPoint);
        if (d < closestDist) {
          closestDist = d;
          closestVillager = mob;
        }
      }
    }

    return closestVillager;
  }
}
