// Simple state management for games
import { create } from "zustand"

export type Player = {
  id: "host" | "guest"
  name: string
}

export type GameType = "pong" | "snake" | null

type GameStore = {
  isHost: boolean
  setIsHost: (isHost: boolean) => void

  player: Player
  opponent: Player | null
  setPlayer: (player: Player) => void
  setOpponent: (opponent: Player | null) => void

  currentGame: GameType
  setCurrentGame: (game: GameType) => void

  settings: {
    playerName: string
    soundEnabled: boolean
  }
  updateSettings: (settings: Partial<GameStore["settings"]>) => void
}

export const useGameStore = create<GameStore>((set) => ({
  isHost: false,
  setIsHost: (isHost) => set({ isHost }),

  player: { id: "host", name: "Player 1" },
  opponent: null,
  setPlayer: (player) => set({ player }),
  setOpponent: (opponent) => set({ opponent }),

  currentGame: null,
  setCurrentGame: (game) => set({ currentGame: game }),

  settings: {
    playerName: "Player",
    soundEnabled: true,
  },
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
}))
