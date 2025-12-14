"use client"

import { useEffect, useRef, useState } from "react"
import type { P2PConnection } from "@/lib/p2p-connection"
import { Card } from "@/components/ui/card"

type PongGameProps = {
  connection: P2PConnection | null
  isSinglePlayer?: boolean
}

type GameState = {
  ball: { x: number; y: number; dx: number; dy: number }
  leftPaddle: { y: number }
  rightPaddle: { y: number }
  score: number
  timeLeft: number
  gameOver: boolean
  leftBlinkCooldown: number
  rightBlinkCooldown: number
}

export function PongGame({ connection, isSinglePlayer = false }: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isHost] = useState(() => (isSinglePlayer ? true : Math.random() > 0.5))
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(120)
  const [gameOver, setGameOver] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [touchControls, setTouchControls] = useState({ up: false, down: false, blink: false })

  const gameStateRef = useRef<GameState>({
    ball: { x: 400, y: 300, dx: 4, dy: 4 },
    leftPaddle: { y: 250 },
    rightPaddle: { y: 250 },
    score: 0,
    timeLeft: 120,
    gameOver: false,
    leftBlinkCooldown: 0,
    rightBlinkCooldown: 0,
  })

  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600
  const PADDLE_WIDTH = 15
  const PADDLE_HEIGHT = 100
  const BALL_SIZE = 12
  const BLINK_COOLDOWN = 300

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let lastTime = Date.now()
    let frameCount = 0
    const keys: { [key: string]: boolean } = {}

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true
      if (e.key === " " || e.key === "Shift") {
        e.preventDefault()
        handleBlink()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      const rect = canvas.getBoundingClientRect()
      const y = touch.clientY - rect.top
      const x = touch.clientX - rect.left

      // Top half = up, bottom half = down, right side = blink
      if (x > rect.width * 0.7) {
        handleBlink()
      } else if (y < rect.height / 2) {
        setTouchControls((prev) => ({ ...prev, up: true, down: false }))
      } else {
        setTouchControls((prev) => ({ ...prev, up: false, down: true }))
      }
    }

    const handleTouchEnd = () => {
      setTouchControls({ up: false, down: false, blink: false })
    }

    canvas.addEventListener("touchstart", handleTouchStart)
    canvas.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    const handleBlink = () => {
      const state = gameStateRef.current
      if (state.gameOver) return

      if (isSinglePlayer) {
        // In single player, blink left paddle with Space, right paddle with Shift
        if (keys[" "] && state.leftBlinkCooldown === 0) {
          state.leftPaddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.ball.y - PADDLE_HEIGHT / 2))
          state.leftBlinkCooldown = BLINK_COOLDOWN
        }
        if (keys["Shift"] && state.rightBlinkCooldown === 0) {
          state.rightPaddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.ball.y - PADDLE_HEIGHT / 2))
          state.rightBlinkCooldown = BLINK_COOLDOWN
        }
      } else {
        const myPaddle = isHost ? state.leftPaddle : state.rightPaddle
        const myCooldown = isHost ? state.leftBlinkCooldown : state.rightBlinkCooldown

        if (myCooldown === 0) {
          myPaddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.ball.y - PADDLE_HEIGHT / 2))
          if (isHost) {
            state.leftBlinkCooldown = BLINK_COOLDOWN
          } else {
            state.rightBlinkCooldown = BLINK_COOLDOWN
          }
          connection?.send("blink", { y: myPaddle.y, isHost })
        }
      }
    }

    if (!isSinglePlayer && connection) {
      connection.onMessage((message) => {
        if (message.type === "paddle-move") {
          if (isHost) {
            gameStateRef.current.rightPaddle.y = message.data.y
          } else {
            gameStateRef.current.leftPaddle.y = message.data.y
          }
        } else if (message.type === "blink") {
          if (message.data.isHost) {
            gameStateRef.current.leftPaddle.y = message.data.y
            gameStateRef.current.leftBlinkCooldown = BLINK_COOLDOWN
          } else {
            gameStateRef.current.rightPaddle.y = message.data.y
            gameStateRef.current.rightBlinkCooldown = BLINK_COOLDOWN
          }
        } else if (message.type === "ball-sync" && !isHost) {
          gameStateRef.current.ball = message.data.ball
          gameStateRef.current.score = message.data.score
          gameStateRef.current.timeLeft = message.data.timeLeft
          setScore(message.data.score)
          setTimeLeft(message.data.timeLeft)
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
      const startFromLeft = Math.random() > 0.5
      gameStateRef.current = {
        ball: {
          x: startFromLeft ? PADDLE_WIDTH + 50 : CANVAS_WIDTH - PADDLE_WIDTH - 50,
          y: CANVAS_HEIGHT / 2,
          dx: (startFromLeft ? 1 : -1) * 4,
          dy: (Math.random() - 0.5) * 6,
        },
        leftPaddle: { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
        rightPaddle: { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
        score: 0,
        timeLeft: 120,
        gameOver: false,
        leftBlinkCooldown: 0,
        rightBlinkCooldown: 0,
      }
      setScore(0)
      setTimeLeft(120)
      setGameOver(false)
      lastTime = Date.now()
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

      if (state.leftBlinkCooldown > 0) state.leftBlinkCooldown--
      if (state.rightBlinkCooldown > 0) state.rightBlinkCooldown--

      if (!state.gameOver) {
        const PADDLE_SPEED = 8

        if (isSinglePlayer) {
          if (keys["w"] || keys["W"] || touchControls.up) {
            state.leftPaddle.y = Math.max(0, state.leftPaddle.y - PADDLE_SPEED)
          }
          if (keys["s"] || keys["S"] || touchControls.down) {
            state.leftPaddle.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.leftPaddle.y + PADDLE_SPEED)
          }

          if (keys["ArrowUp"]) {
            state.rightPaddle.y = Math.max(0, state.rightPaddle.y - PADDLE_SPEED)
          }
          if (keys["ArrowDown"]) {
            state.rightPaddle.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.rightPaddle.y + PADDLE_SPEED)
          }
        } else {
          const myPaddle = isHost ? state.leftPaddle : state.rightPaddle

          if (keys["ArrowUp"] || keys["w"] || keys["W"] || touchControls.up) {
            myPaddle.y = Math.max(0, myPaddle.y - PADDLE_SPEED)
            connection?.send("paddle-move", { y: myPaddle.y })
          }
          if (keys["ArrowDown"] || keys["s"] || keys["S"] || touchControls.down) {
            myPaddle.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, myPaddle.y + PADDLE_SPEED)
            connection?.send("paddle-move", { y: myPaddle.y })
          }
        }

        if (isSinglePlayer || isHost) {
          state.ball.x += state.ball.dx
          state.ball.y += state.ball.dy

          if (state.ball.y <= 0 || state.ball.y >= CANVAS_HEIGHT - BALL_SIZE) {
            state.ball.dy *= -1
          }

          if (
            state.ball.x <= PADDLE_WIDTH &&
            state.ball.y >= state.leftPaddle.y &&
            state.ball.y <= state.leftPaddle.y + PADDLE_HEIGHT
          ) {
            state.ball.dx = Math.abs(state.ball.dx) * 1.05
            state.ball.dy *= 1.05
            state.score++
            setScore(state.score)
          }

          if (
            state.ball.x >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE &&
            state.ball.y >= state.rightPaddle.y &&
            state.ball.y <= state.rightPaddle.y + PADDLE_HEIGHT
          ) {
            state.ball.dx = -Math.abs(state.ball.dx) * 1.05
            state.ball.dy *= 1.05
            state.score++
            setScore(state.score)
          }

          if (state.ball.x < 0) {
            state.ball.x = PADDLE_WIDTH + 50
            state.ball.y = state.leftPaddle.y + PADDLE_HEIGHT / 2
            state.ball.dx = 4
            state.ball.dy = (Math.random() - 0.5) * 6
          } else if (state.ball.x > CANVAS_WIDTH) {
            state.ball.x = CANVAS_WIDTH - PADDLE_WIDTH - 50
            state.ball.y = state.rightPaddle.y + PADDLE_HEIGHT / 2
            state.ball.dx = -4
            state.ball.dy = (Math.random() - 0.5) * 6
          }

          if (!isSinglePlayer && connection) {
            connection.send("ball-sync", {
              ball: state.ball,
              score: state.score,
              timeLeft: state.timeLeft,
            })
          }
        }
      }

      // Draw game
      ctx.fillStyle = "oklch(0.12 0.02 240)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.strokeStyle = "oklch(0.25 0.03 240)"
      ctx.setLineDash([10, 10])
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(CANVAS_WIDTH / 2, 0)
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT)
      ctx.stroke()
      ctx.setLineDash([])

      if (state.leftBlinkCooldown === 0) {
        ctx.shadowColor = "oklch(0.75 0.15 195)"
        ctx.shadowBlur = 15
      }
      ctx.fillStyle = "oklch(0.75 0.15 195)"
      ctx.fillRect(0, state.leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)
      ctx.shadowBlur = 0

      if (state.rightBlinkCooldown === 0) {
        ctx.shadowColor = "oklch(0.75 0.15 195)"
        ctx.shadowBlur = 15
      }
      ctx.fillStyle = "oklch(0.75 0.15 195)"
      ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, state.rightPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)
      ctx.shadowBlur = 0

      ctx.beginPath()
      ctx.arc(state.ball.x, state.ball.y, BALL_SIZE / 2, 0, Math.PI * 2)
      ctx.fillStyle = "oklch(0.75 0.15 195)"
      ctx.fill()

      ctx.fillStyle = "oklch(0.98 0.01 240)"
      ctx.font = "bold 24px sans-serif"
      ctx.textAlign = "center"
      const minutes = Math.floor(state.timeLeft / 60)
      const seconds = state.timeLeft % 60
      ctx.fillText(`${minutes}:${seconds.toString().padStart(2, "0")}`, CANVAS_WIDTH / 2, 40)

      ctx.font = "14px sans-serif"
      ctx.textAlign = "left"
      if (state.leftBlinkCooldown > 0) {
        ctx.fillText(`${Math.ceil(state.leftBlinkCooldown / 60)}s`, 5, CANVAS_HEIGHT - 10)
      } else {
        ctx.fillStyle = "oklch(0.7 0.15 150)"
        ctx.fillText("BLINK READY!", 5, CANVAS_HEIGHT - 10)
        ctx.fillStyle = "oklch(0.98 0.01 240)"
      }

      ctx.textAlign = "right"
      if (state.rightBlinkCooldown > 0) {
        ctx.fillText(`${Math.ceil(state.rightBlinkCooldown / 60)}s`, CANVAS_WIDTH - 5, CANVAS_HEIGHT - 10)
      } else {
        ctx.fillStyle = "oklch(0.7 0.15 150)"
        ctx.fillText("BLINK READY!", CANVAS_WIDTH - 5, CANVAS_HEIGHT - 10)
        ctx.fillStyle = "oklch(0.98 0.01 240)"
      }

      if (state.gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        ctx.fillStyle = "oklch(0.98 0.01 240)"
        ctx.font = "bold 48px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("จบเกม!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30)
        ctx.font = "24px sans-serif"
        ctx.fillText(`คะแนน: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
        ctx.font = "18px sans-serif"
        ctx.fillText("กด SPACE เพื่อเล่นอีกครั้ง", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
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
        }
      }
    }
    window.addEventListener("keydown", handleRestart)

    gameLoop()

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart)
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
        <h2 className="text-3xl font-bold text-primary">Co-op Pong</h2>
        <p className="text-muted-foreground">
          {isSinglePlayer
            ? "ควบคุมไม้ซ้าย: W/S • ไม้ขวา: ลูกศร • บลิ้ง: Space/Shift"
            : `คุณควบคุมไม้ ${isHost ? "ซ้าย" : "ขวา"} • ใช้ลูกศรหรือ WASD • บลิ้ง: Space/Shift`}
        </p>
      </div>

      <Card className="p-4 border-2 relative">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="rounded-lg touch-none" />
        <div className="md:hidden absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground">
          แตะครึ่งบน/ล่าง เพื่อขยับ • แตะขวาสุดเพื่อบลิ้ง
        </div>
      </Card>

      <div className="flex gap-8 text-center flex-wrap justify-center">
        <Card className="px-6 py-3 min-w-[120px]">
          <p className="text-sm text-muted-foreground">คะแนน</p>
          <p className="text-3xl font-bold text-primary">{score}</p>
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
        <p>{isSinglePlayer ? "รักษาบอลไว้ในสนาม!" : "ร่วมมือกันรักษาบอลไว้!"} ทุกครั้งที่ตีได้ความเร็วจะเพิ่มขึ้น</p>
        <p className="mt-2">ถ้าบอลหลุด จะรีเซ็ตตำแหน่ง • เล่นให้ได้คะแนนมากที่สุดภายใน 2 นาที!</p>
        <p className="mt-2 text-primary font-semibold">สกิล Blink: วาปไปที่ตำแหน่งบอล (คูลดาวน์ 5 วินาที)</p>
      </div>
    </div>
  )
}
