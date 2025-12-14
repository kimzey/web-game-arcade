// ✅ ถูกต้อง
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface GameSelectProps {
  connection: P2PConnection | null
  isSinglePlayer?: boolean
  onBack?: () => void
}

export function GameSelect({ connection, isSinglePlayer = false, onBack }: GameSelectProps) {
  // States
  const [selectedGame, setSelectedGame] = useState<"pong" | "snake" | "shooter" | null>(null)
  
  // Effects
  useEffect(() => {
    // Setup effect
    return () => {
      // Cleanup
    }
  }, [])
  
  // Handlers
  const handleGameSelect = (game: "pong" | "snake" | "shooter") => {
    setSelectedGame(game)
    connection?.send("game-selected", { game })
  }
  
  // Render
  return (
    <div className="game-select">
      {/* Component JSX */}
    </div>
  )
}
```

#### Custom Hooks
```tsx
// ✅ ถูกต้อง
import { useState, useCallback } from "react"

export function useGameConnection() {
  const [isConnected, setIsConnected] = useState(false)
  const [connection, setConnection] = useState<P2PConnection | null>(null)
  
  const connect = useCallback(async () => {
    // Connection logic
  }, [])
  
  const disconnect = useCallback(() => {
    // Disconnection logic
  }, [])
  
  return { isConnected, connection, connect, disconnect }
}
```

#### Utility Functions
```tsx
// ✅ ถูกต้อง
export const formatPlayerName = (name: string, maxLength = 15): string => {
  if (!name) return "Anonymous"
  return name.length > maxLength ? `${name.slice(0, maxLength - 3)}...` : name
}

export const calculateGameScore = (baseScore: number, timeBonus: number, penalties: number): number => {
  return Math.max(0, baseScore + timeBonus - penalties)
}
```

### การใช้ TypeScript

#### Type Definitions
```tsx
// ✅ ถูกต้อง
type GameType = "pong" | "snake" | "shooter"
type ConnectionStatus = "disconnected" | "connecting" | "connected" | "failed"

interface Player {
  id: string
  name: string
  score: number
  isReady: boolean
}

interface GameState {
  players: Player[]
  currentGame: GameType
  status: ConnectionStatus
}
```

#### Function Types
```tsx
// ✅ ถูกต้อง
type EventHandler<T = any> = (event: T) => void
type GameStateUpdater = (prevState: GameState) => GameState

// ใช้ใน props
interface GameComponentProps {
  onStateChange: GameStateUpdater
  onPlayerAction: EventHandler<PlayerAction>
}
```

## การจัดรูปแบบโค้ด

### การเยื้อง (Indentation)
- ใช้ 2 spaces สำหรับการเยื้อง (ไม่ใช้ tabs)
- จัดรูปแบบอัตโนมัติโดย Prettier

### ขนาดบรรทัด
- จำกัดความยาวบรรทัดที่ 80-120 ตัวอักษร
- แบ่งบรรทัดเมื่อต้องการเพื่อให้อ่านง่ายขึ้น

### การเรียงลำดับใน imports
1. React imports และ hooks
2. Third-party libraries ที่เกี่ยวข้องกับ UI
3. Internal libraries (จาก `@/`)
4. Relative imports
5. Type imports (ถ้าจำเป็น)

```tsx
import { useState, useEffect } from "react"
import { Button, Card } from "@/components/ui"
import { P2PConnection } from "@/lib/p2p-connection"
import { GameSelect } from "./game-select"
import type { GameType } from "@/lib/game-store"
```

### การเรียงลำดับใน object
- กำหนด properties ตามลำดับความสำคัญ
- สำหรับ component props: required props ก่อน optional props และ event handlers

```tsx
interface GameProps {
  // Required props
  connection: P2PConnection
  gameType: GameType
  
  // Optional props
  isSinglePlayer?: boolean
  playerName?: string
  
  // Event handlers
  onGameStart?: () => void
  onGameEnd?: (score: number) => void
}
```

## การเขียนคอมเมนต์

### คอมเมนต์ฟังก์ชันที่ซับซ้อน
```tsx
/**
 * สร้างการเชื่อมต่อ P2P ผ่าน WebRTC
 * @param config - การตั้งค่าการเชื่อมต่อ
 * @returns Promise<P2PConnection> - อินสแตนซ์ของการเชื่อมต่อที่สร้างแล้ว
 * @throws Error - เมื่อไม่สามารถสร้างการเชื่อมต่อได้
 */
