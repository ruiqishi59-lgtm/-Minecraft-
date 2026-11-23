import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { getSkinById, buildPlayerModel } from '../game/skins';

interface Character3DPreviewProps {
  skinId: string;
}

export const Character3DPreview: React.FC<Character3DPreviewProps> = ({ skinId }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const skin = getSkinById(skinId);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 360;

    // Detect software WebGL (SwiftShader, llvmpipe, WARP) for frame pacing
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 1.15, 3.7);
    camera.lookAt(0, 0.95, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance'
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3-point warm/cool studio lighting rig
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x332b24, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.35);
    keyLight.position.set(2.5, 4.0, 3.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.55);
    rimLight.position.set(-2.5, 2.2, -2.5);
    scene.add(rimLight);

    // Character root & pedestal group
    const showcaseGroup = new THREE.Group();
    scene.add(showcaseGroup);

    const playerModel = buildPlayerModel(getSkinById(skinId));
    // Ground bottom-center at y = 0 (legs extend to 0.34 - 0.34 = 0)
    playerModel.position.set(0, 0, 0);
    showcaseGroup.add(playerModel);

    // Voxel grass & stone display plinth directly below character feet
    const plinthGroup = new THREE.Group();
    const plinthTopGeom = new THREE.BoxGeometry(1.15, 0.12, 1.15);
    const plinthTopMat = new THREE.MeshStandardMaterial({
      color: 0x4e8226,
      roughness: 0.85,
      metalness: 0.05
    });
    const plinthTop = new THREE.Mesh(plinthTopGeom, plinthTopMat);
    plinthTop.position.set(0, -0.06, 0);
    plinthGroup.add(plinthTop);

    const plinthBaseGeom = new THREE.BoxGeometry(1.1, 0.16, 1.1);
    const plinthBaseMat = new THREE.MeshStandardMaterial({
      color: 0x5c4632,
      roughness: 0.9,
      metalness: 0.05
    });
    const plinthBase = new THREE.Mesh(plinthBaseGeom, plinthBaseMat);
    plinthBase.position.set(0, -0.2, 0);
    plinthGroup.add(plinthBase);

    // Soft radial contact shadow plane under feet (offset >= 0.005 above plinthTop to prevent Z-fighting)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
      grad.addColorStop(0, 'rgba(0,0,0,0.55)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 64, 64);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlaneGeom = new THREE.PlaneGeometry(1.05, 1.05);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeom, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, 0.005, 0);
    plinthGroup.add(shadowPlane);

    showcaseGroup.add(plinthGroup);

    // Interactive rotation state
    let isDragging = false;
    let lastPointerX = 0;
    let targetYaw = -0.35;
    let currentYaw = -0.35;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastPointerX = e.clientX;
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPointerX;
      lastPointerX = e.clientX;
      targetYaw += dx * 0.012;
    };
    const handlePointerUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 280;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Compile shaders on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const head = playerModel.getObjectByName('player_head');
    const armL = playerModel.getObjectByName('arm_l');
    const armR = playerModel.getObjectByName('arm_r');
    const cape = playerModel.getObjectByName('deluxe_cape');
    const halo = playerModel.getObjectByName('deluxe_halo');

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += delta;

      if (!isDragging) {
        targetYaw += delta * 0.35;
      }
      currentYaw = THREE.MathUtils.damp(currentYaw, targetYaw, 8, delta);
      showcaseGroup.rotation.y = currentYaw;

      // Subtle living idle animation
      if (head) {
        head.rotation.y = Math.sin(elapsed * 1.1) * 0.14;
        head.rotation.x = Math.sin(elapsed * 0.8) * 0.05;
      }
      if (armL && armR) {
        armL.rotation.x = Math.sin(elapsed * 1.6) * 0.08;
        armR.rotation.x = -Math.sin(elapsed * 1.6) * 0.08;
      }
      if (cape) {
        cape.rotation.x = 0.12 + Math.sin(elapsed * 2.2) * 0.05;
      }
      if (halo) {
        halo.rotation.z = elapsed * 0.8;
        halo.position.y = 0.38 + Math.sin(elapsed * 2.5) * 0.025;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      shadowTex.dispose();
      envTarget.dispose();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [skinId]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[300px] sm:max-w-[340px] select-none font-mono">
      {/* Classic Minecraft Nametag Header */}
      <div className="mb-1 px-3.5 py-1 rounded-none bg-[#1e1e1e]/85 border-2 border-black shadow-[inset_1px_1px_0_#4a4a4a] text-center">
        <div
          className="text-xs sm:text-sm font-black text-[#ffff55] tracking-wider"
          style={{ textShadow: '2px 2px 0 #3f3f00' }}
        >
          {skin.name}
        </div>
        {skin.badge && (
          <div className="text-[10px] font-bold text-[#55ff55]">{skin.badge}</div>
        )}
      </div>

      {/* Dedicated Empty WebGL Mount Container */}
      <div
        ref={mountRef}
        className="w-[240px] h-[290px] sm:w-[290px] sm:h-[360px] cursor-grab active:cursor-grabbing touch-none"
        title="拖曳旋轉 3D 人物"
      />

      {/* Classic Minecraft Hint */}
      <span
        className="mt-1 text-[11px] text-stone-200 tracking-wide"
        style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.9)' }}
      >
        ↔ 拖曳可 360° 旋轉 3D 人物
      </span>
    </div>
  );
};
