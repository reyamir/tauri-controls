import { getCurrent, type Window } from "@tauri-apps/api/window"
import { type } from "@tauri-apps/plugin-os"
import React, { createContext, useCallback, useEffect, useState } from "react"

interface TauriAppWindowContextType {
  appWindow: Window | null
  isWindowMaximized: boolean
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  fullscreenWindow: () => Promise<void>
  closeWindow: () => Promise<void>
}

const TauriAppWindowContext = createContext<TauriAppWindowContextType>({
  appWindow: null,
  isWindowMaximized: false,
  minimizeWindow: () => Promise.resolve(),
  maximizeWindow: () => Promise.resolve(),
  fullscreenWindow: () => Promise.resolve(),
  closeWindow: () => Promise.resolve(),
})

interface TauriAppWindowProviderProps {
  children: React.ReactNode
}

export const TauriAppWindowProvider: React.FC<TauriAppWindowProviderProps> = ({
  children,
}: any) => {
  const [appWindow, setAppWindow] = useState<Window | null>(null)
  const [isWindowMaximized, setIsWindowMaximized] = useState(false)

  // Fetch the Tauri window plugin when the component mounts
  // Dynamically import plugin-window for next.js, sveltekit, nuxt etc. support:
  // https://github.com/tauri-apps/plugins-workspace/issues/217
  useEffect(() => {
    if (typeof window !== "undefined") {
      const window = getCurrent()
      setAppWindow(window)
    }
  }, [])

  // Update the isWindowMaximized state when the window is resized
  const updateIsWindowMaximized = useCallback(async () => {
    if (appWindow) {
      const _isWindowMaximized = await appWindow.isMaximized()
      setIsWindowMaximized(_isWindowMaximized)
    }
  }, [appWindow])

  useEffect(() => {
    let unlisten: () => void = () => {}

    async function getOsType() {
      const osname = await type()
      // temporary: https://github.com/agmmnn/tauri-controls/issues/10#issuecomment-1675884962
      if (osname !== "macos") {
        updateIsWindowMaximized()

        const listen = async () => {
          if (appWindow) {
            unlisten = await appWindow.onResized(() => {
              updateIsWindowMaximized()
            })
          }
        }
        listen()
      }
    }

    getOsType()

    // Cleanup the listener when the component unmounts
    return () => unlisten && unlisten()
  }, [appWindow, updateIsWindowMaximized])

  const minimizeWindow = async () => {
    if (appWindow) {
      await appWindow.minimize()
    }
  }

  const maximizeWindow = async () => {
    if (appWindow) {
      await appWindow.toggleMaximize()
    }
  }

  const fullscreenWindow = async () => {
    if (appWindow) {
      const fullscreen = await appWindow.isFullscreen()
      if (fullscreen) {
        await appWindow.setFullscreen(false)
      } else {
        await appWindow.setFullscreen(true)
      }
    }
  }

  const closeWindow = async () => {
    if (appWindow) {
      await appWindow.close()
    }
  }

  // Provide the context values to the children components
  return (
    <TauriAppWindowContext.Provider
      value={{
        appWindow,
        isWindowMaximized,
        minimizeWindow,
        maximizeWindow,
        fullscreenWindow,
        closeWindow,
      }}
    >
      {children}
    </TauriAppWindowContext.Provider>
  )
}

export default TauriAppWindowContext
