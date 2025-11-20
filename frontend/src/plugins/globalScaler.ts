import type { App } from 'vue'

interface ScalerOptions {
  minScale?: number
  maxScale?: number
  baseWidth?: number
  baseHeight?: number
  enableScale?: boolean
}

class GlobalScaler {
  private currentScale = 1
  private options: Required<ScalerOptions>
  private listeners: (() => void)[] = []

  constructor(options: ScalerOptions = {}) {
    this.options = {
      minScale: 0.5,
      maxScale: 2.0,
      baseWidth: 1920,
      baseHeight: 1080,
      enableScale: true,
      ...options
    }
  }

  updateScale() {
    if (!this.options.enableScale) {
      this.currentScale = 1
      this.applyScale()
      return
    }

    const { innerWidth, innerHeight } = window
    const scaleX = innerWidth / this.options.baseWidth
    const scaleY = innerHeight / this.options.baseHeight
    const scale = Math.min(scaleX, scaleY)
    
    this.currentScale = Math.max(
      this.options.minScale, 
      Math.min(this.options.maxScale, scale)
    )
    
    this.applyScale()
  }

  private applyScale() {
    const root = document.getElementById('app')
    if (root) {
      root.style.transform = `scale(${this.currentScale})`
      root.style.transformOrigin = 'top left'
      root.style.width = `${100 / this.currentScale}%`
      root.style.height = `${100 / this.currentScale}%`
    }
  }

  init() {
    this.updateScale()
    const handleResize = () => this.updateScale()
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    this.listeners.push(() => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    })
  }

  destroy() {
    this.listeners.forEach(listener => listener())
    this.listeners = []
  }

  getScale() {
    return this.currentScale
  }

  setOptions(options: Partial<ScalerOptions>) {
    Object.assign(this.options, options)
    this.updateScale()
  }

  toggleScale() {
    this.options.enableScale = !this.options.enableScale
    this.updateScale()
  }

  isEnabled() {
    return this.options.enableScale
  }
}

// 声明模块扩展
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $scaler: GlobalScaler
  }
}

const GlobalScalerPlugin = {
  install(app: App, options: ScalerOptions = {}) {
    const scaler = new GlobalScaler(options)
    scaler.init()
    
    app.config.globalProperties.$scaler = scaler
    app.provide('scaler', scaler)
  }
}

export default GlobalScalerPlugin
export { GlobalScaler } 