# คู่มือการทดสอบ (Testing Guide)

## ประเภทการทดสอบ

### 1. การทดสอบแบบ Unit Test
การทดสอบแต่ละฟังก์ชันหรือ component แยกจากกันเพื่อให้แน่ใจว่าทำงานได้ถูกต้อง

#### 1.1 การทดสอบ Game Logic
```typescript
// __tests__/game-logic.test.ts
import { calculateBallPosition, checkCollision } from '@/lib/game-utils'

describe('Game Logic', () => {
  test('should calculate ball position correctly', () => {
    const ball = { x: 50, y: 50, vx: 2, vy: 3 }
    const result = calculateBallPosition(ball, 16)
    
    expect(result.x).toBe(82) // 50 + 2 * 16
    expect(result.y).toBe(98) // 50 + 3 * 16
  })
  
  test('should detect collision between ball and paddle', () => {
    const ball = { x: 50, y: 50, radius: 5 }
    const paddle = { x: 45, y: 45, width: 10, height: 10 }
    
    expect(checkCollision(ball, paddle)).toBe(true)
  })
  
  test('should not detect collision when ball is far from paddle', () => {
    const ball = { x: 100, y: 100, radius: 5 }
    const paddle = { x: 45, y: 45, width: 10, height: 10 }
    
    expect(checkCollision(ball, paddle)).toBe(false)
  })
})
```

#### 1.2 การทดสอบ State Management
```typescript
// __tests__/game-store.test.ts
import { useGameStore } from '@/lib/game-store'

describe('Game Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.getState().reset()
  })
  
  test('should update player name correctly', () => {
    const { updateSettings, settings } = useGameStore.getState()
    
    updateSettings({ playerName: 'Test Player' })
    
    expect(settings.playerName).toBe('Test Player')
  })
  
  test('should set current game correctly', () => {
    const { setCurrentGame, currentGame } = useGameStore.getState()
    
    setCurrentGame('pong')
    
    expect(currentGame).toBe('pong')
  })
})
```

#### 1.3 การทดสอบ P2P Connection
```typescript
// __tests__/p2p-connection.test.ts
import { P2PConnection } from '@/lib/p2p-connection'

// Mock WebRTC API
global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
  createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' }),
  createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' }),
  setLocalDescription: jest.fn().mockResolvedValue(undefined),
  setRemoteDescription: jest.fn().mockResolvedValue(undefined),
  createDataChannel: jest.fn().mockReturnValue({
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn()
  }),
  addEventListener: jest.fn(),
  close: jest.fn()
}))

describe('P2P Connection', () => {
  let p2pConnection: P2PConnection
  
  beforeEach(() => {
    p2pConnection = new P2PConnection()
  })
  
  afterEach(() => {
    p2pConnection.disconnect()
  })
  
  test('should create offer successfully', async () => {
    const offer = await p2pConnection.createOffer()
    
    expect(offer).toBeDefined()
    expect(typeof offer).toBe('string')
  })
  
  test('should accept offer and generate answer', async () => {
    const offer = 'mock-offer-code'
    const answer = await p2pConnection.acceptOffer(offer)
    
    expect(answer).toBeDefined()
    expect(typeof answer).toBe('string')
  })
})
```

### 2. การทดสอบแบบ Integration Test
การทดสอบการทำงานร่วมกันของหลายส่วนเพื่อให้แน่ใจว่าระบบทำงานได้ถูกต้อง

#### 2.1 การทดสอบ Lobby และ Game Selection
```typescript
// __tests__/integration/lobby-flow.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LobbyPage } from '@/components/lobby-page'

// Mock P2P connection
jest.mock('@/lib/p2p-connection', () => ({
  P2PConnection: jest.fn().mockImplementation(() => ({
    createOffer: jest.fn().mockResolvedValue('mock-offer'),
    onStatusChange: jest.fn(),
    disconnect: jest.fn()
  }))
}))

describe('Lobby Flow Integration', () => {
  test('should allow user to create a room', async () => {
    render(<LobbyPage />)
    
    const createRoomButton = screen.getByText('สร้างห้อง (เล่น 2 คน)')
    fireEvent.click(createRoomButton)
    
    await waitFor(() => {
      expect(screen.getByText(/สร้างห้องสำเร็จ/)).toBeInTheDocument()
    })
  })
  
  test('should allow user to join a room with valid code', async () => {
    render(<LobbyPage />)
    
    const input = screen.getByPlaceholderText('ใส่รหัสห้องที่เพื่อนให้')
    const joinButton = screen.getByText('เข้าร่วมห้อง')
    
    fireEvent.change(input, { target: { value: 'valid-room-code' } })
    fireEvent.click(joinButton)
    
    await waitFor(() => {
      expect(screen.getByText(/เกือบเสร็จแล้ว/)).toBeInTheDocument()
    })
  })
})
```

