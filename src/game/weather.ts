import * as THREE from 'three';
import { WeatherType, WeatherState, BiomeType } from '../types';
import { soundManager } from './audio';

export class WeatherManager {
  // 0.0 = Sunrise (06:00), 0.25 = Noon (12:00), 0.5 = Sunset (18:00), 0.75 = Midnight (00:00)
  public timeOfDay: number = 0.18; // Default morning light
  public timeSpeed: number = 0.0035; // ~280s for a complete day-night cycle
  public isTimeFrozen: boolean = false;
  public isHeaven: boolean = false; // Only true when explicitly traveling to Aether Heaven
  public currentBiome: BiomeType = 'plains';

  // Environmental Biome-adaptive lighting & fog blending
  private biomeSkyTint = new THREE.Color(0x73a8f5);
  private biomeFogTint = new THREE.Color(0xa8ccff);
  private biomeSunTint = new THREE.Color(0xfffae8);
  private biomeAmbientTint = new THREE.Color(0xb0cbef);
  private biomeSunIntensityMult: number = 1.0;
  private biomeAmbientIntensityMult: number = 1.0;
  public biomeFogDensity: number = 0.015;

  public weather: WeatherState = {
    current: 'clear',
    durationLeft: 160,
    rainIntensity: 0,
    isLightning: false
  };

  private lightningTimer: number = 0;
  private lightningDuration: number = 0;

  // Three.js celestial and environmental objects
  public sunMesh: THREE.Mesh;
  public moonMesh: THREE.Mesh;
  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public starsParticles: THREE.Points;
  public rainParticles: THREE.Points;
  private rainGeometry: THREE.BufferGeometry;
  private rainCount: number = 1800;

  // Authentic Minecraft Sky Colors
  private skyColorNight = new THREE.Color(0x0a0f1d);
  private skyColorDawn = new THREE.Color(0xef7a43);
  private skyColorDay = new THREE.Color(0x73a8f5);
  private skyColorSunset = new THREE.Color(0xcb483c);
  private skyColorDusk = new THREE.Color(0x2d1b3e);
  private skyColorRain = new THREE.Color(0x3e4953);
  private skyColorThunder = new THREE.Color(0x191e25);

  // Fog Colors (matches horizon glow)
  private fogColorNight = new THREE.Color(0x090d18);
  private fogColorDawn = new THREE.Color(0xf69c73);
  private fogColorDay = new THREE.Color(0xa8ccff);
  private fogColorSunset = new THREE.Color(0xd9674c);

  // Volumetric Minecraft Clouds
  public cloudsMesh: THREE.InstancedMesh | null = null;
  private cloudOffsets: { x: number; z: number; sx: number; sz: number }[] = [];
  public showClouds: boolean = true;
  private cloudWindOffset: number = 0;
  private cloudMaterial: THREE.MeshLambertMaterial;

