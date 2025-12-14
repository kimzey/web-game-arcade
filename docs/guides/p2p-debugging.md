# คู่มือการ Debug ปัญหา P2P Connection

## ปัญหาที่พบบ่อย

### 1. การเชื่อมต่อล้มเหลว (Connection Failed)
ปัญหาที่พบบ่อยที่สุดคือการเชื่อมต่อ P2P ล้มเหลวโดยไม่ทราบสาเหตุ ซึ่งมีหลายสาเหตุที่เป็นไปได้:

#### 1.1 ปัญหา ICE Candidates
- **สาเหตุ**: ICE candidates ไม่ได้ถูกส่งหรือรับอย่างถูกต้อง
- **อาการ**: สถานะ "connecting" ค้างไปนานแล้วเปลี่ยนเป็น "failed"
- **การตรวจสอบ**:
  ```javascript
  console.log("ICE candidates:", iceCandidates)
  console.log("Local candidates:", peerConnection.localDescription)
  console.log("Remote candidates:", peerConnection.remoteDescription)
  ```

#### 1.2 ปัญหา NAT Traversal
- **สาเหตุ**: อุปกรณ์อยู่ภายใต้ NAT ที่ซับซ้อนหรือมี firewall
- **อาการ**: การเชื่อมต่อล้มเหลวทันทีหรือหลังจากค้างไปสักพัก
- **การตรวจสอบ**:
  ```javascript
  peerConnection.onicecandidateerror = (event) => {
    console.error("ICE candidate error:", event)
  }
  ```

#### 1.3 ปัญหา STUN/TURN Servers
- **สาเหตุ**: STUN/TURN servers ไม่สามารถเข้าถึงได้หรือใช้งานไม่ได้
- **อาการ**: ไม่มี ICE candidates ที่ถูกสร้างขึ้น
- **การตรวจสอบ**:
  ```javascript
  // ใช้ public STUN servers หลายตัว
  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ]
  ```

### 2. การเชื่อมต่อขาดหายระหว่างเกม
- **สาเหตุ**: การเชื่อมต่อขาดหายชั่วคราวเนื่องจาก network issues
- **อาการ**: เกมค้างไป หรือข้อมูลที่ส่งไม่ถึงอีกฝ่าย
- **การแก้ไข**:
  ```typescript
  // เพิ่มการจัดการ connection state change
  peerConnection.onconnectionstatechange = () => {
    console.log("Connection state changed:", peerConnection.connectionState)
    if (peerConnection.connectionState === "disconnected") {
      // พยายามเชื่อมต่อใหม่
      attemptReconnection()
    }
  }
  ```

### 3. การส่งข้อมูลล้มเหลว
- **สาเหตุ**: ส่งข้อมูลเมื่อ data channel ยังไม่เปิด
- **อาการ**: ข้อมูลไม่ถูกส่งไปยังอีกฝ่าย
- **การแก้ไข**:
  ```typescript
  const send = (type: string, data: any) => {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(JSON.stringify({ type, data }))
    } else {
      console.warn("Cannot send message, data channel not open")
    }
  }
  ```

## เครื่องมือที่ใช้ในการ Debug

### 1. Chrome DevTools
- **WebRTC Internals**: เข้าไปที่ `chrome://webrtc-internals`
- **Network Tab**: ตรวจสอบการส่งข้อมูล
- **Console**: ดู logs และ error messages

### 2. WebRTC Debugging APIs
```javascript
// ดูสถานะ connection
console.log("Connection state:", peerConnection.connectionState)
console.log("Ice connection state:", peerConnection.iceConnectionState)
console.log("Ice gathering state:", peerConnection.iceGatheringState)
console.log("Signaling state:", peerConnection.signalingState)

// ดู statistics
peerConnection.getStats().then(stats => {
  stats.forEach(report => {
    console.log(report.type, report)
  })
})

// ดู local/remote descriptions
console.log("Local description:", peerConnection.localDescription)
console.log("Remote description:", peerConnection.remoteDescription)
```

### 3. Custom Debug Logging
เพิ่ม logging functions ใน `lib/p2p-connection.ts`:
```typescript
private log(type: 'info' | 'error' | 'warn', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [P2P] ${message}`
  
  switch (type) {
    case 'info':
      console.log(logMessage, data)
      break
    case 'error':
      console.error(logMessage, data)
      break
    case 'warn':
      console.warn(logMessage, data)
      break
  }
}
```

## ขั้นตอนการ Debug

### 1. การเก็บข้อมูลการเชื่อมต่อ
สร้างฟังก์ชันสำหรับเก็บข้อมูลการเชื่อมต่อ:
```typescript
export function collectConnectionInfo(peerConnection: RTCPeerConnection): object {
  return {
    connectionState: peerConnection.connectionState,
    iceConnectionState: peerConnection.iceConnectionState,
    iceGatheringState: peerConnection.iceGatheringState,
    signalingState: peerConnection.signalingState,
    localDescription: peerConnection.localDescription,
    remoteDescription: peerConnection.remoteDescription
  }
}
```

### 2. การทดสอบแบบ Controlled
สร้างสภาพแวดล้อมการทดสอบ:
```typescript
// ทดสอบบน localhost ก่อน
// ทดสอบบน network เดียวกัน
// ทดสอบข้าม network
// ทดสอบกับ VPN
```

### 3. การทดสอบ ICE Gathering
เพิ่มการตรวจสอบ ICE gathering:
```typescript
async function testIceGathering() {
  const testConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  })
  
  const iceCandidates = []
  
  testConnection.onicecandidate = (event) => {
    if (event.candidate) {
      iceCandidates.push(event.candidate)
    }
  }
  
  await testConnection.createOffer()
  await testConnection.setLocalDescription(testConnection.localDescription)
  
  // รอให้ ICE gathering เสร็จ
  return new Promise(resolve => {
    if (testConnection.iceGatheringState === "complete") {
      resolve(iceCandidates)
    } else {
      testConnection.onicegatheringstatechange = () => {
        if (testConnection.iceGatheringState === "complete") {
          resolve(iceCandidates)
        }
      }
    }
  })
}
```

## การแก้ไขปัญหาที่พบบ่อย

### 1. การแก้ไขปัญหา ICE Candidates
```typescript
// ใน createOffer/acceptOffer
const iceCandidates: RTCIceCandidate[] = []