#### 2.2 การทดสอบ Game Components
```typescript
// __tests__/integration/game-flow.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GameSelect } from '@/components/game-select'

describe('Game Flow Integration', () => {
  test('should allow user to select a game', () => {
    const mockConnection = {
      send: jest.fn(),
      onMessage: jest.fn()
    }
    
    render(<GameSelect connection={mockConnection} />)
    
    const pongCard = screen.getByText('Co-op Pong').closest('[role="button"]')
    fireEvent.click(pongCard!)
    
    expect(mockConnection.send).toHaveBeenCalledWith('game-selected', { game: 'pong' })
  })
})
```

### 3. การทดสอบแบบ End-to-End (E2E)
การทดสอบการทำงานของระบบตั้งแต่เริ่มจนจบเหมือนผู้ใช้จริง

#### 3.1 การทดสอบด้วย Playwright
```typescript
// e2e/p2p-connection.spec.ts
import { test, expect } from '@playwright/test'

test.describe('P2P Connection Flow', () => {
  test('should allow two users to connect and play a game', async ({ browser }) => {
    // Create two browser contexts
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    // Navigate both pages to the app
    await page1.goto('http://localhost:3000')
    await page2.goto('http://localhost:3000')
    
    // User 1 creates a room
    await page1.click('text=สร้างห้อง (เล่น 2 คน)')
    await page1.waitForSelector('text=สร้างห้องสำเร็จ!')
    
    // Get the invite code
    const inviteCode = await page1.inputValue('css=[placeholder*="รหัสตอบกลับ"] + div')
    
    // User 2 joins the room
    await page2.fill('[placeholder="ใส่รหัสห้องที่เพื่อนให้"]', inviteCode)
    await page2.click('text=เข้าร่วมห้อง')
    await page2.waitForSelector('text=เกือบเสร็จแล้ว!')
    
    // Get the answer code
    const answerCode = await page2.inputValue('css=[placeholder*="รหัสตอบกลับ"] + div')
    
    // User 1 accepts the answer
    await page1.fill('[placeholder="รหัสตอบกลับ"]', answerCode)
    await page1.click('text=เชื่อมต่อ')
    
    // Both users should be in the waiting room
    await page1.waitForSelector('text=ล็อบบี้รอผู้เล่น')
    await page2.waitForSelector('text=ล็อบบี้รอผู้เล่น')
    
    // Both users click ready
    await Promise.all([
      page1.click('text=พร้อมเล่น!'),
      page2.click('text=พร้อมเล่น!')
    ])
    
    // Both should be in game selection
    await Promise.all([
      page1.waitForSelector('text=เลือกเกม'),
      page2.waitForSelector('text=เลือกเกม')
    ])
    
    // User 1 selects pong
    await page1.click('text=Co-op Pong')
    
    // Both users should be in pong game
    await Promise.all([
      page1.waitForSelector('canvas'),
      page2.waitForSelector('canvas')
    ])
  })
})
```

### 4. การทดสอบประสิทธิภาพ (Performance Testing)
การทดสอบประสิทธิภาพของแอปพลิเคชันเพื่อให้แน่ใจว่าทำงานได้รวดเร็ว

#### 4.1 การทดสอบ Game Performance
```typescript
// __tests__/performance/game-performance.test.ts
import { renderHook, act } from '@testing-library/react-hooks'
import { useGameLoop } from '@/hooks/use-game-loop'

describe('Game Performance', () => {
  test('should maintain 60 FPS during game loop', () => {
    const { result } = renderHook(() => useGameLoop())
    
    // Start game loop
    act(() => {
      result.current.start()
    })
    
    // Measure FPS
    const startTime = performance.now()
    let frameCount = 0
    
    const measureFPS = () => {
      frameCount++
      if (performance.now() - startTime >= 1000) {
        // Should have ~60 frames in 1 second
        expect(frameCount).toBeCloseTo(60, 5)
        return
      }
      requestAnimationFrame(measureFPS)
    }
    
    requestAnimationFrame(measureFPS)
    
    // Stop game loop
    act(() => {
      result.current.stop()
    })
  })
})
```

