// components/ThreeScene.tsx
import React, { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import WindowManager from "../lib/WindowManager";

const todayTime = new Date().setHours(0, 0, 0, 0);

const getTime = (): number => (new Date().getTime() - todayTime) / 1000.0;

const style: React.CSSProperties = {
  width: "100vw",
  height: "100vh",
  display: "block",
  overflow: "hidden",
};

const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef<THREE.OrthographicCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const worldRef = useRef(new THREE.Object3D());
  const cubesRef = useRef<THREE.Mesh[]>([]);
  const sceneOffsetRef = useRef({ x: 0, y: 0 });
  const windowManagerRef = useRef(new WindowManager());
  const initializedRef = useRef(false);
  const requestRef = useRef<number | null>(null);

  const clearLocalStorageIfNeeded = () => {
    if (new URLSearchParams(window.location.search).get("clear")) {
      localStorage.clear();
    }
  };

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    clearLocalStorageIfNeeded();

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "hidden" && !initializedRef.current) {
        init();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("load", init);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("load", init);
      window.removeEventListener("resize", handleResize);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      windowManagerRef.current.cleanup();
    };
  }, []);

  const init = useCallback(() => {
    if (document.visibilityState === "hidden" || initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    setupScene();
    setupWindowManager();
    handleResize();
    updateWindowShape(false);
    render();
    window.addEventListener("resize", handleResize);
  }, []);

  const setupScene = useCallback(() => {
    const pixR = window.devicePixelRatio || 1;
    cameraRef.current = new THREE.OrthographicCamera(
      0,
      window.innerWidth,
      window.innerHeight,
      0,
      -10000,
      10000
    );
    cameraRef.current.position.z = 2.5;

    sceneRef.current.background = new THREE.Color(0x000000);
    sceneRef.current.add(cameraRef.current);

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setPixelRatio(pixR);
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.domElement.style.display = "block";

    if (mountRef.current) {
      mountRef.current.appendChild(rendererRef.current.domElement);
    }

    sceneRef.current.add(worldRef.current);
  }, []);

  const setupWindowManager = useCallback(() => {
    windowManagerRef.current.init();
    windowManagerRef.current.setWinShapeChangeCallback(updateWindowShape);
    windowManagerRef.current.setWinChangeCallback(windowsUpdated);
    windowsUpdated();
  }, []);

  const windowsUpdated = useCallback(() => {
    updateNumberOfCubes();
  }, []);

  const updateNumberOfCubes = useCallback(() => {
    const wins = windowManagerRef.current.getWindows();
    console.log("wins", wins);
    cubesRef.current.forEach((c) => {
      worldRef.current.remove(c);
    });
    cubesRef.current = [];

    wins.forEach((win, i) => {
      const color = new THREE.Color().setHSL(i * 0.1, 1.0, 0.5);
      const size = 100 + i * 50;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshBasicMaterial({ color: color, wireframe: true })
      );
      cube.position.x = win.shape.x + win.shape.w * 0.5;
      cube.position.y = win.shape.y + win.shape.h * 0.5;
      worldRef.current.add(cube);
      cubesRef.current.push(cube);
    });
  }, []);

  const updateWindowShape = useCallback((easing: boolean = true) => {
    const newX = -window.screenX;
    const newY = -window.screenY;

    if (!easing) {
      sceneOffsetRef.current = { x: newX, y: newY };
    }
  }, []);

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (cameraRef.current && rendererRef.current) {
      cameraRef.current.left = 0;
      cameraRef.current.right = width;
      cameraRef.current.top = height;
      cameraRef.current.bottom = 0;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    }
  }, []);

  const render = useCallback(() => {
    const time = getTime();
    windowManagerRef.current.update();

    const falloff = 0.05;
    sceneOffsetRef.current.x +=
      (sceneOffsetRef.current.x - sceneOffsetRef.current.x) * falloff;
    sceneOffsetRef.current.y +=
      (sceneOffsetRef.current.y - sceneOffsetRef.current.y) * falloff;
    worldRef.current.position.x = sceneOffsetRef.current.x;
    worldRef.current.position.y = sceneOffsetRef.current.y;

    const wins = windowManagerRef.current.getWindows();
    cubesRef.current.forEach((cube, i) => {
      const win = wins[i];
      const posTarget = {
        x: win.shape.x + win.shape.w * 0.5,
        y: win.shape.y + win.shape.h * 0.5,
      };
      cube.position.x += (posTarget.x - cube.position.x) * falloff;
      cube.position.y += (posTarget.y - cube.position.y) * falloff;
      cube.rotation.x = time * 0.5;
      cube.rotation.y = time * 0.3;
    });
    if (
      rendererRef.current &&
      cameraRef.current instanceof THREE.OrthographicCamera
    ) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    requestRef.current = requestAnimationFrame(render);
  }, []);

  return <div ref={mountRef} style={style} />;
};

export default ThreeScene;