this.peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    iceCandidates.push(event.candidate)
  }
}

// รอให้ ICE gathering เสร็จสมบูรณ์
await new Promise<void>((resolve) => {
  if (this.peerConnection?.iceGatheringState === "complete") {
    resolve()
  } else {
    this.peerConnection!.onicegatheringstatechange = () => {
      if (this.peerConnection?.iceGatheringState === "complete") {
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

### 2. การเพิ่ม Fallback Mechanism
```typescript
// เพิ่ม multiple STUN servers
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

### 3. การเพิ่ม Reconnection Logic
```typescript
let reconnectAttempts = 0
const maxReconnectAttempts = 3

const attemptReconnection = async () => {
  if (reconnectAttempts >= maxReconnectAttempts) {
    this.setStatus("failed")
    return
  }
  
  reconnectAttempts++
  this.log('info', `Attempting reconnection ${reconnectAttempts}/${maxReconnectAttempts}`)
  
  try {
    // สร้างการเชื่อมต่อใหม่
    await this.createOffer() // หรือ acceptOffer ขึ้นอยู่กับบทบาท
  } catch (error) {
    this.log('error', 'Reconnection failed', error)
    setTimeout(attemptReconnection, 2000 * reconnectAttempts)
  }
}
```

## การบันทึกและรายงานปัญหา

### 1. การสร้าง Bug Report Template
```
## ปัญหา: [ชื่อปัญหา]
### สถานการณ์
- ประเภทอุปกรณ์: [Desktop/Mobile/Tablet]
- เบราว์เซอร์: [Chrome/Firefox/Safari/Edge]
- เวอร์ชัน: [xx.xx]
- Network: [WiFi/4G/5G]
- พื้นที่: [บ้าน/ออฟฟิศ/สถานที่สาธารณะ]

### อาการ
- [รายละเอียดอาการที่พบ]

### ขั้นตอนการทำซ้ำ
1. [ขั้นตอนที่ 1]
2. [ขั้นตอนที่ 2]
3. [ขั้นตอนที่ 3]

### ข้อมูล Technical
- Connection state: [สถานะ connection]
- ICE connection state: [สถานะ ICE connection]
- Error messages: [ข้อความ error ที่พบ]
- Logs: [logs ที่เกี่ยวข้อง]

### ภาพหน้าจอ/วิดีโอ
[แนบภาพหน้าจอหรือวิดีโอถ้ามี]
```

### 2. การเก็บข้อมูลผู้ใช้ (แบบไม่ระบุตัวตน)
```typescript
// สร้างฟังก์ชันสำหรับเก็บข้อมูลเบื้องต้น
export function collectAnonymousData(peerConnection: RTCPeerConnection): object {
  return {
    userAgent: navigator.userAgent,
    connectionState: peerConnection.connectionState,
    iceConnectionState: peerConnection.iceConnectionState,
    timestamp: new Date().toISOString()
  }
}

// ส่งข้อมูลไปยัง analytics service (แบบไม่ระบุตัวตน)
const anonymousData = collectAnonymousData(this.peerConnection)
fetch('/api/connection-metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(anonymousData)
})
```

## แผนการแก้ไขปัญหา P2P

### 1. ระยะสั้น (1-2 สัปดาห์)
- แก้ไขปัญหา ICE candidates gathering
- เพิ่ม STUN servers หลายตัว
- เพิ่ม error handling ที่ดีขึ้น

### 2. ระยะกลาง (3-4 สัปดาห์)
- พัฒนา fallback mechanism
- เพิ่ม TURN server support
- สร้าง reconnection logic

### 3. ระยะยาว (1-2 เดือน)
- พัฒนา connection quality monitoring
- สร้าง analytics system สำหรับการวิเคราะห์ปัญหา
- พัฒนา adaptive bitrate สำหรับการส่งข้อมูลเกม

## Definition of Done (DoD)

- ✅ ระบุปัญหา P2P ที่พบบ่อยและสาเหตุ
- ✅ มีขั้นตอนการ debug ที่ชัดเจน
- ✅ มีตัวอย่างโค้ดสำหรับแก้ไขปัญหา
- ✅ มีเครื่องมือและเทคนิคสำหรับการ debug
- ✅ มีแผนการแก้ไขปัญหาในระยะสั้น กลาง และยาว

## Acceptance Criteria

- ✅ นักพัฒนาสามารถใช้คู่มือนี้ในการ debug ปัญหา P2P ได้
- ✅ มีข้อมูลเพียงพอสำหรับการแก้ไขปัญหา P2P ที่พบบ่อย
- ✅ ช่วยลดเวลาในการแก้ไขปัญหา P2P
- ✅ สามารถนำไปใช้เป็นข้อมูลอ้างอิงในการพัฒนา P2P ต่อไป
- ✅ มีแนวทางที่ชัดเจนสำหรับการรายงานและวิเคราะห์ปัญหา