  constructor(private scene: THREE.Scene) {
    // 1. Minecraft Pixelated Sun (glowing square billboard)
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 32;
    sunCanvas.height = 32;
    const sCtx = sunCanvas.getContext('2d')!;
    sCtx.imageSmoothingEnabled = false;
    // Outer corona glow
    sCtx.fillStyle = '#ffdf6d';
    sCtx.fillRect(2, 2, 28, 28);
    // Middle radiant layer
    sCtx.fillStyle = '#fff4a8';
    sCtx.fillRect(5, 5, 22, 22);
    // Core white hot center
    sCtx.fillStyle = '#ffffff';
    sCtx.fillRect(8, 8, 16, 16);

    const sunTexture = new THREE.CanvasTexture(sunCanvas);
    sunTexture.magFilter = THREE.NearestFilter;
    sunTexture.minFilter = THREE.NearestFilter;
    const sunGeom = new THREE.PlaneGeometry(22, 22);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTexture,
      transparent: true,
      depthWrite: false
    });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    // 2. Minecraft Pixelated Moon (square billboard with craters)
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 32;
    moonCanvas.height = 32;
    const mCtx = moonCanvas.getContext('2d')!;
    mCtx.imageSmoothingEnabled = false;
    // Silver border
    mCtx.fillStyle = '#c5d0e6';
    mCtx.fillRect(2, 2, 28, 28);
    // Pale white body
    mCtx.fillStyle = '#ebf2ff';
    mCtx.fillRect(4, 4, 24, 24);
    // Subtle Minecraft craters
    mCtx.fillStyle = '#9cb0d0';
    mCtx.fillRect(6, 6, 6, 6);
    mCtx.fillRect(18, 8, 8, 5);
    mCtx.fillRect(10, 16, 7, 7);
    mCtx.fillRect(20, 18, 5, 6);

    const moonTexture = new THREE.CanvasTexture(moonCanvas);
    moonTexture.magFilter = THREE.NearestFilter;
    moonTexture.minFilter = THREE.NearestFilter;
    const moonGeom = new THREE.PlaneGeometry(18, 18);
    const moonMat = new THREE.MeshBasicMaterial({
      map: moonTexture,
      transparent: true,
      depthWrite: false
    });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.scene.add(this.moonMesh);

    // 3. Directional Sun/Moon Light with Soft Shadows
    this.sunLight = new THREE.DirectionalLight(0xfffaea, 1.25);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 200;
    const shadowD = 42;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.0006;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // 4. Ambient Environmental Light
    this.ambientLight = new THREE.AmbientLight(0xb0c8ea, 0.55);
    this.scene.add(this.ambientLight);

    // 5. 1200 Minecraft Starfield Particles
    const starGeom = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 240;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 8; // Keep above ground
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: 0
    });
    this.starsParticles = new THREE.Points(starGeom, starMat);
    this.scene.add(this.starsParticles);

    // 6. Rain particles
    this.rainGeometry = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 60;
      rainPositions[i * 3 + 1] = Math.random() * 35;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x90caf9,
      size: 0.25,
      transparent: true,
      opacity: 0
    });
    this.rainParticles = new THREE.Points(this.rainGeometry, rainMat);
    this.scene.add(this.rainParticles);

    // 7. Volumetric Minecraft Voxel Clouds
    this.cloudMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    this.createClouds();
  }

  private createClouds() {
    const cloudCount = 140;
    const geom = new THREE.BoxGeometry(1, 3.5, 1);
    this.cloudsMesh = new THREE.InstancedMesh(geom, this.cloudMaterial, cloudCount);
    this.cloudsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.cloudsMesh.frustumCulled = false;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < cloudCount; i++) {
      const clusterX = (Math.random() - 0.5) * 380;
      const clusterZ = (Math.random() - 0.5) * 380;
      const sx = 14 + Math.random() * 26;
      const sz = 14 + Math.random() * 26;
      this.cloudOffsets.push({ x: clusterX, z: clusterZ, sx, sz });

      dummy.position.set(clusterX, 78, clusterZ);
      dummy.scale.set(sx, 1, sz);
      dummy.updateMatrix();
      this.cloudsMesh.setMatrixAt(i, dummy.matrix);
    }
    this.cloudsMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.cloudsMesh);
  }

  public setCloudsVisible(visible: boolean) {
    this.showClouds = visible;
    if (this.cloudsMesh) {
      this.cloudsMesh.visible = visible;
    }
  }

  public setWeather(type: WeatherType) {
    this.weather.current = type;
    this.weather.durationLeft = type === 'clear' ? 160 : 90;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    currentBiome: BiomeType = 'plains'
  ): {
    skyColor: THREE.Color;
    fogColor: THREE.Color;
    fogDensity: number;
    isNight: boolean;
    mobSpawnMultiplier: number;
  } {
    // 1. Advance Time of Day
    if (!this.isTimeFrozen) {
      this.timeOfDay = (this.timeOfDay + this.timeSpeed * delta) % 1.0;
    }

    // 2. Weather state transitions
    this.weather.durationLeft -= delta;
    if (this.weather.durationLeft <= 0) {
      const roll = Math.random();
      if (this.weather.current === 'clear') {
        this.setWeather(roll > 0.4 ? 'rain' : 'thunder');
      } else {
        this.setWeather(roll > 0.35 ? 'clear' : 'rain');
      }
    }

    // Rain intensity easing
    const targetRain = this.weather.current === 'clear' ? 0 : (this.weather.current === 'thunder' ? 1.0 : 0.7);
    this.weather.rainIntensity += (targetRain - this.weather.rainIntensity) * Math.min(1, delta * 1.5);
    soundManager.updateRainSound(this.weather.rainIntensity);

    // Lightning in thunderstorm
    this.weather.isLightning = false;
    if (this.weather.current === 'thunder') {
      this.lightningTimer -= delta;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 5 + Math.random() * 12;
        this.lightningDuration = 0.15 + Math.random() * 0.15;
        this.weather.isLightning = true;
        soundManager.playThunder();
      } else if (this.lightningDuration > 0) {
        this.lightningDuration -= delta;
        this.weather.isLightning = true;
      }
    }

    // 2.1 Environmental Biome Adaptive Parameter Targets
    this.currentBiome = currentBiome;
    const targetSky = new THREE.Color();
    const targetFog = new THREE.Color();
    const targetSunColor = new THREE.Color();
    const targetAmbientColor = new THREE.Color();
    let targetSunMult = 1.0;
    let targetAmbientMult = 1.0;
    let targetFogDensity = 0.015;

    if (this.isHeaven || currentBiome === 'heaven') {
      targetSky.setHex(0xafe1ff);
      targetFog.setHex(0xb8e6ff);
      targetSunColor.setHex(0xfffaee);
      targetAmbientColor.setHex(0xfff8ee);
      targetSunMult = 1.35;
      targetAmbientMult = 1.35;
      targetFogDensity = 0.014;
    } else if (currentBiome === 'desert') {
      // Desert: Warm golden-hazed sky, warm sand albedo, blazing sun, light heat-shimmer fog
      targetSky.setHex(0x8ac7f0);
      targetFog.setHex(0xe8cba2);
      targetSunColor.setHex(0xfff4d2);
      targetAmbientColor.setHex(0xe8d0a8);
      targetSunMult = 1.25;
      targetAmbientMult = 1.15;
      targetFogDensity = 0.012;
    } else if (currentBiome === 'swamp') {
      // Swamp: Gloomy murky olive-slate sky, eerie green fog, dense murky mist
      targetSky.setHex(0x5e7364);
      targetFog.setHex(0x485c4a);
      targetSunColor.setHex(0xd4deb8);
      targetAmbientColor.setHex(0x3c503e);
      targetSunMult = 0.82;
      targetAmbientMult = 0.78;
      targetFogDensity = 0.024;
    } else if (currentBiome === 'snow') {
      // Snow: Crisp pale icy azure, frosty white-cyan fog, cold crystalline light
      targetSky.setHex(0x92bde8);
      targetFog.setHex(0xd2e5f8);
      targetSunColor.setHex(0xf4f8ff);
      targetAmbientColor.setHex(0xd5ebff);
      targetSunMult = 1.05;
      targetAmbientMult = 1.25;
      targetFogDensity = 0.018;
    } else if (currentBiome === 'mountains') {
      // Mountains: Alpine deep blue sky, thin crisp air
      targetSky.setHex(0x5d96ea);
      targetFog.setHex(0x9ec5f6);
      targetSunColor.setHex(0xfffaee);
      targetAmbientColor.setHex(0xb4d3f8);
      targetSunMult = 1.15;
      targetAmbientMult = 1.05;
      targetFogDensity = 0.013;
    } else if (currentBiome === 'forest') {
      // Forest: Rich vibrant blue, lush canopy-softened horizon
      targetSky.setHex(0x71a5f5);
      targetFog.setHex(0xa2cbf2);
      targetSunColor.setHex(0xfffae8);
      targetAmbientColor.setHex(0xadc9ec);
      targetSunMult = 1.0;
      targetAmbientMult = 1.0;
      targetFogDensity = 0.015;
    } else {
      // Plains / Default: Classic vibrant Minecraft blue
      targetSky.setHex(0x73a8f5);
      targetFog.setHex(0xa8ccff);
      targetSunColor.setHex(0xfffae8);
      targetAmbientColor.setHex(0xb0cbef);
      targetSunMult = 1.0;
      targetAmbientMult = 1.0;
      targetFogDensity = 0.015;
    }

    // Smooth exponential blending across biomes
    const blendRate = Math.min(1.0, (delta || 0.016) * 2.5);
    this.biomeSkyTint.lerp(targetSky, blendRate);
    this.biomeFogTint.lerp(targetFog, blendRate);
    this.biomeSunTint.lerp(targetSunColor, blendRate);
    this.biomeAmbientTint.lerp(targetAmbientColor, blendRate);
    this.biomeSunIntensityMult += (targetSunMult - this.biomeSunIntensityMult) * blendRate;
    this.biomeAmbientIntensityMult += (targetAmbientMult - this.biomeAmbientIntensityMult) * blendRate;
    this.biomeFogDensity += (targetFogDensity - this.biomeFogDensity) * blendRate;

    // 3. Sun and Moon orbital physics
    // Angle: 0 = Sunrise, PI/2 = Noon, PI = Sunset, 3PI/2 = Midnight
    const sunAngle = this.timeOfDay * Math.PI * 2;
    const orbitRadius = 180;

    const sunX = playerPos.x + Math.cos(sunAngle) * orbitRadius;
    const sunY = Math.sin(sunAngle) * orbitRadius;
    const sunZ = playerPos.z;

    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.sunMesh.lookAt(playerPos);

    const moonX = playerPos.x - Math.cos(sunAngle) * orbitRadius;
    const moonY = -Math.sin(sunAngle) * orbitRadius;
    const moonZ = playerPos.z;

    this.moonMesh.position.set(moonX, moonY, moonZ);
    this.moonMesh.lookAt(playerPos);

    // 4. Directional & Ambient Lighting calculation
    const isSunUp = sunY > -5;
    const sunElevation = Math.max(0, Math.sin(sunAngle));
    const moonElevation = Math.max(0, -Math.sin(sunAngle));

    this.sunLight.target.position.copy(playerPos);

    if (isSunUp) {
      // Day Sun Light with Biome Color & Intensity Blending
      this.sunLight.position.set(sunX, Math.max(10, sunY), sunZ);
      const isDawnOrDusk = sunElevation < 0.25;
      if (isDawnOrDusk) {
        this.sunLight.color.setHex(0xffaa66).lerp(this.biomeSunTint, 0.35);
      } else {
        this.sunLight.color.copy(this.biomeSunTint);
      }
      const rawIntensity = 0.35 + sunElevation * 0.95;
      this.sunLight.intensity = rawIntensity * (1 - this.weather.rainIntensity * 0.65) * this.biomeSunIntensityMult;

      // Daytime ambient
      const baseAmbient = 0.35 + sunElevation * 0.25;
      this.ambientLight.intensity = baseAmbient * (1 - this.weather.rainIntensity * 0.45) * this.biomeAmbientIntensityMult;
      this.ambientLight.color.copy(this.biomeAmbientTint);
    } else {
      // Night Moon Light
      this.sunLight.position.set(moonX, Math.max(10, moonY), moonZ);
      this.sunLight.color.setHex(0x9ab8e4);
      this.sunLight.intensity = 0.28 * moonElevation * (1 - this.weather.rainIntensity * 0.5);

      // Night ambient: dark but navigable with torches popping out
      this.ambientLight.intensity = (0.16 + moonElevation * 0.08) * (1 - this.weather.rainIntensity * 0.4);
      this.ambientLight.color.setHex(0x182236).lerp(this.biomeAmbientTint, 0.15);
    }

    // Lightning Flash Override
    if (this.weather.isLightning) {
      this.sunLight.intensity = 2.8;
      this.sunLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 1.8;
      this.ambientLight.color.setHex(0xe8f0ff);
    }

    // 5. Dynamic Sky & Fog Color Gradient Interpolation
    const currentSky = new THREE.Color();
    const currentFog = new THREE.Color();
    const isNight = this.timeOfDay > 0.48 && this.timeOfDay < 0.98;

    if (this.timeOfDay < 0.12) {
      // Dawn (0.0 to 0.12): Sunrise glow
      const t = this.timeOfDay / 0.12;
      currentSky.lerpColors(this.skyColorDawn, this.skyColorDay, t);
      currentFog.lerpColors(this.fogColorDawn, this.fogColorDay, t);
    } else if (this.timeOfDay < 0.42) {
      // Midday (0.12 to 0.42): Bright vibrant Minecraft daylight
      currentSky.copy(this.skyColorDay);
      currentFog.copy(this.fogColorDay);
    } else if (this.timeOfDay < 0.54) {
      // Sunset (0.42 to 0.54): Fiery crimson sunset
      const t = (this.timeOfDay - 0.42) / 0.12;
      currentSky.lerpColors(this.skyColorDay, this.skyColorSunset, t);
      currentFog.lerpColors(this.fogColorDay, this.fogColorSunset, t);
    } else if (this.timeOfDay < 0.62) {
      // Dusk (0.54 to 0.62): Twilight fading into night
      const t = (this.timeOfDay - 0.54) / 0.08;
      currentSky.lerpColors(this.skyColorSunset, this.skyColorDusk, t);
      currentFog.lerpColors(this.fogColorSunset, this.fogColorNight, t);
    } else if (this.timeOfDay < 0.92) {
      // Deep Night (0.62 to 0.92): Midnight starry sky
      currentSky.copy(this.skyColorNight);
      currentFog.copy(this.fogColorNight);
    } else {
      // Pre-dawn (0.92 to 1.0): Pre-dawn twilight
      const t = (this.timeOfDay - 0.92) / 0.08;
      currentSky.lerpColors(this.skyColorNight, this.skyColorDawn, t);
      currentFog.lerpColors(this.fogColorNight, this.fogColorDawn, t);
    }

    // Biome sky and fog tinting during daytime and twilight
    if (!isNight) {
      currentSky.lerp(this.biomeSkyTint, 0.5);
      currentFog.lerp(this.biomeFogTint, 0.55);
    } else {
      currentFog.lerp(this.biomeFogTint, 0.15);
    }

    // Weather Storm tinting
    if (this.weather.rainIntensity > 0) {
      const stormSky = this.weather.current === 'thunder' ? this.skyColorThunder : this.skyColorRain;
      currentSky.lerp(stormSky, this.weather.rainIntensity * 0.85);
      currentFog.lerp(stormSky, this.weather.rainIntensity * 0.85);
    }

    // Flash sky during lightning
    if (this.weather.isLightning) {
      currentSky.setHex(0xe4eeff);
      currentFog.setHex(0xd0e2ff);
    }

    // Aether Heaven Override: Ethereal celestial glow
    if (this.isHeaven) {
      currentSky.setHex(0xafe1ff);
      currentSky.lerp(new THREE.Color(0xfff1d6), 0.22);
      currentFog.setHex(0xb8e6ff);
      this.ambientLight.intensity = 0.7;
      this.ambientLight.color.setHex(0xfff8ee);
      this.sunLight.intensity = 1.35;
      this.sunLight.color.setHex(0xfffae8);
    }

    // 6. Stars visibility & position
    const starOpacity = isNight ? Math.min(1, (1 - this.weather.rainIntensity) * 0.95) : 0;
    (this.starsParticles.material as THREE.PointsMaterial).opacity = starOpacity;
    this.starsParticles.position.copy(playerPos);

    // 7. Rain & Snow particles animation
    const rainMat = this.rainParticles.material as THREE.PointsMaterial;
    if (currentBiome === 'desert') {
      // Arid desert: no rainfall
      rainMat.opacity = 0;
    } else if (currentBiome === 'snow') {
      // Snow biome: soft white snowflakes!
      rainMat.color.setHex(0xffffff);
      rainMat.size = 0.45;
      rainMat.opacity = this.weather.rainIntensity * 0.9;
    } else {
      // Normal biomes: rain droplets
      rainMat.color.setHex(currentBiome === 'swamp' ? 0x78909c : 0x90caf9);
      rainMat.size = 0.25;
      rainMat.opacity = this.weather.rainIntensity * 0.75;
    }
    this.rainParticles.position.set(playerPos.x, playerPos.y, playerPos.z);

    if (this.weather.rainIntensity > 0.05 && currentBiome !== 'desert') {
      const positions = this.rainGeometry.attributes.position.array as Float32Array;
      const isSnow = currentBiome === 'snow';
      const speed = isSnow ? (this.weather.current === 'thunder' ? 12 : 8) : (this.weather.current === 'thunder' ? 38 : 28);
      for (let i = 0; i < this.rainCount; i++) {
        positions[i * 3 + 1] -= speed * delta;
        if (isSnow) {
          // Sinusoidal snow drift flutter
          positions[i * 3] += Math.sin((positions[i * 3 + 1] + i * 0.7) * 0.2) * delta * 2.2;
        }
        if (positions[i * 3 + 1] < -10) {
          positions[i * 3 + 1] = 25 + Math.random() * 10;
          positions[i * 3] = (Math.random() - 0.5) * 50;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
      }
      this.rainGeometry.attributes.position.needsUpdate = true;
    }

    // 8. Clouds color tinting & drift
    if (this.cloudsMesh && this.showClouds) {
      this.cloudWindOffset += delta * 2.5;
      const wrapRange = 400;
      const dummy = new THREE.Object3D();
      for (let i = 0; i < this.cloudOffsets.length; i++) {
        const c = this.cloudOffsets[i];
        let cx = playerPos.x + ((c.x + this.cloudWindOffset) % wrapRange);
        if (cx - playerPos.x > wrapRange / 2) cx -= wrapRange;
        if (cx - playerPos.x < -wrapRange / 2) cx += wrapRange;

        let cz = playerPos.z + c.z;
        dummy.position.set(cx, 78, cz);
        dummy.scale.set(c.sx, 1, c.sz);
        dummy.updateMatrix();
        this.cloudsMesh.setMatrixAt(i, dummy.matrix);
      }
      this.cloudsMesh.instanceMatrix.needsUpdate = true;

      // Tint clouds based on daylight
      if (isNight) {
        this.cloudMaterial.color.setHex(0x354055);
        this.cloudMaterial.opacity = 0.55;
      } else if (sunElevation < 0.2) {
        this.cloudMaterial.color.setHex(0xffc599);
        this.cloudMaterial.opacity = 0.85;
      } else {
        this.cloudMaterial.color.setHex(0xffffff);
        this.cloudMaterial.opacity = 0.85;
      }
    }

    // 9. Mob spawn rate multiplier
    let mobSpawnMultiplier = isNight ? 1.0 : 0.1;
    if (this.weather.current === 'thunder') {
      mobSpawnMultiplier += 0.8;
    }

    return {
      skyColor: currentSky,
      fogColor: currentFog,
      fogDensity: this.biomeFogDensity,
      isNight,
      mobSpawnMultiplier
    };
  }

  public getTimeDisplay(): { hours: number; minutes: number; text: string; icon: string } {
    // 0.0 = 06:00 AM (Sunrise)
    const totalMinutes = Math.floor(this.timeOfDay * 24 * 60 + 6 * 60) % (24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const paddedH = hours.toString().padStart(2, '0');
    const paddedM = minutes.toString().padStart(2, '0');
    const isNight = hours < 6 || hours >= 19;
    return {
      hours,
      minutes,
      text: `${paddedH}:${paddedM}`,
      icon: isNight ? '🌙' : '☀️'
    };
  }
}
