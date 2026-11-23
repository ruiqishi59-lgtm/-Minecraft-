import * as THREE from 'three';
import { CharacterSkin } from '../types';

export const CHARACTER_SKINS: CharacterSkin[] = [
  {
    id: 'steve',
    name: '史蒂夫 (Steve)',
    description: '經典藍青色短袖上衣、牛仔褲與棕髮，原汁原味的方塊探險家。',
    hairColor: '#4a2f1b',
    skinColor: '#bd8b72',
    shirtColor: '#00a8aa',
    pantsColor: '#2b3982',
    shoesColor: '#5c5c5c',
    eyeColor: '#4141a0',
    accentColor: '#00838f'
  },
  {
    id: 'alex',
    name: '艾莉絲 (Alex)',
    description: '亮橙色編織長髮、草綠色輕裝襯衫與深灰褲，敏捷靈巧的荒野冒險者。',
    hairColor: '#cf6328',
    skinColor: '#e0b094',
    shirtColor: '#5b8731',
    pantsColor: '#423c3b',
    shoesColor: '#5c5c5c',
    eyeColor: '#2e7d32',
    accentColor: '#7cb342'
  },
  {
    id: 'diamond_knight',
    name: '鑽石裝甲騎士',
    description: '身穿閃耀天青光芒的整套鑽石厚重盔甲，堅不可摧的無畏勇者。',
    hairColor: '#1a237e',
    skinColor: '#c59b7d',
    shirtColor: '#26c6da',
    pantsColor: '#00acc1',
    shoesColor: '#00838f',
    eyeColor: '#00e5ff',
    accentColor: '#80deea'
  },
  {
    id: 'ender_hoodie',
    name: '終界黑衣衛',
    description: '身著神秘暗夜連帽風衣，雙眼閃爍終界紫芒的末影行者。',
    hairColor: '#121212',
    skinColor: '#ba8c73',
    shirtColor: '#1e1b2e',
    pantsColor: '#171520',
    shoesColor: '#100e17',
    eyeColor: '#d500f9',
    accentColor: '#aa00ff'
  },
  {
    id: 'creeper_camo',
    name: '苦力怕偽裝者',
    description: '身穿綠黑相間像素迷彩衛衣，巧妙混入怪物陣營的生存行家。',
    hairColor: '#2e5618',
    skinColor: '#c79c80',
    shirtColor: '#43a047',
    pantsColor: '#2e7d32',
    shoesColor: '#1b5e20',
    eyeColor: '#000000',
    accentColor: '#1b5e20'
  },
  {
    id: 'aether_angel',
    name: '天堂天使守衛',
    description: '來自天空浮島的聖光戰士，純白神聖戰袍鑲嵌璀璨金邊。',
    hairColor: '#fff9c4',
    skinColor: '#f5d6c6',
    shirtColor: '#ffffff',
    pantsColor: '#e0e0e0',
    shoesColor: '#ffd700',
    eyeColor: '#00b0ff',
    accentColor: '#ffb300'
  },
  {
    id: 'cyber_steve',
    name: '賽博龐克探險家',
    description: '高科技螢光戰術服、全息面罩與霓虹線路，穿梭維度的數位遊俠。',
    hairColor: '#212121',
    skinColor: '#bcaaa4',
    shirtColor: '#263238',
    pantsColor: '#37474f',
    shoesColor: '#00e676',
    eyeColor: '#00e676',
    accentColor: '#00e5ff'
  },
  {
    id: 'zombie_costume',
    name: '殭屍裝扮',
    description: '偽裝成夜行殭屍的怪誕戲服，破舊青色襯衫與青苔綠膚色。',
    hairColor: '#1b4028',
    skinColor: '#568343',
    shirtColor: '#00796b',
    pantsColor: '#1a237e',
    shoesColor: '#212121',
    eyeColor: '#000000',
    accentColor: '#388e3c'
  },
  // ==========================================
  // 精緻人物系列 (Deluxe Characters) - 統一售價 1000 積分
  // ==========================================
  {
    id: 'seraph_paladin',
    name: '熾天使聖騎 (Seraph Paladin)',
    description: '【高階精緻造型】天界最高階熾天使戰士，身披聖光流金戰甲、懸浮光環與以太天界羽翼披風。',
    hairColor: '#fff8e1',
    skinColor: '#ffe0b2',
    shirtColor: '#ffd54f',
    pantsColor: '#ffecb3',
    shoesColor: '#ffb300',
    eyeColor: '#00e5ff',
    accentColor: '#ffa000',
    isDeluxe: true,
    costPoints: 1000,
    badge: '精緻旗艦 👑',
    accessories: {
      hasCrown: true,
      hasShoulderPads: true,
      hasCape: true,
      capeColor: '#fff9c4',
      shoulderColor: '#ffca28',
      glowColor: '#ffd700'
    }
  },
  {
    id: 'void_shadowblade',
    name: '虛空影武者 (Void Shadowblade)',
    description: '【高階精緻造型】穿梭於維度裂隙的末影幽影刺客，暗黑曜石編織披風與終界紫芒肩甲。',
    hairColor: '#0d0d12',
    skinColor: '#b39ddb',
    shirtColor: '#211a36',
    pantsColor: '#141124',
    shoesColor: '#0a0812',
    eyeColor: '#d500f9',
    accentColor: '#aa00ff',
    isDeluxe: true,
    costPoints: 1000,
    badge: '精緻旗艦 🗡️',
    accessories: {
      hasVisor: true,
      hasShoulderPads: true,
      hasCape: true,
      capeColor: '#4a148c',
      shoulderColor: '#7b1fa2',
      visorColor: '#e040fb'
    }
  },
  {
    id: 'cyber_neon_hacker',
    name: '賽博霓虹駭客 (Cyber Neon Hacker)',
    description: '【高階精緻造型】掌握元宇宙底層代碼的科技遊俠，配備全息戰術發光護目鏡與霓虹能量披風。',
    hairColor: '#00e5ff',
    skinColor: '#cfd8dc',
    shirtColor: '#1a2332',
    pantsColor: '#0f172a',
    shoesColor: '#00e5ff',
    eyeColor: '#00ffcc',
    accentColor: '#00e5ff',
    isDeluxe: true,
    costPoints: 1000,
    badge: '精緻旗艦 ⚡',
    accessories: {
      hasVisor: true,
      hasShoulderPads: true,
      hasCape: true,
      capeColor: '#00b0ff',
      shoulderColor: '#00e5ff',
      visorColor: '#00e5ff',
      glowColor: '#00e5ff'
    }
  },
  {
    id: 'draconic_overlord',
    name: '烈焰龍皇領主 (Draconic Overlord)',
    description: '【高階精緻造型】地底熔岩霸主，生有黑曜石威嚴龍角、滾燙熔岩胸甲與烈焰披風。',
    hairColor: '#212121',
    skinColor: '#ff8a80',
    shirtColor: '#b71c1c',
    pantsColor: '#260404',
    shoesColor: '#1a0000',
    eyeColor: '#ffeb3b',
    accentColor: '#ff5722',
    isDeluxe: true,
    costPoints: 1000,
    badge: '精緻旗艦 🔥',
    accessories: {
      hasHorns: true,
      hasShoulderPads: true,
      hasCape: true,
      capeColor: '#d50000',
      shoulderColor: '#ff3d00',
      glowColor: '#ff6d00'
    }
  },
  {
    id: 'frost_valkyrie',
    name: '冰霜極光女武神 (Frost Valkyrie)',
    description: '【高階精緻造型】永凍雪原的極光守護者，鑲嵌晶瑩冰雪戰盔頭冠、透亮霜晶肩甲與極光羽袍。',
    hairColor: '#e0f7fa',
    skinColor: '#fce4ec',
    shirtColor: '#80deea',
    pantsColor: '#b2ebf2',
    shoesColor: '#00acc1',
    eyeColor: '#00e5ff',
    accentColor: '#00bcd4',
    isDeluxe: true,
    costPoints: 1000,
    badge: '精緻旗艦 ❄️',
    accessories: {
      hasCrown: true,
      hasShoulderPads: true,
      hasCape: true,
      capeColor: '#b2ebf2',
      shoulderColor: '#4dd0e1',
      glowColor: '#e0f7fa'
    }
  },
  {
    id: 'chrono_genesis_mech',
    name: '時空創世機神 (Chrono Genesis Mech)',
    description: '【高階精緻造型】穿梭宇宙的精密泰坦外骨骼機甲，擁有胸前量子核心反應爐、機械肩裝甲與光能矩陣。',
    hairColor: '#37474f',
    skinColor: '#b0bec5',
    shirtColor: '#455a64',
    pantsColor: '#263238',
    shoesColor: '#102027',
    eyeColor: '#76ff03',
    accentColor: '#64ffda',
    isDeluxe: true,
    costPoints: 1000,
    badge: '精緻旗艦 ⚙️',
    accessories: {
      hasVisor: true,
      hasShoulderPads: true,
      hasCape: true,
      capeColor: '#37474f',
      shoulderColor: '#78909c',
      visorColor: '#76ff03',
      glowColor: '#64ffda'
    }
  }
];

