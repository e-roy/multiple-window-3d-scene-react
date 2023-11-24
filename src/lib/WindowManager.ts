// lib/WindowManager.ts
import { v4 as uuidv4 } from "uuid";

type WindowShape = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type WindowData = {
  id: string;
  shape: WindowShape;
};

export default class WindowManager {
  private windows: Map<string, WindowData> = new Map();
  private windowIdKey: string = "windowId";
  private winData: WindowData | null = null;
  private winShapeChangeCallback?: (easing?: boolean) => void;
  private winChangeCallback?: () => void;

  constructor() {
    const windowsRaw = window.localStorage.getItem("windows");
    const windowsParsed: WindowData[] = windowsRaw
      ? JSON.parse(windowsRaw)
      : [];
    windowsParsed.forEach((winData) => this.windows.set(winData.id, winData));

    window.addEventListener("storage", (event) => {
      if (event.key === "windows") {
        this.windows.clear();
        const newWindowsParsed: WindowData[] = event.newValue
          ? JSON.parse(event.newValue)
          : [];
        newWindowsParsed.forEach((winData) =>
          this.windows.set(winData.id, winData)
        );

        if (this.winChangeCallback) {
          this.winChangeCallback();
        }
      }
    });

    window.addEventListener("beforeunload", this.cleanup);
  }

  public cleanup = () => {
    if (this.winData) {
      this.windows.delete(this.winData.id);
      this.updateWindowsLocalStorage();
    }
  };

  public init(): void {
    let windowId = sessionStorage.getItem(this.windowIdKey);
    if (!windowId) {
      windowId = uuidv4();
      sessionStorage.setItem(this.windowIdKey, windowId);
    }

    const shape = this.getWinShape();
    this.winData = { id: windowId, shape };
    this.windows.set(windowId, this.winData);

    this.updateWindowsLocalStorage();
  }

  private getWinShape(): WindowShape {
    return {
      x: window.screenX,
      y: window.screenY,
      w: window.innerWidth,
      h: window.innerHeight,
    };
  }

  private updateWindowsLocalStorage(): void {
    const windowsArray = Array.from(this.windows.values());
    window.localStorage.setItem("windows", JSON.stringify(windowsArray));
  }

  public update(): void {
    if (!this.winData) return;
    const winShape = this.getWinShape();

    if (
      winShape.x !== this.winData.shape.x ||
      winShape.y !== this.winData.shape.y ||
      winShape.w !== this.winData.shape.w ||
      winShape.h !== this.winData.shape.h
    ) {
      this.winData.shape = winShape;
      if (this.winShapeChangeCallback) {
        this.winShapeChangeCallback(false);
      }
      this.updateWindowsLocalStorage();
    }
  }

  public setWinShapeChangeCallback(callback: (easing?: boolean) => void): void {
    this.winShapeChangeCallback = callback;
  }

  public setWinChangeCallback(callback: () => void): void {
    this.winChangeCallback = callback;
  }

  public getWindows(): WindowData[] {
    return Array.from(this.windows.values());
  }

  public getThisWindowData(): WindowData | null {
    return this.winData;
  }

  public getThisWindowID(): string | null {
    return this.winData ? this.winData.id : null;
  }
}