export async function createP2PConnection(config: ConnectionConfig): Promise<P2PConnection> {
  // Implementation
}
```

### คอมเมนต์ logic ที่ซับซ้อน
```tsx
// คำนวณความเร็วของบอลโดยพิจารณาจากจำนวนครั้งที่ตีและความยากของเกม
const ballSpeed = BASE_BALL_SPEED + (hitCount * SPEED_INCREMENT) + (difficultyLevel * 0.5)
```

### คอมเมนต์ TODO/FIXME
```tsx
// TODO: Implement reconnect logic when connection fails
// FIXME: This workaround for Safari WebRTC bug should be removed when fixed
```

## มาตรฐานการคอมมิต (Commit Standards)

### รูปแบบข้อความ commit
ใช้ Conventional Commits แบบง่าย:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

### ประเภทของ commit (type)
- `feat`: ฟีเจอร์ใหม่
- `fix`: แก้ไข bug
- `refactor`: ปรับปรุงโค้ดโดยไม่เปลี่ยนฟังก์ชัน
- `style`: การเปลี่ยนแปลงที่เกี่ยวกับการจัดรูปแบบโค้ด
- `docs`: เปลี่ยนแปลงเอกสาร
- `test`: เพิ่มหรือแก้ไขการทดสอบ
- `chore`: งานทั่วไป เช่น อัปเดต dependencies

### ตัวอย่างข้อความ commit
```
feat(pong): add power-up functionality

Implement power-ups that appear randomly in the game:
- Speed boost: increases ball speed temporarily
- Multi-ball: spawns additional balls
- Large paddle: temporarily increases paddle size

Fixes #123
```

```
fix(p2p): handle connection timeout

Add timeout mechanism for P2P connections to prevent
indefinite waiting when network issues occur.
```

## การเขียน Release Notes

### โครงสร้าง Release Notes
```
# Version [X.Y.Z] - [Date]

## 🆕 New Features
- Feature 1: Brief description
- Feature 2: Brief description

## 🐛 Bug Fixes
- Fix 1: Brief description
- Fix 2: Brief description

## 🔧 Improvements
- Improvement 1: Brief description
- Improvement 2: Brief description

## 📚 Documentation
- Doc 1: Brief description
- Doc 2: Brief description

## 🙏 Acknowledgments
- Thanks to contributors
```

### การเขียนข้อความ
- ใช้ภาษาที่เข้าใจง่าย
- มุ่งเน้นประโยชน์ต่อผู้ใช้มากกว่ารายละเอียดทางเทคนิค
- จัดกลุ่มการเปลี่ยนแปลงตามหมวดหมู่
- เพิ่มเลข issue ที่เกี่ยวข้อง (ถ้ามี)

## โครงสร้างข้อความใน Pull Request

### Template
```
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing completed

## Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Documentation updated if necessary
- [ ] All tests passing
```

### การเขียน Description
- อธิบายว่าเหตุใดจึงทำการเปลี่ยนแปลงนี้
- อธิบายวิธีการทดสอบ
- แนบภาพหน้าจอ (สำหรับการเปลี่ยนแปลง UI)

## Definition of Done (DoD)

- ✅ ครอบคลุมทุกแนวทางการเขียนโค้ด การคอมมิต และการสื่อสาร
- ✅ มีตัวอย่างโค้ดที่ถูกต้องและเป็นไปตามมาตรฐาน
- ✅ มีแนวทางการเขียน release notes และ pull request
- ✅ สร้างมาตรฐานที่สามารถปฏิบัติได้จริง
- ✅ ใช้ภาษาที่เข้าใจง่ายและสื่อสารได้ชัดเจน

## Acceptance Criteria

- ✅ นักพัฒนาสามารถเขียนโค้ดตามแนวทางได้
- ✅ สร้างมาตรฐานการเขียนโค้ดที่สม่ำเสมอทั่วทั้งโปรเจกต์
- ✅ มีแนวทานการคอมมิตที่ชัดเจนและสื่อความหมายได้
- ✅ ลดความสับสนในการอ่านและบำรุงรักษาโค้ด
- ✅ ช่วยให้การรีวิวโค้ดทำได้ง่ายขึ้นและมีประสิทธิภาพมากขึ้น