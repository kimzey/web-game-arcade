# P2P Connection API Documentation

## ภาพรวม

`P2PConnection` เป็นคลาสสำหรับจัดการการเชื่อมต่อแบบ peer-to-peer ผ่าน WebRTC API ช่วยให้สามารถสร้างการเชื่อมต่อโดยตรงระหว่างสองเบราว์เซอร์โดยไม่ต้องพึ่งพาเซิร์ฟเวอร์กลาง

## ปัญหาที่ทราบ

ระบบ P2P ปัจจุบันมีปัญหาที่ทำให้ใช้งานไม่ได้ในสถานการณ์จริง:
- การจัดการ ICE candidates ไม่ถูกต้อง
- ปัญหา NAT traversal ในหลายเครือข่าย
- การเชื่อมต่อขาดหายโดยไม่ทราบสาเหตุ
- ข้อผิดพลาดในการส่งข้อมูลระหว่าง peers

## การใช้งานพื้นฐาน

### การสร้างอินสแตนซ์

```typescript
import { P2PConnection } from "@/lib/p2p-connection"

const p2pConnection = new P2PConnection()
```

### การสร้างห้อง (Host)

```typescript
try {
  // 1. สร้างการเชื่อมต่อ
  const p2pConnection = new P2PConnection()
  
  // 2. ตั้งค่า Event Listeners
  p2pConnection.onStatusChange((status) => {
    console.log("Connection status:", status)
    if (status === "connected") {
      // การเชื่อมต่อสำเร็จ
    } else if (status === "failed") {
      // การเชื่อมต่อล้มเหลว
    }
  })
  
  p2pConnection.onMessage((message) => {
    console.log("Received message:", message)
  })
  
  // 3. สร้าง Offer SDP
  const offerCode = await p2pConnection.createOffer()
  console.log("Offer code:", offerCode)
  
  // 4. แสดงรหัสให้ผู้เล่นอื่นคัดลอก
  // 5. รอ Answer SDP จากผู้เล่นอื่น
  
  // 6. ยอมรับ Answer
  await p2pConnection.acceptAnswer(answerCode)
} catch (error) {
  console.error("Failed to create room:", error)
}
```

### การเข้าร่วมห้อง (Guest)

```typescript
try {
  // 1. สร้างการเชื่อมต่อ
  const p2pConnection = new P2PConnection()
  
  // 2. ตั้งค่า Event Listeners
  p2pConnection.onStatusChange((status) => {
    console.log("Connection status:", status)
    if (status === "connected") {
      // การเชื่อมต่อสำเร็จ
    } else if (status === "failed") {
      // การเชื่อมต่อล้มเหลว
    }
  })
  
  p2pConnection.onMessage((message) => {
    console.log("Received message:", message)
  })
  
  // 3. ยอมรับ Offer SDP
  const answerCode = await p2pConnection.acceptOffer(offerCode)
  console.log("Answer code:", answerCode)
  
  // 4. ส่งรหัสกลับให้ผู้สร้างห้อง
} catch (error) {
  console.error("Failed to join room:", error)
}
```

### การส่งข้อมูล

```typescript
// ส่งข้อความแบบ text
p2pConnection.send("chat", { message: "Hello!" })

// ส่งข้อมูลเกม
p2pConnection.send("game-state", {
  player: { x: 10, y: 20 },
  ball: { x: 50, y: 50, vx: 2, vy: 3 },
  score: 10
})

// ส่งคำสั่งเกม
p2pConnection.send("game-action", {
  action: "move",
  direction: "up"
})
```

## API Reference

### Constructor

```typescript
new P2PConnection()
```

สร้างอินสแตนซ์ใหม่ของ P2PConnection พร้อมสถานะ "disconnected"

### Methods

#### `createOffer(): Promise<string>`

สร้าง WebRTC Offer SDP สำหรับการเริ่มการเชื่อมต่อ

**คืนค่า:** Promise ที่คืนค่า string ของ Offer SDP ที่เข้ารหัสด้วย base64

**ข้อยกเว้น:** Error เมื่อไม่สามารถสร้าง Offer ได้

#### `acceptOffer(offerString: string): Promise<string>`

ยอมรับ Offer SDP จาก peer และสร้าง Answer SDP

**พารามิเตอร์:**
- `offerString`: string ของ Offer SDP ที่เข้ารหัสด้วย base64

**คืนค่า:** Promise ที่คืนค่า string ของ Answer SDP ที่เข้ารหัสด้วย base64

**ข้อยกเว้น:** Error เมื่อไม่สามารถยอมรับ Offer หรือสร้าง Answer ได้

#### `acceptAnswer(answerString: string): Promise<void>`