### 5. การทดสอบความเข้ากันได้ (Compatibility Testing)
การทดสอบบนเบราว์เซอร์และอุปกรณ์ต่างๆ

#### 5.1 การทดสอบ Browser Compatibility
```yaml
# .github/workflows/browser-compatibility.yml
name: Browser Compatibility Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        browser: [chrome, firefox, safari, edge]
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Install Playwright
        run: npx playwright install
      
      - name: Run browser tests
        run: npx playwright test --project=${{ matrix.browser }}
```

#### 5.2 การทดสอบ Responsive Design
```typescript
// __tests__/responsive/responsive-design.test.ts
import { render, screen } from '@testing-library/react'
import { LobbyPage } from '@/components/lobby-page'

describe('Responsive Design', () => {
  test('should display correctly on mobile', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    
    render(<LobbyPage />)
    
    // Check if mobile-specific elements are present
    expect(screen.getByRole('button', { name: /สร้างห้อง/ })).toHaveClass('h-14')
  })
  
  test('should display correctly on desktop', () => {
    // Mock desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    
    render(<LobbyPage />)
    
    // Check if desktop-specific elements are present
    expect(screen.getByRole('button', { name: /สร้างห้อง/ })).toHaveClass('h-16')
  })
})
```

## การตั้งค่า Testing Environment

### 1. การตั้งค่า Jest และ React Testing Library
```json
// jest.config.json
{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/$1"
  },
  "testPathIgnorePatterns": ["<rootDir>/node_modules/", "<rootDir>/e2e/"]
}
```

### 2. การตั้งค่า Playwright สำหรับ E2E Testing
```javascript
// playwright.config.js
module.exports = {
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
}
```

### 3. การตั้งค่า GitHub Actions สำหรับ CI/CD
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
  
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Install Playwright
        run: npx playwright install
      
      - name: Run E2E tests
        run: npm run test:e2e
```

## ขั้นตอนการทดสอบ

### 1. การทดสอบในระหว่างการพัฒนา
1. เขียน unit test สำหรับฟังก์ชันใหม่ทุกครั้ง
2. รัน unit tests ก่อน commit โค้ด
3. รัน integration tests ก่อน merge pull request

### 2. การทดสอบก่อน Release
1. รัน tests ทั้งหมด (unit, integration, E2E)
2. ทดสอบบน browsers หลักทั้งหมด
3. ทดสอบบนอุปกรณ์จริงที่เป็นไปได้

### 3. การทดสอบแบบ Manual
1. ทดสอบ P2P connection ในสถานการณ์ต่างๆ (localhost, ข้าม network)
2. ทดสอบบนอุปกรณ์มือถือจริง
3. ทดสอบประสิทธิภาพในเครื่องที่มีสเปคต่ำ

## Definition of Done (DoD)

- ✅ ระบุประเภทการทดสอบทั้งหมดที่จำเป็นสำหรับโปรเจกต์
- ✅ มีตัวอย่างโค้ดสำหรับแต่ละประเภทการทดสอบ
- ✅ ระบุวิธีการตั้งค่า testing environment
- ✅ มีขั้นตอนการทดสอบที่ชัดเจน
- ✅ มีข้อมูลเกี่ยวกับ CI/CD สำหรับการทดสอบอัตโนมัติ

## Acceptance Criteria

- ✅ นักพัฒนาสามารถใช้คู่มือนี้ในการเขียนและรันการทดสอบได้
- ✅ มีข้อมูลเพียงพอสำหรับการตั้งค่า testing environment
- ✅ ช่วยให้แน่ใจว่าโค้ดมีคุณภาพและทำงานได้ถูกต้อง
- ✅ สามารถตรวจจับปัญหาได้ก่อน release
- ✅ มีข้อมูลที่ช่วยในการปรับปรุงประสิทธิภาพของแอปพลิเคชัน