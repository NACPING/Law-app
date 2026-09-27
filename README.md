# MyAiApp (Legal App)

แอปกฎหมายที่ประกอบด้วย Frontend ด้วย Expo / React Native และ Backend ด้วย Express, Prisma และ SQLite

## สิ่งที่ต้องเตรียม

- Node.js และ npm
- Windows, macOS หรือ Linux สำหรับพัฒนา
- Expo Go บนโทรศัพท์ (ถ้าต้องการทดสอบบนอุปกรณ์จริง)

## ติดตั้ง Dependencies

เปิด terminal ที่โฟลเดอร์โปรเจ็กต์ แล้วติดตั้ง Frontend:

```bash
npm install
```

ติดตั้ง Backend แยกอีกครั้งในโฟลเดอร์ `backend`:

```bash
cd backend
npm install
```

## ตั้งค่า Environment

### Backend: `backend/.env`

สร้างไฟล์ `backend/.env` แล้วตั้งค่า:

```dotenv
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-long-random-secret"
```

`DATABASE_URL` นี้ชี้ไปยัง SQLite ที่ `backend/prisma/dev.db` โดยอ้างอิงจากตำแหน่งไฟล์ Prisma schema อย่า commit ค่า secret จริงขึ้น Git

### Frontend: `.env`

สร้างไฟล์ `.env` ที่โฟลเดอร์หลักของโปรเจ็กต์:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

เปลี่ยน host ตามอุปกรณ์ที่เปิดแอป:

- เว็บที่เปิดบนคอมพิวเตอร์เครื่องเดียวกับ Backend: `http://localhost:5000/api`
- Android Emulator: `http://10.0.2.2:5000/api`
- โทรศัพท์จริง: ใช้ IP ภายในของคอมพิวเตอร์ที่รัน Backend เช่น `http://192.168.1.38:5000/api` และให้โทรศัพท์กับคอมพิวเตอร์อยู่ Wi-Fi เดียวกัน

คง path `/api` ไว้ท้าย URL และหลังแก้ `.env` ให้เริ่ม Expo ใหม่ เพื่อให้โหลดค่าใหม่

## เตรียมฐานข้อมูล Prisma

จาก terminal ที่อยู่ใน `backend`:

```bash
npx prisma generate
npx prisma db push
node prisma/seed.js
```

- `prisma generate` สร้าง Prisma Client จาก `backend/prisma/schema.prisma`
- `prisma db push` ปรับฐานข้อมูล SQLite ให้ตรงกับ schema โดยไม่สร้าง migration history
- `node prisma/seed.js` เพิ่มหมวดหมู่กฎหมายตัวอย่าง หากมีหมวดหมู่เดิมอยู่แล้ว seed จะไม่เพิ่มซ้ำ

`db push` เหมาะสำหรับการตั้งค่า/พัฒนาในเครื่อง ก่อนใช้กับฐานข้อมูลที่มีข้อมูลสำคัญควรสำรองข้อมูล และตรวจผลกระทบจาก schema ก่อนเสมอ

เปิด Prisma Studio เพื่อตรวจดูฐานข้อมูลได้ด้วย:

```bash
npx prisma studio
```

## รัน Backend และ Frontend

เปิด **terminal แรก** ที่โฟลเดอร์ `backend`:

```bash
npm run dev
```

Backend จะรับ request ที่ `http://localhost:5000` ตรวจสอบสถานะได้ที่ `http://localhost:5000/`

เปิด **terminal ที่สอง** ที่โฟลเดอร์หลัก:

```bash
npm start
```

เลือกเปิดเว็บจากเมนู Expo หรือใช้:

```bash
npm run web
```

สำหรับโทรศัพท์จริง ให้สแกน QR code จาก Expo Go โดยใช้ URL ใน `.env` ที่ชี้ไปยัง IP ภายในของคอมพิวเตอร์

## คำสั่งที่ใช้บ่อย

| คำสั่ง | โฟลเดอร์ที่ใช้ | รายละเอียด |
| --- | --- | --- |
| `npm start` | โฟลเดอร์หลัก | เริ่ม Expo development server |
| `npm run web` | โฟลเดอร์หลัก | เริ่ม Frontend บนเว็บ |
| `npm run lint` | โฟลเดอร์หลัก | ตรวจ lint ของ Frontend |
| `npm run dev` | `backend` | เริ่ม Backend พร้อม nodemon |
| `npm start` | `backend` | เริ่ม Backend โดยไม่ใช้ nodemon |
| `npx prisma generate` | `backend` | สร้าง Prisma Client |
| `npx prisma db push` | `backend` | ปรับฐานข้อมูลให้ตรง Prisma schema |
| `node prisma/seed.js` | `backend` | เพิ่มหมวดหมู่ตัวอย่าง |
| `npx prisma studio` | `backend` | เปิดเครื่องมือจัดการฐานข้อมูล |

## แก้ปัญหาเบื้องต้น

### `EADDRINUSE: address already in use 0.0.0.0:5000`

มีโปรเซสอื่นกำลังใช้พอร์ต Backend อยู่ ตรวจสอบใน PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 5000 -State Listen
```

ตรวจให้แน่ใจก่อนว่าโปรเซสที่ใช้พอร์ตเป็น Backend instance เก่าของโปรเจ็กต์นี้ แล้วหยุด instance เก่าจาก terminal เดิมด้วย `Ctrl+C` ก่อนเริ่ม `npm run dev` อีกครั้ง อย่าหยุดโปรเซสที่ไม่รู้จัก

### แอปเชื่อมต่อ Backend ไม่ได้

- ตรวจว่า Backend รันอยู่ และเปิด `http://localhost:5000/` บนคอมพิวเตอร์ได้
- ตรวจ `EXPO_PUBLIC_API_URL` ใน `.env` ว่าใช้ host ที่เข้าถึงได้จากอุปกรณ์ และลงท้ายด้วย `/api`
- โทรศัพท์จริงต้องใช้ IP ภายในของคอมพิวเตอร์แทน `localhost` และอยู่เครือข่ายเดียวกัน
- ตรวจ Firewall ว่าอนุญาตการเชื่อมต่อ Backend บนพอร์ต `5000`
- หลังเปลี่ยน `.env` ให้หยุด Expo แล้วเริ่มใหม่

### Prisma Client หรือฐานข้อมูลไม่ตรงกับ schema

จากโฟลเดอร์ `backend` รัน:

```bash
npx prisma generate
npx prisma db push
```

จากนั้น restart Backend เพื่อให้โหลด Prisma Client ที่สร้างใหม่
