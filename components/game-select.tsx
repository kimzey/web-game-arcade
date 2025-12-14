"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { P2PConnection } from "@/lib/p2p-connection"
import { useGameStore } from "@/lib/game-store"
import { PongGame } from "@/components/games/pong-game"
import { SnakeGame } from "@/components/games/snake-game"
import { SpaceShooterGame } from "@/components/games/space-shooter-game"
import { Gamepad2, ArrowLeft } from "lucide-react"

type GameSelectProps = {
  connection: P2PConnection | null
  isSinglePlayer?: boolean
  onBack?: () => void
}

export function GameSelect({ connection, isSinglePlayer = false, onBack }: GameSelectProps) {
  const { currentGame, setCurrentGame } = useGameStore()
  const [selectedGame, setSelectedGame] = useState<"pong" | "snake" | "shooter" | null>(null)

  const handleGameSelect = (game: "pong" | "snake" | "shooter") => {
    if (isSinglePlayer) {
      setCurrentGame(game)
      return
    }

    setSelectedGame(game)
    connection?.send("game-selected", { game })
    setCurrentGame(game)
  }

  const handleBackToLobby = () => {
    setCurrentGame(null)
    setSelectedGame(null)
    if (!isSinglePlayer) {
      connection?.send("back-to-lobby", {})
    }
    onBack?.()
  }

  if (!isSinglePlayer && connection) {
    connection.onMessage((message) => {
      if (message.type === "game-selected") {
        setCurrentGame(message.data.game)
      } else if (message.type === "back-to-lobby") {
        setCurrentGame(null)
        setSelectedGame(null)
      }
    })
  }

  if (currentGame === "pong") {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 left-4 z-50">
          <Button variant="outline" size="sm" onClick={handleBackToLobby}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Button>
        </div>
        <PongGame connection={connection} isSinglePlayer={isSinglePlayer} />
      </div>
    )
  }

  if (currentGame === "snake") {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 left-4 z-50">
          <Button variant="outline" size="sm" onClick={handleBackToLobby}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Button>
        </div>
        <SnakeGame connection={connection} isSinglePlayer={isSinglePlayer} />
      </div>
    )
  }

  if (currentGame === "shooter") {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 left-4 z-50">
          <Button variant="outline" size="sm" onClick={handleBackToLobby}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Button>
        </div>
        <SpaceShooterGame connection={connection} isSinglePlayer={isSinglePlayer} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/10">
      <div className="w-full max-w-6xl space-y-6">
        <div className="fixed top-4 left-4 z-50">
          <Button variant="outline" size="sm" onClick={handleBackToLobby}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Gamepad2 className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-primary">เลือกเกม</h1>
          </div>
          <p className="text-muted-foreground">{isSinglePlayer ? "เลือกเกมที่จะเล่น" : "เลือกเกมที่จะเล่นกับเพื่อน"}</p>
          {selectedGame && !isSinglePlayer && <p className="text-sm text-primary animate-pulse">รอเพื่อนยืนยัน...</p>}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Pong Game Card */}
          <Card
            className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:border-primary/50 ${
              selectedGame === "pong" ? "border-primary border-2 ring-2 ring-primary/20" : "border-2"
            }`}
            onClick={() => !selectedGame && handleGameSelect("pong")}
          >
            <div className="p-6 space-y-4">
              <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Simple Pong Preview */}
                <div className="absolute inset-0 flex items-center justify-between px-8">
                  <div className="w-3 h-20 bg-primary rounded-sm" />
                  <div className="w-4 h-4 bg-primary rounded-full" />
                  <div className="w-3 h-20 bg-primary rounded-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold">Co-op Pong</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">ร่วมมือรักษาบอลไว้ให้นานที่สุด</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">ร่วมมือ</span>
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">เร็ว</span>
                </div>
              </div>

              <Button
                className="w-full"
                variant={selectedGame === "pong" ? "default" : "secondary"}
                disabled={selectedGame !== null && !isSinglePlayer}
                size="sm"
              >
                {selectedGame === "pong" ? "เลือกแล้ว" : "เล่น"}
              </Button>
            </div>
          </Card>

          {/* Snake Game Card */}
          <Card
            className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:border-primary/50 ${
              selectedGame === "snake" ? "border-primary border-2 ring-2 ring-primary/20" : "border-2"
            }`}
            onClick={() => !selectedGame && handleGameSelect("snake")}
          >
            <div className="p-6 space-y-4">
              <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Simple Snake Preview */}
                <div className="grid grid-cols-8 grid-rows-5 gap-1 p-4">
                  <div className="bg-primary rounded-sm" />
                  <div className="bg-primary rounded-sm" />
                  <div className="bg-primary rounded-sm" />
                  <div className="bg-primary rounded-sm" />
                  <div className="col-start-7 bg-chart-3 rounded-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold">Co-op Snake</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">เก็บอาหารร่วมกัน ต้องทำงานเป็นทีม</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">ร่วมมือ</span>
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">กลยุทธ์</span>
                </div>
              </div>

              <Button
                className="w-full"
                variant={selectedGame === "snake" ? "default" : "secondary"}
                disabled={selectedGame !== null && !isSinglePlayer}
                size="sm"
              >
                {selectedGame === "snake" ? "เลือกแล้ว" : "เล่น"}
              </Button>
            </div>
          </Card>

          <Card
            className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:border-primary/50 ${
              selectedGame === "shooter" ? "border-primary border-2 ring-2 ring-primary/20" : "border-2"
            }`}
            onClick={() => !selectedGame && handleGameSelect("shooter")}
          >
            <div className="p-6 space-y-4">
              <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Simple Shooter Preview */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="absolute top-8 flex gap-4">
                    <div className="w-6 h-6 bg-red-500 rounded rotate-45" />
                    <div className="w-6 h-6 bg-red-500 rounded rotate-45" />
                    <div className="w-6 h-6 bg-red-500 rounded rotate-45" />
                  </div>
                  <div className="absolute bottom-8 flex gap-8">
                    <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] border-b-primary" />
                    <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] border-b-chart-3" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold">Space Shooter</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">ยิงศัตรูร่วมกัน ป้องกันยานให้รอด</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">ร่วมมือ</span>
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">แอ็กชัน</span>
                  <span className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded">ใหม่!</span>
                </div>
              </div>

              <Button
                className="w-full"
                variant={selectedGame === "shooter" ? "default" : "secondary"}
                disabled={selectedGame !== null && !isSinglePlayer}
                size="sm"
              >
                {selectedGame === "shooter" ? "เลือกแล้ว" : "เล่น"}
              </Button>
            </div>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">{isSinglePlayer ? "พร้อมเล่น!" : "เชื่อมต่อแล้วและพร้อมเล่น!"}</p>
        </div>
      </div>
    </div>
  )
}
