declare module 'grapesjs' {
  export interface EditorConfig {
    container: HTMLElement;
    height?: string;
    width?: string;
    plugins?: any[];
    pluginsOpts?: any;
    canvas?: any;
    storageManager?: any;
    assetManager?: any;
    blockManager?: any;
    layerManager?: any;
    deviceManager?: any;
    panels?: any;
  }

  export interface Editor {
    init(config: EditorConfig): Editor;
    destroy(): void;
    getHtml(): string;
    getCss(): string;
    setComponents(html: string): void;
    getProjectData(): any;
    loadProjectData(data: any): void;
    setDevice(device: string): void;
    BlockManager: {
      add(id: string, config: any): void;
    };
    Commands: {
      add(id: string, config: any): void;
    };
    Panels: {
      getPanel(id: string): any;
    };
    LayerManager: {
      render(): HTMLElement | null;
    };
    SelectorManager: {
      render(selectors: any[]): HTMLElement | null;
    };
    StyleManager: {
      render(): HTMLElement | null;
    };
    on(event: string, callback: Function): void;
  }

  const grapesjs: {
    init(config: EditorConfig): Editor;
  };

  export default grapesjs;
}

declare module 'grapesjs-preset-newsletter' {
  const newsletter: any;
  export default newsletter;
}