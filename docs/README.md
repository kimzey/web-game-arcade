# Co-op Arcade Documentation

เอกสารนี้รวบรวมข้อมูลและคำแนะนำสำหรับการพัฒนาและบำรุงรักษาโปรเจกต์ Co-op Arcade

## โครงสร้างเอกสาร

- [เอกสารหลัก](../README.md) - ภาพรวมโปรเจกต์และแผนการพัฒนา
- [ข้อบังคับและแนวทาง](../RULES.md) - ข้อห้ามและแนวทางปฏิบัติ
- [คู่มือการเขียนโค้ด](../STYLEGUIDE.md) - รูปแบบการเขียนโค้ดและมาตรฐาน
- [ข้อกำหนดฟีเจอร์](../SPEC.md) - สเปคของฟีเจอร์หลัก
- [สถาปัตยกรรมระบบ](../ARCHITECTURE.md) - โครงสร้างระบบและ data flow
- [สมมติฐานและข้อจำกัด](../ASSUMPTIONS.md) - สมมติฐานที่ใช้ตัดสินใจและข้อจำกัด
- [บันทึกการเปลี่ยนแปลง](../CHANGELOG.md) - ประวัติการเปลี่ยนแปลงของโปรเจกต์

## API Documentation

- [P2P Connection API](api/p2p-connection.md) - เอกสาร API สำหรับการเชื่อมต่อ P2P

## คู่มือและแนวทาง

- [การปรับปรุงประสบการณ์ผู้ใช้บนมือถือ](guides/mobile-optimization.md) - คู่มือการทำให้ UI รองรับอุปกรณ์มือถือ
- [การ Debug ปัญหา P2P Connection](guides/p2p-debugging.md) - คู่มือการแก้ไขปัญหาการเชื่อมต่อ P2P
- [การแก้ไขปัญหาทั่วไป](guides/troubleshooting.md) - คู่มือการแก้ไขปัญหาที่พบบ่อย
- [การทดสอบโปรเจกต์](guides/testing.md) - คู่มือการทดสอบทุกระดับ (unit, integration, E2E)

## ปัญหาระดับสูงที่ต้องแก้ไขโดยเร่งด่วน

ตามที่ระบุในเอกสาร [ASSUMPTIONS.md](../ASSUMPTIONS.md) และ [SPEC.md](../SPEC.md) มีปัญหาสำคัญสองประการที่ต้องแก้ไขโดยเร่งด่วน:

1. **ระบบ P2P ไม่สามารถใช้งานได้** - ดูรายละเอียดใน [P2P Debugging Guide](guides/p2p-debugging.md)
2. **UI ไม่เหมาะสมกับอุปกรณ์มือถือ** - ดูรายละเอียดใน [Mobile Optimization Guide](guides/mobile-optimization.md)

## วิธีการใช้เอกสาร

### สำหรับนักพัฒนาใหม่
1. เริ่มจาก [README.md](../README.md) เพื่อเข้าใจภาพรวมโปรเจกต์
2. อ่าน [ARCHITECTURE.md](../ARCHITECTURE.md) เพื่อเข้าใจโครงสร้างระบบ
3. ศึกษา [STYLEGUIDE.md](../STYLEGUIDE.md) เพื่อทำตามมาตรฐานโค้ด
4. ดู [SPEC.md](../SPEC.md) สำหรับรายละเอียดฟีเจอร์ที่ต้องพัฒนา

### สำหรับการแก้ไขปัญหา
1. ดู [TROUBLESHOOTING.md](guides/troubleshooting.md) สำหรับปัญหาทั่วไป
2. ดู [P2P Debugging Guide](guides/p2p-debugging.md) สำหรับปัญหาการเชื่อมต่อ
3. ตรวจสอบ [CHANGELOG.md](../CHANGELOG.md) สำหรับประวัติปัญหาที่แก้ไขแล้ว

### สำหรับการพัฒนาฟีเจอร์ใหม่
1. ศึกษา [SPEC.md](../SPEC.md) และ [ARCHITECTURE.md](../ARCHITECTURE.md)
2. ทำตาม [STYLEGUIDE.md](../STYLEGUIDE.md) และ [RULES.md](../RULES.md)
3. เขียนการทดสอบตาม [Testing Guide](guides/testing.md)

## การอัปเดตเอกสาร

เมื่อมีการเปลี่ยนแปลงสำคัญในโปรเจกต์ ควรอัปเดตเอกสารที่เกี่ยวข้อง:

1. การเปลี่ยนแปลงฟีเจอร์ → อัปเดต SPEC.md และ README.md
2. การเปลี่ยนแปลงโครงสร้าง → อัปเดต ARCHITECTURE.md
3. การแก้ไขปัญหา → อัปเดต CHANGELOG.md
4. การเปลี่ยนแปลงมาตรฐาน → อัปเดต STYLEGUIDE.md และ RULES.md

## แหล่งข้อมูลเพิ่มเติม

- [React Documentation](https://react.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [WebRTC Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/primitives/docs/overview/introduction)