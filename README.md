# Co-op Arcade

เว็บแอปพลิเคชันเกมแอ็กชันผู้เล่นหลายคนแบบคอ-โอป (co-operative) ที่ใช้ WebRTC เพื่อเชื่อมต่อระหว่างผู้เล่นโดยตรง (peer-to-peer) โดยไม่ต้องพึ่งพาเซิร์ฟเวอร์กลาง

"" https://v0-preview-xi-nine.vercel.app/ ""

## ภาพรวมโปรเจกต์

Co-op Arcade เป็นแพลตฟอร์มเกมที่อนุญาตให้ผู้เล่นสามารถสร้างห้องเกมหรือเข้าร่วมห้องที่มีอยู่แล้วเพื่อเล่นเกมแบบร่วมมือกัน ระบบใช้การเชื่อมต่อ WebRTC แบบ P2P ซึ่งช่วยลดความล่าช้าและไม่จำเป็นต้องมีเซิร์ฟเวอร์กลางในการส่งข้อมูลเกม

### เป้าหมายของโปรเจกต์

- สร้างประสบการณ์การเล่นเกมแบบ co-op ที่ราบรื่นผ่านเว็บเบราว์เซอร์
- ใช้เทคโนโลยี WebRTC เพื่อการเชื่อมต่อแบบ peer-to-peer ที่มีประสิทธิภาพ
- พัฒนาเกมหลากหลายประเภทที่เน้นการร่วมมือกัน
- สร้าง UI/UX ที่ใช้งานง่ายและมีความทันสมัย

## ฟีเจอร์หลัก

- **ระบบห้องเกม**: สร้างและเข้าร่วมห้องเกมผ่านรหัสเชิญ
- **เกมหลากหลาย**: Pong, Snake, และ Space Shooter ที่ออกแบบมาสำหรับการเล่นแบบ co-op
- **การเชื่อมต่อ P2P**: ใช้ WebRTC เพื่อเชื่อมต่อโดยตรงระหว่างผู้เล่น
- **โหมดผู้เล่นเดี่ยว**: ฝึกฝนทักษะก่อนเล่นกับผู้อื่น
- **การตั้งค่าผู้ใช้**: ปรับแต่งชื่อผู้เล่นและเสียงในเกม

## เทคโนโลยีที่ใช้

- **Frontend**: Next.js 16.0.10, React 19.2.0, TypeScript
- **UI Components**: Radix UI, shadcn/ui, Tailwind CSS
- **State Management**: Zustand
- **P2P Communication**: WebRTC API
- **Form Handling**: React Hook Form with Zod validation
- **Deployment**: Vercel (recommended)

## โครงสร้างโปรเจกต์

```
/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── settings/          # Settings page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── games/            # Game components
│   ├── game-select.tsx   # Game selection screen
│   └── lobby-page.tsx    # Main lobby screen
├── lib/                   # Utility libraries
│   ├── p2p-connection.ts # WebRTC P2P connection manager
│   ├── game-store.ts     # Zustand state management
│   └── utils.ts          # Utility functions
└── styles/                # Additional styles
```

## เริ่มต้นใช้งาน

### การติดตั้ง

1. โคลน repository:
   ```bash
   git clone [repository-url]
   cd co-op-arcade
   ```

2. ติดตั้ง dependencies:
   ```bash
   npm install
   # หรือ
   pnpm install
   ```

### การรันโปรเจกต์

1. เริ่ม development server:
   ```bash
   npm run dev
   # หรือ
   pnpm dev
   ```

2. เปิด http://localhost:3000 ในเบราว์เซอร์

### การสร้างสำหรับ production

```bash
npm run build
npm run start
```

## แผนการพัฒนา (Development Plan)

### Phase 1: Documentation (เอกสาร) [✓]
- สร้างเอกสารโปรเจกต์ครบถ้วน (README, RULES, STYLEGUIDE, SPEC, ARCHITECTURE, ASSUMPTIONS, CHANGELOG)
- วางแผนโครงสร้างและข้อกำหนดของระบบ

