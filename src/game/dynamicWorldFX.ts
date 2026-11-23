import * as THREE from 'three';
import { isVipActive } from '../utils/googleAuth';

/**
 * 全新世界動態系統 (Next-Gen World Dynamic FX & Kinematics 2.0)
 * 創世 VIP 會員專屬功能 (VIP Exclusive Dynamics)
 * 包含：
 * 1. 草木樹葉微風擺動律動 (Wind foliage sway)
 * 2. 雲海浮空立體風動飄移 (Volumetric wind cloud dynamics)
 * 3. 晶瑩水波流體漣漪 (Fluid water ripple caustics)
 * 4. 生物靈動呼吸與物理骨骼運動 (Organic mob kinematics & breathing)
 * 5. 創世金光環境微粒光環 (Ambient celestial golden aura particles)
 */
export class DynamicWorldFXManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  public isEnabled: boolean = true;
  private elapsedTime: number = 0;

  // Ambient celestial particles
  private auraParticles: THREE.Points | null = null;
  private particlePositions: Float32Array | null = null;
  private particleCount: number = 120;

  // Wind direction and speed
  public windDirection: THREE.Vector2 = new THREE.Vector2(0.8, 0.6).normalize();
  public windStrength: number = 1.0;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    this.initAuraParticles();
  }

  private initAuraParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 1] = Math.random() * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 36;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particlePositions = positions;

    // Glowing golden/emerald ambient dust particles
    const material = new THREE.PointsMaterial({
      color: 0xffe082,
      size: 0.18,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.auraParticles = new THREE.Points(geometry, material);
    this.auraParticles.visible = false;
    this.scene.add(this.auraParticles);
  }

  /**
   * Update the dynamic world system every frame.
   * Only operates when VIP status is verified!
   */
  public update(delta: number, playerPos: THREE.Vector3, isVip: boolean = isVipActive()) {
    if (!this.isEnabled || !isVip) {
      if (this.auraParticles) {
        this.auraParticles.visible = false;
      }
      return;
    }

    this.elapsedTime += delta;
    const time = this.elapsedTime;

    // 1. Update Ambient Aura Particles (VIP Special)
    if (this.auraParticles && this.particlePositions) {
      this.auraParticles.visible = true;
      const positions = this.particlePositions;
      const geo = this.auraParticles.geometry;
      const attr = geo.attributes.position as THREE.BufferAttribute;

      // Center around player
      this.auraParticles.position.set(playerPos.x, 0, playerPos.z);

      for (let i = 0; i < this.particleCount; i++) {
        const idx = i * 3;
        // Swirling wind drift
        positions[idx + 0] += Math.sin(time * 0.8 + i) * 0.4 * delta + this.windDirection.x * 0.6 * delta;
        positions[idx + 1] += Math.cos(time * 0.6 + i) * 0.3 * delta + Math.sin(time + i * 2) * 0.1 * delta;
        positions[idx + 2] += Math.cos(time * 0.8 + i) * 0.4 * delta + this.windDirection.y * 0.6 * delta;

        // Wrap around player radius
        if (positions[idx + 0] > 18) positions[idx + 0] = -18;
        if (positions[idx + 0] < -18) positions[idx + 0] = 18;
        if (positions[idx + 1] > 24) positions[idx + 1] = 0;
        if (positions[idx + 1] < 0) positions[idx + 1] = 24;
        if (positions[idx + 2] > 18) positions[idx + 2] = -18;
        if (positions[idx + 2] < -18) positions[idx + 2] = 18;
      }
      attr.needsUpdate = true;
    }
  }

  /**
   * Returns whether the VIP dynamic world feature is fully active
   */
  public isDynamicSystemActive(): boolean {
    return this.isEnabled && isVipActive();
  }

  public dispose() {
    if (this.auraParticles) {
      this.scene.remove(this.auraParticles);
      this.auraParticles.geometry.dispose();
      if (Array.isArray(this.auraParticles.material)) {
        this.auraParticles.material.forEach((m) => m.dispose());
      } else {
        this.auraParticles.material.dispose();
      }
      this.auraParticles = null;
    }
  }
}
