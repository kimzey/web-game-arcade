"use client"

import { useEffect, useRef, useState } from "react"
import type { P2PConnection } from "@/lib/p2p-connection"
import { Card } from "@/components/ui/card"

type SnakeGameProps = {
  connection: P2PConnection | null
  isSinglePlayer?: boolean
}

type Position = { x: number; y: number }

type GameState = {
  snake1: Position[]
  snake2: Position[]
  direction1: Position
  direction2: Position
  food: Position
  score: number
  timeLeft: number
  gameOver: boolean
  snake1BlinkCooldown: number
  snake2BlinkCooldown: number
}

export function SnakeGame({ connection, isSinglePlayer = false }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isHost] = useState(() => (isSinglePlayer ? true : Math.random() > 0.5))
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(120)
  const [gameOver, setGameOver] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600
  const GRID_SIZE = 20
  const GRID_WIDTH = CANVAS_WIDTH / GRID_SIZE
  const GRID_HEIGHT = CANVAS_HEIGHT / GRID_SIZE
  const BLINK_COOLDOWN = 10

  const gameStateRef = useRef<GameState>({
    snake1: [
      { x: 10, y: 15 },
      { x: 9, y: 15 },
      { x: 8, y: 15 },
    ],
    snake2: [
      { x: 30, y: 15 },
      { x: 31, y: 15 },
      { x: 32, y: 15 },
    ],
    direction1: { x: 1, y: 0 },
    direction2: { x: -1, y: 0 },
    food: { x: 20, y: 15 },
    score: 0,
    timeLeft: 120,
    gameOver: false,
    snake1BlinkCooldown: 0,
    snake2BlinkCooldown: 0,
  })

  const nextDirection1 = useRef({ x: 1, y: 0 })
  const nextDirection2 = useRef({ x: -1, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let gameInterval: NodeJS.Timeout
    let timerInterval: NodeJS.Timeout

    const generateFood = (): Position => {
      const state = gameStateRef.current
      let newFood: Position

      do {
        newFood = {
          x: Math.floor(Math.random() * GRID_WIDTH),
          y: Math.floor(Math.random() * GRID_HEIGHT),
        }
      } while (
        state.snake1.some((segment) => segment.x === newFood.x && segment.y === newFood.y) ||
        state.snake2.some((segment) => segment.x === newFood.x && segment.y === newFood.y)
      )

      return newFood
    }

    const checkCollision = (head: Position, snake: Position[]): boolean => {
      for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
          return true
        }
      }

      return false
    }

    const handleBlink = (isSnake1: boolean) => {
      const state = gameStateRef.current
      if (state.gameOver) return

      const snake = isSnake1 ? state.snake1 : state.snake2
      const cooldown = isSnake1 ? state.snake1BlinkCooldown : state.snake2BlinkCooldown

      if (cooldown === 0) {
        const head = snake[0]
        const food = state.food

        // Calculate direction to food
        const dx = food.x - head.x
        const dy = food.y - head.y

        // Teleport 3-5 cells towards food
        const distance = Math.min(5, Math.floor(Math.sqrt(dx * dx + dy * dy)))
        const newX = Math.max(0, Math.min(GRID_WIDTH - 1, head.x + Math.sign(dx) * distance))
        const newY = Math.max(0, Math.min(GRID_HEIGHT - 1, head.y + Math.sign(dy) * distance))

        // Insert new head position
        snake.unshift({ x: newX, y: newY })
        // Remove last segment to maintain length
        snake.pop()

        if (isSnake1) {
          state.snake1BlinkCooldown = BLINK_COOLDOWN
        } else {
          state.snake2BlinkCooldown = BLINK_COOLDOWN
        }

        if (!isSinglePlayer) {
          connection?.send("blink", { isSnake1, snake })
        }
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current

      if (e.key === " ") {
        e.preventDefault()
        if (isSinglePlayer) {
          handleBlink(true) // Snake 1
        } else {
          handleBlink(isHost)
        }
      }
      if (e.key === "Shift") {
        e.preventDefault()
        if (isSinglePlayer) {
          handleBlink(false) // Snake 2
        }
      }

      if (isSinglePlayer) {
        if ((e.key === "w" || e.key === "W") && state.direction1.y === 0) {
          nextDirection1.current = { x: 0, y: -1 }
        } else if ((e.key === "s" || e.key === "S") && state.direction1.y === 0) {
          nextDirection1.current = { x: 0, y: 1 }
        } else if ((e.key === "a" || e.key === "A") && state.direction1.x === 0) {
          nextDirection1.current = { x: -1, y: 0 }
        } else if ((e.key === "d" || e.key === "D") && state.direction1.x === 0) {
          nextDirection1.current = { x: 1, y: 0 }
        }

        if (e.key === "ArrowUp" && state.direction2.y === 0) {
          nextDirection2.current = { x: 0, y: -1 }
        } else if (e.key === "ArrowDown" && state.direction2.y === 0) {
          nextDirection2.current = { x: 0, y: 1 }
        } else if (e.key === "ArrowLeft" && state.direction2.x === 0) {
          nextDirection2.current = { x: -1, y: 0 }
        } else if (e.key === "ArrowRight" && state.direction2.x === 0) {
          nextDirection2.current = { x: 1, y: 0 }
        }
      } else {
        const myDirection = isHost ? nextDirection1 : nextDirection2
        const currentDirection = isHost ? state.direction1 : state.direction2

        let newDirection = { ...myDirection.current }

        if ((e.key === "ArrowUp" || e.key === "w" || e.key === "W") && currentDirection.y === 0) {
          newDirection = { x: 0, y: -1 }
        } else if ((e.key === "ArrowDown" || e.key === "s" || e.key === "S") && currentDirection.y === 0) {
          newDirection = { x: 0, y: 1 }
        } else if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && currentDirection.x === 0) {
          newDirection = { x: -1, y: 0 }
        } else if ((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && currentDirection.x === 0) {
          newDirection = { x: 1, y: 0 }
        }

        myDirection.current = newDirection
        connection?.send("direction-change", { direction: newDirection })
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      setTouchStart({ x: touch.clientX, y: touch.clientY })
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart) return

      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchStart.x
      const dy = touch.clientY - touchStart.y
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      const state = gameStateRef.current

      // If tap (not swipe), trigger blink
      if (absDx < 10 && absDy < 10) {
        if (isSinglePlayer) {
          handleBlink(true)
        } else {
          handleBlink(isHost)
        }
        setTouchStart(null)
        return
      }

      // Swipe direction
      if (isSinglePlayer) {
        // Snake 1 controls
        if (absDx > absDy) {
          if (dx > 0 && state.direction1.x === 0) {
            nextDirection1.current = { x: 1, y: 0 }
          } else if (dx < 0 && state.direction1.x === 0) {
            nextDirection1.current = { x: -1, y: 0 }
          }
        } else {
          if (dy > 0 && state.direction1.y === 0) {
            nextDirection1.current = { x: 0, y: 1 }
          } else if (dy < 0 && state.direction1.y === 0) {
            nextDirection1.current = { x: 0, y: -1 }
          }
        }
      } else {
        const myDirection = isHost ? nextDirection1 : nextDirection2
        const currentDirection = isHost ? state.direction1 : state.direction2
        let newDirection = { ...myDirection.current }

        if (absDx > absDy) {
          if (dx > 0 && currentDirection.x === 0) {
            newDirection = { x: 1, y: 0 }
          } else if (dx < 0 && currentDirection.x === 0) {
            newDirection = { x: -1, y: 0 }
          }
        } else {
          if (dy > 0 && currentDirection.y === 0) {
            newDirection = { x: 0, y: 1 }
          } else if (dy < 0 && currentDirection.y === 0) {
            newDirection = { x: 0, y: -1 }
          }
        }

        myDirection.current = newDirection
        connection?.send("direction-change", { direction: newDirection })
      }

      setTouchStart(null)
    }

    canvas.addEventListener("touchstart", handleTouchStart)
    canvas.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("keydown", handleKeyDown)

    if (!isSinglePlayer && connection) {
      connection.onMessage((message) => {
        if (message.type === "direction-change") {
          if (isHost) {
            nextDirection2.current = message.data.direction
          } else {
            nextDirection1.current = message.data.direction
          }
        } else if (message.type === "blink") {
          if (message.data.isSnake1) {
            gameStateRef.current.snake1 = message.data.snake
            gameStateRef.current.snake1BlinkCooldown = BLINK_COOLDOWN
          } else {
            gameStateRef.current.snake2 = message.data.snake
            gameStateRef.current.snake2BlinkCooldown = BLINK_COOLDOWN
          }
        } else if (message.type === "game-state-sync" && !isHost) {
          gameStateRef.current = message.data.state
          setScore(message.data.state.score)
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
        snake1: [
          { x: 10, y: 15 },
          { x: 9, y: 15 },
          { x: 8, y: 15 },
        ],
        snake2: [
          { x: 30, y: 15 },
          { x: 31, y: 15 },
          { x: 32, y: 15 },
        ],
        direction1: { x: 1, y: 0 },
        direction2: { x: -1, y: 0 },
        food: { x: 20, y: 15 },
        score: 0,
        timeLeft: 120,
        gameOver: false,
        snake1BlinkCooldown: 0,
        snake2BlinkCooldown: 0,
      }
      nextDirection1.current = { x: 1, y: 0 }
      nextDirection2.current = { x: -1, y: 0 }
      setScore(0)
      setTimeLeft(120)
      setGameOver(false)
    }

    const updateGame = () => {
      const state = gameStateRef.current

      if (state.snake1BlinkCooldown > 0) state.snake1BlinkCooldown--
      if (state.snake2BlinkCooldown > 0) state.snake2BlinkCooldown--

      if (!state.gameOver && (isSinglePlayer || isHost)) {
        state.direction1 = nextDirection1.current
        state.direction2 = nextDirection2.current

        const newHead1 = {
          x: state.snake1[0].x + state.direction1.x,
          y: state.snake1[0].y + state.direction1.y,
        }
        if (newHead1.x < 0) newHead1.x = GRID_WIDTH - 1
        if (newHead1.x >= GRID_WIDTH) newHead1.x = 0
        if (newHead1.y < 0) newHead1.y = GRID_HEIGHT - 1
        if (newHead1.y >= GRID_HEIGHT) newHead1.y = 0

        state.snake1.unshift(newHead1)

        const newHead2 = {
          x: state.snake2[0].x + state.direction2.x,
          y: state.snake2[0].y + state.direction2.y,
        }
        if (newHead2.x < 0) newHead2.x = GRID_WIDTH - 1
        if (newHead2.x >= GRID_WIDTH) newHead2.x = 0
        if (newHead2.y < 0) newHead2.y = GRID_HEIGHT - 1
        if (newHead2.y >= GRID_HEIGHT) newHead2.y = 0

        state.snake2.unshift(newHead2)

        let ateFood = false
        if (
          (newHead1.x === state.food.x && newHead1.y === state.food.y) ||
          (newHead2.x === state.food.x && newHead2.y === state.food.y)
        ) {
          state.score++
          setScore(state.score)
          state.food = generateFood()
          ateFood = true
        }

        if (!ateFood) {
          state.snake1.pop()
          state.snake2.pop()
        }

        if (checkCollision(newHead1, state.snake1) || checkCollision(newHead2, state.snake2)) {
          state.gameOver = true
          setGameOver(true)
          if (state.score > highScore) {
            setHighScore(state.score)
          }
          if (!isSinglePlayer) {
            connection?.send("game-over", { score: state.score })
          }
        }

        if (!isSinglePlayer && connection) {
          connection.send("game-state-sync", { state })
        }
      }
    }

    timerInterval = setInterval(() => {
      const state = gameStateRef.current
      if (!state.gameOver && state.timeLeft > 0) {
        state.timeLeft--
        setTimeLeft(state.timeLeft)

        if (state.timeLeft === 0) {
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
    }, 1000)

    const render = () => {
      const state = gameStateRef.current

      ctx.fillStyle = "oklch(0.12 0.02 240)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.strokeStyle = "oklch(0.18 0.02 240)"
      ctx.lineWidth = 1
      for (let i = 0; i <= GRID_WIDTH; i++) {
        ctx.beginPath()
        ctx.moveTo(i * GRID_SIZE, 0)
        ctx.lineTo(i * GRID_SIZE, CANVAS_HEIGHT)
        ctx.stroke()
      }
      for (let i = 0; i <= GRID_HEIGHT; i++) {
        ctx.beginPath()
        ctx.moveTo(0, i * GRID_SIZE)
        ctx.lineTo(CANVAS_WIDTH, i * GRID_SIZE)
        ctx.stroke()
      }

      if (state.snake1BlinkCooldown === 0) {
        ctx.shadowColor = "oklch(0.75 0.15 195)"
        ctx.shadowBlur = 10
      }
      ctx.fillStyle = "oklch(0.75 0.15 195)"
      state.snake1.forEach((segment, index) => {
        ctx.fillRect(segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2)
        if (index === 0) {
          ctx.fillStyle = "oklch(0.12 0.02 240)"
          ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + 5, 3, 3)
          ctx.fillRect(segment.x * GRID_SIZE + 12, segment.y * GRID_SIZE + 5, 3, 3)
          ctx.fillStyle = "oklch(0.75 0.15 195)"
        }
      })
      ctx.shadowBlur = 0

      if (state.snake2BlinkCooldown === 0) {
        ctx.shadowColor = "oklch(0.65 0.2 330)"
        ctx.shadowBlur = 10
      }
      ctx.fillStyle = "oklch(0.65 0.2 330)"
      state.snake2.forEach((segment, index) => {
        ctx.fillRect(segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2)
        if (index === 0) {
          ctx.fillStyle = "oklch(0.12 0.02 240)"
          ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + 5, 3, 3)
          ctx.fillRect(segment.x * GRID_SIZE + 12, segment.y * GRID_SIZE + 5, 3, 3)
          ctx.fillStyle = "oklch(0.65 0.2 330)"
        }
      })
      ctx.shadowBlur = 0

      ctx.fillStyle = "oklch(0.7 0.15 150)"
      ctx.beginPath()
      ctx.arc(
        state.food.x * GRID_SIZE + GRID_SIZE / 2,
        state.food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2,
      )
      ctx.fill()

      ctx.fillStyle = "oklch(0.98 0.01 240)"
      ctx.font = "bold 24px sans-serif"
      ctx.textAlign = "center"
      const minutes = Math.floor(state.timeLeft / 60)
      const seconds = state.timeLeft % 60
      ctx.fillText(`${minutes}:${seconds.toString().padStart(2, "0")}`, CANVAS_WIDTH / 2, 30)

      ctx.font = "14px sans-serif"
      ctx.textAlign = "left"
      if (state.snake1BlinkCooldown > 0) {
        ctx.fillText(`งูฟ้า: ${state.snake1BlinkCooldown}s`, 10, CANVAS_HEIGHT - 10)
      } else {
        ctx.fillStyle = "oklch(0.7 0.15 150)"
        ctx.fillText("งูฟ้า: BLINK READY!", 10, CANVAS_HEIGHT - 10)
        ctx.fillStyle = "oklch(0.98 0.01 240)"
      }

      ctx.textAlign = "right"
      if (state.snake2BlinkCooldown > 0) {
        ctx.fillText(`งูชมพู: ${state.snake2BlinkCooldown}s`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10)
      } else {
        ctx.fillStyle = "oklch(0.7 0.15 150)"
        ctx.fillText("งูชมพู: BLINK READY!", CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10)
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

      requestAnimationFrame(render)
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

    gameInterval = setInterval(updateGame, 150)
    render()

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart)
      canvas.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keydown", handleRestart)
      clearInterval(gameInterval)
      clearInterval(timerInterval)
    }
  }, [connection, isHost, gameOver, highScore, isSinglePlayer, touchStart])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-primary">Co-op Snake</h2>
        <p className="text-muted-foreground">
          {isSinglePlayer
            ? "งูฟ้า: WASD • งูชมพู: ลูกศร • บลิ้ง: Space/Shift"
            : `คุณควบคุมงู${isHost ? "ฟ้า" : "ชมพู"} • ใช้ลูกศรหรือ WASD • บลิ้ง: Space`}
        </p>
      </div>

      <Card className="p-4 border-2 relative">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="rounded-lg touch-none" />
        <div className="md:hidden absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground">
          ปัดเพื่อเปลี่ยนทิศทาง • แตะเพื่อบลิ้ง
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
        <p>{isSinglePlayer ? "ควบคุมสองงู" : "ร่วมมือ"}เก็บอาหารและให้งูยาวขึ้น!</p>
        <p className="mt-2">เล่นให้ได้คะแนนมากที่สุดภายใน 2 นาที!</p>
        <p className="mt-2 text-primary font-semibold">งูวาปผ่านผนังได้ และไม่ชนกันตาย - Co-op 100%!</p>
        <p className="mt-1 text-primary font-semibold">สกิล Blink: วาปเข้าใกล้อาหาร (คูลดาวน์ 10 วินาที)</p>
      </div>
    </div>
  )
}