ยอมรับ Answer SDP จาก peer เพื่อทำการเชื่อมต่อ

**พารามิเตอร์:**
- `answerString`: string ของ Answer SDP ที่เข้ารหัสด้วย base64

**ข้อยกเว้น:** Error เมื่อไม่สามารถยอมรับ Answer ได้

#### `send(type: string, data: any): void`

ส่งข้อมูลไปยัง peer ที่เชื่อมต่ออยู่

**พารามิเตอร์:**
- `type`: string ประเภทของข้อมูล
- `data`: any ข้อมูลที่จะส่ง (จะถูกแปลงเป็น JSON)

**หมายเหตุ:** หากการเชื่อมต่อยังไม่ได้เปิด ข้อมูลจะถูกละเว้น

#### `disconnect(): void`

ปิดการเชื่อมต่อ P2P และทำความสะอาดทรัพยากร

**หมายเหตุ:** ควรเรียกเมื่อ component unmount หรือเมื่อไม่ต้องการใช้การเชื่อมต่อต่อ

#### `onStatusChange(callback: (status: ConnectionStatus) => void): void`

ลงทะเบียน callback สำหรับการเปลี่ยนสถานะการเชื่อมต่อ

**พารามิเตอร์:**
- `callback`: function ที่จะถูกเรียกเมื่อสถานะเปลี่ยน

**ConnectionStatus:**
- `"disconnected"`: ไม่ได้เชื่อมต่อ
- `"connecting"`: กำลังเชื่อมต่อ
- `"connected"`: เชื่อมต่อแล้ว
- `"failed"`: การเชื่อมต่อล้มเหลว

#### `onMessage(callback: (message: PeerMessage) => void): void`

ลงทะเบียน callback สำหรับการรับข้อความ

**พารามิเตอร์:**
- `callback`: function ที่จะถูกเรียกเมื่อได้รับข้อความ

**PeerMessage:**
```typescript
interface PeerMessage {
  type: string
  data: any
}
```

#### `getStatus(): ConnectionStatus`

คืนค่าสถานะการเชื่อมต่อปัจจุบัน

## ประเภทข้อมูล

### ConnectionStatus

```typescript
type ConnectionStatus = "disconnected" | "connecting" | "connected" | "failed"
```

### PeerMessage

```typescript
interface PeerMessage {
  type: string
  data: any
}
```

## ตัวอย่างการใช้งานแบบสมบูรณ์

### การสร้างห้องและรอการเชื่อมต่อ

```typescript
import { useState, useEffect } from "react"
import { P2PConnection, ConnectionStatus } from "@/lib/p2p-connection"

export function useCreateRoom() {
  const [connection, setConnection] = useState<P2PConnection | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const [offerCode, setOfferCode] = useState<string>("")
  const [error, setError] = useState<string>("")
  
  const createRoom = async () => {
    try {
      setError("")
      const p2p = new P2PConnection()
      
      // ตั้งค่า status change handler
      p2p.onStatusChange((newStatus) => {
        setStatus(newStatus)
        if (newStatus === "failed") {
          setError("การเชื่อมต่อล้มเหลว กรุณาลองใหม่")
        }
      })
      
      // สร้าง offer
      const offer = await p2p.createOffer()
      setOfferCode(offer)
      setConnection(p2p)
      
      // คัดลอกไปยัง clipboard อัตโนมัติ
      navigator.clipboard.writeText(offer)
      
    } catch (err) {
      console.error("Failed to create room:", err)
      setError("ไม่สามารถสร้างห้องได้ กรุณาลองใหม่")
    }
  }
  
  const acceptAnswer = async (answerCode: string) => {
    if (!connection) return
    
    try {
      setError("")
      await connection.acceptAnswer(answerCode)
    } catch (err) {
      console.error("Failed to accept answer:", err)
      setError("รหัสตอบกลับไม่ถูกต้อง กรุณาตรวจสอบและลองอีกครั้ง")
    }
  }
  
  const disconnect = () => {
    if (connection) {
      connection.disconnect()
      setConnection(null)
      setStatus("disconnected")
      setOfferCode("")
    }
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return disconnect
  }, [])
  
  return {
    connection,
    status,
    offerCode,
    error,
    createRoom,
    acceptAnswer,
    disconnect
  }
}
```

### การเข้าร่วมห้อง