### Phase 2: Critical Issues (ปัญหาระดับสูง) [ด่วน]
- แก้ไขระบบ P2P connection ที่ใช้งานไม่ได้ในปัจจุบัน
- ปรับปรุง UI ให้รองรับอุปกรณ์มือถือ เพิ่มปุ่มควบคุมแบบ touch
- เพิ่มปุ่ม reset สำหรับเกมบนอุปกรณ์ทัชสกรีน
- ทดสอบและแก้ไขปัญหา ICE candidates ในระบบ WebRTC

### Phase 3: Core Infrastructure (โครงสร้างหลัก)
- ปรับปรุงระบบ P2P connection เพื่อความเสถียร
- สร้าง error handling ที่ครอบคลุม
- เพิ่ม connection quality monitoring
- พัฒนา fallback mechanism เมื่อ P2P ล้มเหลว

### Phase 4: Game Enhancements (พัฒนาเกม)
- ปรับปรุงเกม Pong ด้าน physics และการควบคุม
- พัฒนาเกม Snake รอบที่ 2 พร้อม power-ups
- สร้าง Space Shooter เวอร์ชันเต็ม
- เพิ่มระบบคะแนนและ leaderboards

### Phase 5: User Experience (ปรับปรุง UX)
- พัฒนา onboarding flow สำหรับผู้ใช้ใหม่
- เพิ่ม tutorial สำหรับแต่ละเกม
- ปรับปรุง UI และ animations
- เพิ่มระบบ notification และ feedback

### Phase 6: Social Features (ฟีเจอร์สังคม)
- พัฒนาระบบเพื่อน (friends system)
- สร้าง chat ในห้องเกม
- เพิ่มระบบ matchmaking
- สร้างระบบ invitation ขั้นสูง

### Phase 7: Advanced Features (ฟีเจอร์ขั้นสูง)
- พัฒนา voice chat ผ่าน WebRTC
- สร้างระบบ recording gameplay
- เพิ่มระบบ spectator mode
- พัฒนา tournament system

## ปัญหาที่ต้องแก้ไขโดยเร่งด่วน

### 1. ระบบ P2P ใช้งานไม่ได้
ระบบเชื่อมต่อ P2P ปัจจุบันใช้งานไม่ได้ในสถานการณ์จริง ทำให้ผู้ใช้ไม่สามารถเล่นเกมแบบ multiplayer ได้

### 2. UI ไม่เหมาะกับมือถือ
UI ปัจจุบันไม่เหมาะสมกับการใช้งานบนอุปกรณ์มือถือ ทำให้เล่นเกมได้ยาก และไม่มีปุ่ม reset สำหรับอุปกรณ์ทัชสกรีน

ปัญหาเหล่านี้ถูกกำหนดให้เป็นลำดับความสำคัญสูงสุดใน Phase 2

## บริจาค (Contributing)

1. Fork repository
2. สร้าง branch ใหม่ (`git checkout -b feature/amazing-feature`)
3. Commit changes ตามหลักการใน STYLEGUIDE.md
4. Push ไปยัง branch (`git push origin feature/amazing-feature`)
5. สร้าง Pull Request และกรอกตาม template

## License

โปรเจกต์นี้ใช้ MIT License - ดูรายละเอียดใน [LICENSE](LICENSE) file

## Definition of Done (DoD)

- ✅ โครงสร้างเอกสารสมบูรณ์และอัปเดตล่าสุด
- ✅ มีทุกส่วนที่กำหนดใน template
- ✅ เนื้อหากระชับแต่ครบถ้วน
- ✅ แผนการพัฒนาแบ่งเป็น task ที่ชัดเจน
- ✅ ข้อมูลสามารถตรวจสอบได้และถูกต้อง

## Acceptance Criteria

- ✅ ผู้อ่านสามารถเข้าใจภาพรวมโปรเจกต์ภายใน 5 นาที
- ✅ นักพัฒนาสามารถติดตั้งและรันโปรเจกต์ได้ตามคำแนะนำ
- ✅ มีแผนการพัฒนาที่ชัดเจนแบ่งตาม phase และ task
- ✅ มีข้อมูลเทคโนโลยีและโครงสร้างโปรเจกต์ที่เพียงพอ
- ✅ มีวิธีการสนับสนุนการมีส่วนร่วม (contributing) ที่ชัดเจน