export function getSkinById(id: string): CharacterSkin {
  return CHARACTER_SKINS.find((s) => s.id === id) || CHARACTER_SKINS[0];
}

/**
 * Builds a 3D blocky Minecraft player figure for preview and third-person view
 */
export function buildPlayerModel(skin: CharacterSkin): THREE.Group {
  const root = new THREE.Group();

  const skinMat = new THREE.MeshLambertMaterial({ color: skin.skinColor });
  const hairMat = new THREE.MeshLambertMaterial({ color: skin.hairColor });
  const shirtMat = new THREE.MeshLambertMaterial({ color: skin.shirtColor });
  const pantsMat = new THREE.MeshLambertMaterial({ color: skin.pantsColor });
  const shoesMat = new THREE.MeshLambertMaterial({ color: skin.shoesColor });
  const eyeMat = new THREE.MeshBasicMaterial({ color: skin.eyeColor });
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // 1. Head (0.5 x 0.5 x 0.5)
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.65;
  headGroup.name = 'player_head';

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
  headGroup.add(headMesh);

  // Hair cap
  const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 0.52), hairMat);
  hairMesh.position.y = 0.16;
  headGroup.add(hairMesh);

  // Eyes (white + pupil)
  const eyeGeom = new THREE.BoxGeometry(0.08, 0.06, 0.02);
  const pupilGeom = new THREE.BoxGeometry(0.05, 0.05, 0.03);

  // Left eye
  const eyeL = new THREE.Mesh(eyeGeom, whiteMat);
  eyeL.position.set(-0.12, 0.02, 0.25);
  headGroup.add(eyeL);
  const pupilL = new THREE.Mesh(pupilGeom, eyeMat);
  pupilL.position.set(-0.11, 0.02, 0.255);
  headGroup.add(pupilL);

  // Right eye
  const eyeR = new THREE.Mesh(eyeGeom, whiteMat);
  eyeR.position.set(0.12, 0.02, 0.25);
  headGroup.add(eyeR);
  const pupilR = new THREE.Mesh(pupilGeom, eyeMat);
  pupilR.position.set(0.11, 0.02, 0.255);
  headGroup.add(pupilR);

  root.add(headGroup);

  // 2. Torso (0.5 x 0.72 x 0.28)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 1.04;
  bodyGroup.name = 'player_body';

  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.72, 0.28), shirtMat);
  bodyGroup.add(torsoMesh);

  // Collar V-neck
  const collarMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.02), skinMat);
  collarMesh.position.set(0, 0.29, 0.141);
  bodyGroup.add(collarMesh);

  // Deluxe Accessories for Torso and Back (Cape & Reactor / Emblem)
  if (skin.accessories?.hasCape) {
    const capeColor = skin.accessories.capeColor || skin.accentColor || '#ffd700';
    const capeMat = new THREE.MeshLambertMaterial({
      color: capeColor,
      side: THREE.DoubleSide
    });
    // Flowing Cape hanging slightly behind back with gentle angle
    const capeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.82, 0.03), capeMat);
    capeMesh.position.set(0, -0.05, -0.16);
    capeMesh.rotation.x = 0.1; // Gentle wind flutter angle
    capeMesh.name = 'deluxe_cape';
    bodyGroup.add(capeMesh);
  }

  // Deluxe Chest Core / Reactor
  if (skin.accessories?.glowColor) {
    const glowMat = new THREE.MeshBasicMaterial({ color: skin.accessories.glowColor });
    const coreMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.02), glowMat);
    coreMesh.position.set(0, 0.1, 0.145);
    bodyGroup.add(coreMesh);
  }

  root.add(bodyGroup);

  // Deluxe Accessories for Head (Halo, Crown, Visor, Horns)
  if (skin.accessories?.hasCrown) {
    const crownMat = new THREE.MeshLambertMaterial({
      color: skin.accessories.glowColor || '#ffd700'
    });
    // Floating golden halo / crown ring
    const haloMesh = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 16), crownMat);
    haloMesh.rotation.x = Math.PI / 2;
    haloMesh.position.set(0, 0.38, 0);
    haloMesh.name = 'deluxe_halo';
    headGroup.add(haloMesh);
  }

  if (skin.accessories?.hasVisor) {
    const visorMat = new THREE.MeshBasicMaterial({
      color: skin.accessories.visorColor || '#00e5ff'
    });
    const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.04), visorMat);
    visorMesh.position.set(0, 0.02, 0.26);
    visorMesh.name = 'deluxe_visor';
    headGroup.add(visorMesh);
  }

  if (skin.accessories?.hasHorns) {
    const hornMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), hornMat);
    hornL.position.set(-0.25, 0.32, 0.05);
    hornL.rotation.z = 0.35;
    headGroup.add(hornL);

    const hornR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), hornMat);
    hornR.position.set(0.25, 0.32, 0.05);
    hornR.rotation.z = -0.35;
    headGroup.add(hornR);
  }

  // 3. Left Arm (0.2 x 0.72 x 0.2)
  const armLGroup = new THREE.Group();
  armLGroup.position.set(-0.36, 1.04, 0);
  armLGroup.name = 'arm_l';
  // Sleeve
  const sleeveL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.2), shirtMat);
  sleeveL.position.y = 0.22;
  armLGroup.add(sleeveL);
  // Deluxe Shoulder Pauldron
  if (skin.accessories?.hasShoulderPads) {
    const padMat = new THREE.MeshLambertMaterial({
      color: skin.accessories.shoulderColor || skin.accentColor || '#ffd700'
    });
    const padL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.26), padMat);
    padL.position.y = 0.34;
    armLGroup.add(padL);
  }
  // Bare forearm/hand
  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.44, 0.19), skinMat);
  handL.position.y = -0.14;
  armLGroup.add(handL);
  root.add(armLGroup);

  // 4. Right Arm (0.2 x 0.72 x 0.2)
  const armRGroup = new THREE.Group();
  armRGroup.position.set(0.36, 1.04, 0);
  armRGroup.name = 'arm_r';
  // Sleeve
  const sleeveR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.2), shirtMat);
  sleeveR.position.y = 0.22;
  armRGroup.add(sleeveR);
  // Deluxe Shoulder Pauldron
  if (skin.accessories?.hasShoulderPads) {
    const padMat = new THREE.MeshLambertMaterial({
      color: skin.accessories.shoulderColor || skin.accentColor || '#ffd700'
    });
    const padR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.26), padMat);
    padR.position.y = 0.34;
    armRGroup.add(padR);
  }
  // Bare forearm/hand
  const handR = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.44, 0.19), skinMat);
  handR.position.y = -0.14;
  armRGroup.add(handR);
  root.add(armRGroup);

  // 5. Left Leg (0.22 x 0.68 x 0.22)
  const legLGroup = new THREE.Group();
  legLGroup.position.set(-0.13, 0.34, 0);
  legLGroup.name = 'leg_l';
  const pantsL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.52, 0.22), pantsMat);
  pantsL.position.y = 0.08;
  legLGroup.add(pantsL);
  const shoesL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.23), shoesMat);
  shoesL.position.set(0, -0.26, 0.005);
  legLGroup.add(shoesL);
  root.add(legLGroup);

  // 6. Right Leg (0.22 x 0.68 x 0.22)
  const legRGroup = new THREE.Group();
  legRGroup.position.set(0.13, 0.34, 0);
  legRGroup.name = 'leg_r';
  const pantsR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.52, 0.22), pantsMat);
  pantsR.position.y = 0.08;
  legRGroup.add(pantsR);
  const shoesR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.23), shoesMat);
  shoesR.position.set(0, -0.26, 0.005);
  legRGroup.add(shoesR);
  root.add(legRGroup);

  return root;
}
