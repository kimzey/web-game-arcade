"use client"

import { useEffect, useRef, useState } from "react"
import type { P2PConnection } from "@/lib/p2p-connection"
import { Card } from "@/components/ui/card"

type SpaceShooterGameProps = {
  connection: P2PConnection | null
  isSinglePlayer?: boolean
}

type Position = { x: number; y: number }
type Enemy = Position & { health: number; type: number }
type Bullet = Position & { ownerId: 1 | 2 }
type PowerUp = Position & { type: "health" | "speed" | "shield" }

type GameState = {
  player1: Position & { health: number; shield: boolean }
  player2: Position & { health: number; shield: boolean }
  bullets: Bullet[]
  enemies: Enemy[]
  powerUps: PowerUp[]
  score: number
  wave: number
  timeLeft: number
  gameOver: boolean
}

export function SpaceShooterGame({ connection, isSinglePlayer = false }: SpaceShooterGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isHost] = useState(() => (isSinglePlayer ? true : Math.random() > 0.5))
  const [score, setScore] = useState(0)
  const [wave, setWave] = useState(1)
  const [timeLeft, setTimeLeft] = useState(120)
  const [gameOver, setGameOver] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [touchControls, setTouchControls] = useState({ x: 0, y: 0, shooting: false })

  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600
  const PLAYER_SIZE = 30
  const BULLET_SIZE = 8
  const ENEMY_SIZE = 40

  const gameStateRef = useRef<GameState>({
    player1: { x: 200, y: 500, health: 100, shield: false },
    player2: { x: 600, y: 500, health: 100, shield: false },
    bullets: [],
    enemies: [],
    powerUps: [],
    score: 0,
    wave: 1,
    timeLeft: 120,
    gameOver: false,
  })

  const keys = useRef<{ [key: string]: boolean }>({})
  const shootCooldown1 = useRef(0)
  const shootCooldown2 = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let frameCount = 0

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key] = false
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      const rect = canvas.getBoundingClientRect()
      setTouchControls({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        shooting: true,
      })
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const rect = canvas.getBoundingClientRect()
      setTouchControls((prev) => ({
        ...prev,
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      }))
    }

    const handleTouchEnd = () => {
      setTouchControls({ x: 0, y: 0, shooting: false })
    }

    canvas.addEventListener("touchstart", handleTouchStart)
    canvas.addEventListener("touchmove", handleTouchMove)
    canvas.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    if (!isSinglePlayer && connection) {
      connection.onMessage((message) => {
        if (message.type === "player-move") {
          if (isHost) {
            gameStateRef.current.player2 = message.data.position
          } else {
            gameStateRef.current.player1 = message.data.position
          }
        } else if (message.type === "shoot") {
          gameStateRef.current.bullets.push(message.data.bullet)
        } else if (message.type === "game-state-sync" && !isHost) {
          gameStateRef.current = message.data.state
          setScore(message.data.state.score)
          setWave(message.data.state.wave)
          setTimeLeft(message.data.state.timeLeft)
        } else if (message.type === "game-over") {
          gameStateRef.current.gameOver = true
          setGameOver(true)
          if (message.data.score > highScore) {
            setHighScore(message.data.score)
          }
        } else if (message.type === "reset-game") {
          resetGame()
        }
      })
    }

    const resetGame = () => {
      gameStateRef.current = {
        player1: { x: 200, y: 500, health: 100, shield: false },
        player2: { x: 600, y: 500, health: 100, shield: false },
        bullets: [],
        enemies: [],
        powerUps: [],
        score: 0,
        wave: 1,
        timeLeft: 120,
        gameOver: false,
      }
      setScore(0)
      setWave(1)
      setTimeLeft(120)
      setGameOver(false)
      shootCooldown1.current = 0
      shootCooldown2.current = 0
    }

    const spawnEnemies = (wave: number) => {
      const state = gameStateRef.current
      const enemyCount = Math.min(5 + wave * 2, 15)

      for (let i = 0; i < enemyCount; i++) {
        setTimeout(() => {
          const enemy: Enemy = {
            x: Math.random() * (CANVAS_WIDTH - ENEMY_SIZE),
            y: -ENEMY_SIZE - Math.random() * 300,
            health: 1 + Math.floor(wave / 3),
            type: Math.floor(Math.random() * 3),
          }
          state.enemies.push(enemy)
        }, i * 500)
      }
    }

    const spawnPowerUp = () => {
      const state = gameStateRef.current
      if (Math.random() < 0.01) {
        const types: ("health" | "speed" | "shield")[] = ["health", "speed", "shield"]
        const powerUp: PowerUp = {
          x: Math.random() * (CANVAS_WIDTH - 30),
          y: -30,
          type: types[Math.floor(Math.random() * types.length)],
        }
        state.powerUps.push(powerUp)
      }
    }

    const gameLoop = () => {
      const state = gameStateRef.current
      frameCount++

      if (frameCount % 60 === 0 && !state.gameOver) {
        state.timeLeft--
        setTimeLeft(state.timeLeft)

        if (state.timeLeft <= 0) {
          state.gameOver = true
          setGameOver(true)
          if (state.score > highScore) {
            setHighScore(state.score)
          }
          if (!isSinglePlayer) {
            connection?.send("game-over", { score: state.score })
          }
        }
      }

      if (shootCooldown1.current > 0) shootCooldown1.current--
      if (shootCooldown2.current > 0) shootCooldown2.current--

      if (!state.gameOver && (isSinglePlayer || isHost)) {
        // Movement
        const PLAYER_SPEED = 6

        if (isSinglePlayer) {
          if (keys.current["w"] || keys.current["W"]) {
            state.player1.y = Math.max(CANVAS_HEIGHT / 2, state.player1.y - PLAYER_SPEED)
          }
          if (keys.current["s"] || keys.current["S"]) {
            state.player1.y = Math.min(CANVAS_HEIGHT - PLAYER_SIZE, state.player1.y + PLAYER_SPEED)
          }
          if (keys.current["a"] || keys.current["A"]) {
            state.player1.x = Math.max(0, state.player1.x - PLAYER_SPEED)
          }
          if (keys.current["d"] || keys.current["D"]) {
            state.player1.x = Math.min(CANVAS_WIDTH - PLAYER_SIZE, state.player1.x + PLAYER_SPEED)
          }

          if (keys.current["ArrowUp"]) {
            state.player2.y = Math.max(CANVAS_HEIGHT / 2, state.player2.y - PLAYER_SPEED)
          }
          if (keys.current["ArrowDown"]) {
            state.player2.y = Math.min(CANVAS_HEIGHT - PLAYER_SIZE, state.player2.y + PLAYER_SPEED)
          }
          if (keys.current["ArrowLeft"]) {
            state.player2.x = Math.max(0, state.player2.x - PLAYER_SPEED)
          }
          if (keys.current["ArrowRight"]) {
            state.player2.x = Math.min(CANVAS_WIDTH - PLAYER_SIZE, state.player2.x + PLAYER_SPEED)
          }

          if (keys.current[" "] && shootCooldown1.current === 0) {
            state.bullets.push({
              x: state.player1.x + PLAYER_SIZE / 2,
              y: state.player1.y,
              ownerId: 1,
            })
            shootCooldown1.current = 15
          }

          if (keys.current["Shift"] && shootCooldown2.current === 0) {
            state.bullets.push({
              x: state.player2.x + PLAYER_SIZE / 2,
              y: state.player2.y,
              ownerId: 2,
            })
            shootCooldown2.current = 15
          }
        } else {
          const myPlayer = isHost ? state.player1 : state.player2
          const myCooldown = isHost ? shootCooldown1 : shootCooldown2

          if (touchControls.shooting && touchControls.x > 0) {
            const dx = touchControls.x - myPlayer.x
            const dy = touchControls.y - myPlayer.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist > 10) {
              myPlayer.x += (dx / dist) * PLAYER_SPEED
              myPlayer.y += (dy / dist) * PLAYER_SPEED
            }
          } else {
            if (keys.current["ArrowUp"] || keys.current["w"] || keys.current["W"]) {
              myPlayer.y = Math.max(CANVAS_HEIGHT / 2, myPlayer.y - PLAYER_SPEED)
            }
            if (keys.current["ArrowDown"] || keys.current["s"] || keys.current["S"]) {
              myPlayer.y = Math.min(CANVAS_HEIGHT - PLAYER_SIZE, myPlayer.y + PLAYER_SPEED)
            }
            if (keys.current["ArrowLeft"] || keys.current["a"] || keys.current["A"]) {
              myPlayer.x = Math.max(0, myPlayer.x - PLAYER_SPEED)
            }
            if (keys.current["ArrowRight"] || keys.current["d"] || keys.current["D"]) {
              myPlayer.x = Math.min(CANVAS_WIDTH - PLAYER_SIZE, myPlayer.x + PLAYER_SPEED)
            }
          }

          myPlayer.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, myPlayer.x))
          myPlayer.y = Math.max(CANVAS_HEIGHT / 2, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, myPlayer.y))

          if ((keys.current[" "] || touchControls.shooting) && myCooldown.current === 0) {
            const bullet: Bullet = {
              x: myPlayer.x + PLAYER_SIZE / 2,
              y: myPlayer.y,
              ownerId: isHost ? 1 : 2,
            }
            state.bullets.push(bullet)
            if (isHost) {
              shootCooldown1.current = 15
            } else {
              shootCooldown2.current = 15
            }
            connection?.send("shoot", { bullet })
          }

          connection?.send("player-move", { position: myPlayer })
        }

        // Update bullets
        state.bullets = state.bullets.filter((bullet) => {
          bullet.y -= 10
          return bullet.y > -BULLET_SIZE
        })

        // Update enemies
        state.enemies = state.enemies.filter((enemy) => {
          enemy.y += 2 + state.wave * 0.3
          if (enemy.y > CANVAS_HEIGHT) {
            return false
          }
          return true
        })

        // Update power-ups
        state.powerUps = state.powerUps.filter((powerUp) => {
          powerUp.y += 3
          return powerUp.y < CANVAS_HEIGHT
        })

        // Collision detection
        state.bullets.forEach((bullet, bIndex) => {
          state.enemies.forEach((enemy, eIndex) => {
            if (
              bullet.x > enemy.x &&
              bullet.x < enemy.x + ENEMY_SIZE &&
              bullet.y > enemy.y &&
              bullet.y < enemy.y + ENEMY_SIZE
            ) {
              enemy.health--
              state.bullets.splice(bIndex, 1)
              if (enemy.health <= 0) {
                state.enemies.splice(eIndex, 1)
                state.score += 10
                setScore(state.score)
              }
            }
          })
        })

        // Enemy collision with players
        state.enemies.forEach((enemy, eIndex) => {
          const checkPlayerCollision = (player: typeof state.player1) => {
            if (
              enemy.x < player.x + PLAYER_SIZE &&
              enemy.x + ENEMY_SIZE > player.x &&
              enemy.y < player.y + PLAYER_SIZE &&
              enemy.y + ENEMY_SIZE > player.y
            ) {
              if (!player.shield) {
                player.health -= 20
              } else {
                player.shield = false
              }
              state.enemies.splice(eIndex, 1)
              return true
            }
            return false
          }

          checkPlayerCollision(state.player1) || checkPlayerCollision(state.player2)
        })

        // Power-up collection
        state.powerUps = state.powerUps.filter((powerUp) => {
          const checkPowerUpCollision = (player: typeof state.player1) => {
            if (
              powerUp.x < player.x + PLAYER_SIZE &&
              powerUp.x + 30 > player.x &&
              powerUp.y < player.y + PLAYER_SIZE &&
              powerUp.y + 30 > player.y
            ) {
              if (powerUp.type === "health") {
                player.health = Math.min(100, player.health + 30)
              } else if (powerUp.type === "shield") {
                player.shield = true
              }
              return true
            }
            return false
          }

          return !(checkPowerUpCollision(state.player1) || checkPowerUpCollision(state.player2))
        })

        // Game over check
        if (state.player1.health <= 0 && state.player2.health <= 0) {
          state.gameOver = true
          setGameOver(true)
          if (state.score > highScore) {
            setHighScore(state.score)
          }
          if (!isSinglePlayer) {
            connection?.send("game-over", { score: state.score })
          }
        }

        // Wave system
        if (state.enemies.length === 0) {
          state.wave++
          setWave(state.wave)
          spawnEnemies(state.wave)
        }

        // Spawn power-ups
        spawnPowerUp()

        if (!isSinglePlayer && connection) {
          connection.send("game-state-sync", { state })
        }
      }

      // Render
      ctx.fillStyle = "oklch(0.08 0.02 240)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw stars background
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`
        ctx.fillRect(Math.random() * CANVAS_WIDTH, (frameCount * 2 + i * 20) % CANVAS_HEIGHT, 2, 2)
      }

      // Draw bullets
      ctx.fillStyle = "oklch(0.75 0.15 195)"
      state.bullets.forEach((bullet) => {
        ctx.beginPath()
        ctx.arc(bullet.x, bullet.y, BULLET_SIZE / 2, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw enemies
      state.enemies.forEach((enemy) => {
        ctx.fillStyle =
          enemy.type === 0 ? "oklch(0.6 0.2 0)" : enemy.type === 1 ? "oklch(0.6 0.2 30)" : "oklch(0.6 0.2 330)"
        ctx.beginPath()
        ctx.moveTo(enemy.x + ENEMY_SIZE / 2, enemy.y)
        ctx.lineTo(enemy.x, enemy.y + ENEMY_SIZE)
        ctx.lineTo(enemy.x + ENEMY_SIZE, enemy.y + ENEMY_SIZE)
        ctx.closePath()
        ctx.fill()

        // Health bar
        ctx.fillStyle = "oklch(0.3 0.05 0)"
        ctx.fillRect(enemy.x, enemy.y - 8, ENEMY_SIZE, 4)
        ctx.fillStyle = "oklch(0.6 0.2 150)"
        ctx.fillRect(enemy.x, enemy.y - 8, (ENEMY_SIZE * enemy.health) / (1 + Math.floor(state.wave / 3)), 4)
      })

      // Draw power-ups
      state.powerUps.forEach((powerUp) => {
        ctx.fillStyle =
          powerUp.type === "health"
            ? "oklch(0.6 0.2 150)"
            : powerUp.type === "shield"
              ? "oklch(0.75 0.15 195)"
              : "oklch(0.7 0.2 60)"
        ctx.beginPath()
        ctx.arc(powerUp.x + 15, powerUp.y + 15, 12, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "oklch(0.98 0.01 240)"
        ctx.font = "bold 16px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(
          powerUp.type === "health" ? "+" : powerUp.type === "shield" ? "S" : "⚡",
          powerUp.x + 15,
          powerUp.y + 20,
        )
      })

      // Draw players
      const drawPlayer = (player: typeof state.player1, color: string) => {
        if (player.shield) {
          ctx.strokeStyle = "oklch(0.75 0.15 195)"
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2, PLAYER_SIZE / 2 + 5, 0, Math.PI * 2)
          ctx.stroke()
        }

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(player.x + PLAYER_SIZE / 2, player.y)
        ctx.lineTo(player.x, player.y + PLAYER_SIZE)
        ctx.lineTo(player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE - 10)
        ctx.lineTo(player.x + PLAYER_SIZE, player.y + PLAYER_SIZE)
        ctx.closePath()
        ctx.fill()

        // Health bar
        ctx.fillStyle = "oklch(0.2 0.05 0)"
        ctx.fillRect(player.x - 5, player.y + PLAYER_SIZE + 5, PLAYER_SIZE + 10, 6)
        ctx.fillStyle = player.health > 50 ? "oklch(0.6 0.2 150)" : "oklch(0.6 0.2 0)"
        ctx.fillRect(player.x - 5, player.y + PLAYER_SIZE + 5, ((PLAYER_SIZE + 10) * player.health) / 100, 6)
      }

      drawPlayer(state.player1, "oklch(0.75 0.15 195)")
      drawPlayer(state.player2, "oklch(0.65 0.2 330)")

      // UI
      ctx.fillStyle = "oklch(0.98 0.01 240)"
      ctx.font = "bold 20px sans-serif"
      ctx.textAlign = "left"
      ctx.fillText(`คะแนน: ${state.score}`, 20, 30)
      ctx.fillText(`เวฟ: ${state.wave}`, 20, 60)

      ctx.textAlign = "right"
      const minutes = Math.floor(state.timeLeft / 60)
      const seconds = state.timeLeft % 60
      ctx.fillText(`${minutes}:${seconds.toString().padStart(2, "0")}`, CANVAS_WIDTH - 20, 30)

      if (state.gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        ctx.fillStyle = "oklch(0.98 0.01 240)"
        ctx.font = "bold 48px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("จบเกม!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
        ctx.font = "24px sans-serif"
        ctx.fillText(`คะแนน: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10)
        ctx.fillText(`เวฟสูงสุด: ${state.wave}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
        ctx.font = "18px sans-serif"
        ctx.fillText("กด SPACE เพื่อเล่นอีกครั้ง", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70)
      }

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    const handleRestart = (e: KeyboardEvent) => {
      if (e.key === " " && gameOver) {
        if (isSinglePlayer || isHost) {
          if (!isSinglePlayer) {
            connection?.send("reset-game", {})
          }
          resetGame()
          spawnEnemies(1)
        }
      }
    }
    window.addEventListener("keydown", handleRestart)

    spawnEnemies(1)
    gameLoop()

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("keydown", handleRestart)
      cancelAnimationFrame(animationFrameId)
    }
  }, [connection, isHost, gameOver, highScore, isSinglePlayer, touchControls])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-primary">Space Shooter Co-op</h2>
        <p className="text-muted-foreground">
          {isSinglePlayer
            ? "ยานฟ้า: WASD+Space • ยานชมพู: ลูกศร+Shift"
            : `คุณควบคุมยาน${isHost ? "ฟ้า" : "ชมพู"} • ลูกศรหรือ WASD+Space`}
        </p>
      </div>

      <Card className="p-4 border-2 relative">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="rounded-lg touch-none" />
        <div className="md:hidden absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground">
          แตะและลากเพื่อเคลื่อนที่ • ยิงอัตโนมัติ
        </div>
      </Card>

      <div className="flex gap-8 text-center flex-wrap justify-center">
        <Card className="px-6 py-3 min-w-[120px]">
          <p className="text-sm text-muted-foreground">คะแนน</p>
          <p className="text-3xl font-bold text-primary">{score}</p>
        </Card>
        <Card className="px-6 py-3 min-w-[120px]">
          <p className="text-sm text-muted-foreground">เวฟ</p>
          <p className="text-3xl font-bold text-primary">{wave}</p>
        </Card>
        <Card className="px-6 py-3 min-w-[120px]">
          <p className="text-sm text-muted-foreground">เวลาเหลือ</p>
          <p className="text-3xl font-bold text-primary">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </p>
        </Card>
        <Card className="px-6 py-3 min-w-[120px]">
          <p className="text-sm text-muted-foreground">คะแนนสูงสุด</p>
          <p className="text-3xl font-bold text-primary">{highScore}</p>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground max-w-md">
        <p>{isSinglePlayer ? "ควบคุมสองยานพร้อมกัน" : "ร่วมมือ"}ยิงศัตรูและอยู่รอด!</p>
        <p className="mt-2">ยิงศัตรู +10 คะแนน • แต่ละเวฟศัตรูจะเพิ่มขึ้น • ระวังอย่าให้ HP หมด!</p>
        <p className="mt-2 text-primary font-semibold">เก็บไอเท็ม: ❤️ เพิ่ม HP | 🛡️ โล่ | ⚡ ความเร็ว</p>
      </div>
    </div>
  )
}