```typescript
import { useState, useEffect } from "react"
import { P2PConnection, ConnectionStatus } from "@/lib/p2p-connection"

export function useJoinRoom() {
  const [connection, setConnection] = useState<P2PConnection | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const [answerCode, setAnswerCode] = useState<string>("")
  const [error, setError] = useState<string>("")
  
  const joinRoom = async (offerCode: string) => {
    try {
      setError("")
      const p2p = new P2PConnection()
      
      // ตั้งค่า status change handler
      p2p.onStatusChange((newStatus) => {
        setStatus(newStatus)
        if (newStatus === "failed") {
          setError("การเชื่อมต่อล้มเหลว กรุณาตรวจสอบรหัสและลองใหม่")
        }
      })
      
      // ยอมรับ offer
      const answer = await p2p.acceptOffer(offerCode)
      setAnswerCode(answer)
      setConnection(p2p)
      
      // คัดลอกไปยัง clipboard อัตโนมัติ
      navigator.clipboard.writeText(answer)
      
    } catch (err) {
      console.error("Failed to join room:", err)
      setError("รหัสไม่ถูกต้อง กรุณาตรวจสอบและลองอีกครั้ง")
    }
  }
  
  const disconnect = () => {
    if (connection) {
      connection.disconnect()
      setConnection(null)
      setStatus("disconnected")
      setAnswerCode("")
    }
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return disconnect
  }, [])
  
  return {
    connection,
    status,
    answerCode,
    error,
    joinRoom,
    disconnect
  }
}
```

## การแก้ไขปัญหา

### การจัดการ ICE candidates ที่ไม่ถูกต้อง

ปัญหาหลักคือการจัดการ ICE candidates ที่ไม่สมบูรณ์ วิธีแก้ไข:

1. รอให้การเก็บ ICE candidates เสร็จสมบูรณ์ก่อนส่ง offer/answer
2. ส่ง ICE candidates ทั้งหมดไปกับ offer/answer
3. ใช้ STUN server หลายตัวเพื่อเพิ่มโอกาสสำเร็จ

```typescript
// ในส่วน createOffer/acceptOffer
const iceCandidates: RTCIceCandidate[] = []

this.peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    iceCandidates.push(event.candidate)
  }
}

// รอให้ ICE gathering เสร็จสมบูรณ์
await new Promise<void>((resolve) => {
  if (this.peerConnection.iceGatheringState === "complete") {
    resolve()
  } else {
    this.peerConnection.onicegatheringstatechange = () => {
      if (this.peerConnection.iceGatheringState === "complete") {
        resolve()
      }
    }
  }
})

// ส่ง ICE candidates ไปกับ offer/answer
const offerData = {
  sdp: this.peerConnection.localDescription,
  candidates: iceCandidates
}
```

### การเพิ่ม STUN/TURN servers

การใช้ STUN/TURN servers หลายตัวช่วยเพิ่มโอกาสการเชื่อมต่อสำเร็จ:

```typescript
const iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  // เพิ่ม TURN server ถ้ามี
  {
    urls: "turn:your-turn-server.com",
    username: "user",
    credential: "pass"
  }
]

this.peerConnection = new RTCPeerConnection({ iceServers })
```

### การเพิ่ม error handling ที่ดีขึ้น

```typescript
try {
  // WebRTC operations
} catch (error) {
  console.error("P2P error:", error)
  this.setStatus("failed")
  
  // ส่ง error ที่เฉพาะเจาะจง
  if (error.name === "NotSupportedError") {
    throw new Error("เบราว์เซอร์ของคุณไม่รองรับ WebRTC")
  } else if (error.name === "SecurityError") {
    throw new Error("ไม่สามารถเข้าถึงอุปกรณ์สื่อสาร กรุณาตรวจสอบการตั้งค่าความปลอดภัย")
  } else {
    throw new Error("เกิดข้อผิดพลาดในการเชื่อมต่อ")
  }
}
```

## การทดสอบ

### การทดสอบบน localhost

1. เปิดสองแท็บบนเบราว์เซอร์เดียวกัน
2. สร้างห้องบนแท็บแรก
3. คัดลอก offer code และนำไปใช้บนแท็บที่สอง
4. คัดลอก answer code และนำกลับไปยังแท็บแรก

### การทดสอบข้ามเครือข่าย

1. ใช้สองอุปกรณ์/คอมพิวเตอร์บนเครือข่ายต่างกัน
2. ทดสอบผ่าน WiFi และ 4G/5G
3. ทดสอบกับและไม่มี VPN

### การ debug

ใช้ console logs ใน `lib/p2p-connection.ts` หรือ Chrome Developer Tools ที่แท็บ "WebRTC":

```javascript
// ดู connection states
console.log("Connection state:", peerConnection.connectionState)
console.log("Ice connection state:", peerConnection.iceConnectionState)
console.log("Ice gathering state:", peerConnection.iceGatheringState)

// ดู statistics
peerConnection.getStats().then(stats => {
  stats.forEach(report => {
    console.log(report.type, report)
  })
})
```
