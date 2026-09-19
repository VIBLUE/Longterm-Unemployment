# รอมานานเท่าไรแล้ว — เว็บเล่าเรื่องจากข้อมูลการว่างงานระยะยาว

เว็บไซต์ static ไม่ต้อง build ไม่ต้องลง dependency อะไรเลย
เปิดด้วย `index.html` ได้ทันที และดึงผลแบบสอบถามจาก Google Sheets มาแสดงแบบอัปเดตเองทุก 1 นาที

```
├─ index.html          ← เนื้อหาทั้งหมดของหน้าเว็บ
├─ credits.html        ← หน้าผู้จัดทำ (รูปอยู่ใน img/)
├─ css/style.css       ← หน้าตา, โหมดมืด, parallax
├─ js/config.js        ← ★ ลิงก์ API และลิงก์ฟอร์ม (ไฟล์เดียวที่ต้องแก้ตอนตั้งค่า)
├─ js/data.js          ← ข้อมูล สนง.สถิติฯ (ห้ามแก้)
├─ js/common.js        ← ใช้ร่วมทุกหน้า: สลับธีม, parallax, transition เปลี่ยนหน้า
├─ js/charts.js        ← ตัววาดกราฟ SVG
├─ js/app.js           ← หน้าหลัก: กราฟ, dashboard, ผลสำรวจสด
├─ backup/v1-original/ ← เวอร์ชันแรก (ไฟล์เดียว) เก็บไว้เผื่อย้อนกลับ
└─ README.md           ← ไฟล์นี้
```

---

## ขั้นที่ 1 — เปิด Google Form และหา Sheet คำตอบ

ถ้ายังไม่ได้สร้างฟอร์ม ใช้สคริปต์ `CreateSurveyForm.gs` รันที่ script.google.com ก่อน
สคริปต์จะสร้างทั้งฟอร์มและไฟล์ Sheets คำตอบให้อัตโนมัติ แล้วพิมพ์ลิงก์ทั้งสามออกมาใน Execution log

เก็บไว้ 2 ลิงก์
- **ลิงก์ฟอร์มสำหรับผู้ตอบ** (ลงท้ายด้วย `/viewform`)
- **ไฟล์ Sheets คำตอบ**

---

## ขั้นที่ 2 — ทำให้ Sheets ส่งข้อมูลออกมาได้

1. เปิดไฟล์ Sheets คำตอบ → เมนู **Extensions → Apps Script**
2. วางโค้ดจาก `PublishSurveyData.gs` ทั้งไฟล์ → กด **Save**
3. กด **Deploy → New deployment**
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. กด Deploy แล้วคัดลอก **Web app URL** ที่ลงท้ายด้วย `/exec`

ทดสอบ: เอา URL ไปเปิดในเบราว์เซอร์ ต้องเห็น JSON ขึ้นมาแบบนี้

```json
{"ok":true,"updatedAt":"2026-09-18T...","total":0,"counts":{...}}
```

> **สำคัญ** ทุกครั้งที่แก้โค้ดใน Apps Script ต้องไป **Deploy → Manage deployments → ปุ่มดินสอ → Version: New version → Deploy**
> ถ้าไม่ทำ เว็บจะยังได้โค้ดเวอร์ชันเก่าอยู่

---

## ขั้นที่ 3 — ใส่ลิงก์ลงในเว็บ

เปิด `js/config.js` จะเห็นบรรทัดนี้

```js
var API_URL  = '';   // URL ที่ลงท้ายด้วย /exec จาก PublishSurveyData.gs
var FORM_URL = '';   // ลิงก์ Google Form สำหรับปุ่ม "ตอบแบบสอบถาม"
```

ใส่ลิงก์ทั้งสองลงไป

```js
var API_URL  = 'https://script.google.com/macros/s/AKfy..../exec';
var FORM_URL = 'https://docs.google.com/forms/d/e/1FAI..../viewform';
```

ถ้าเว้นว่างไว้ เว็บยังเปิดได้ปกติ แค่ส่วน "เสียงจากคนจริง" จะขึ้นว่ายังไม่มีข้อมูล

---

## ขั้นที่ 4 — ขึ้น GitHub Pages

```bash
# สร้าง repo ใหม่ชื่ออะไรก็ได้ เช่น longterm-unemployment
git init
git add index.html css js README.md
git commit -m "เว็บเล่าเรื่องข้อมูลการว่างงานระยะยาว"
git branch -M main
git remote add origin https://github.com/<ชื่อผู้ใช้>/<ชื่อ repo>.git
git push -u origin main
```

จากนั้นใน GitHub

1. เข้า repo → **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** · Folder: **/ (root)** → **Save**
4. รอประมาณ 1–2 นาที จะได้ URL หน้าตาแบบนี้

```
https://<ชื่อผู้ใช้>.github.io/<ชื่อ repo>/
```

เสร็จแล้ว ส่งลิงก์นี้ให้ใครก็ได้

---

## เรื่องที่ควรรู้

**Parallax และการเคลื่อนไหว**
ใช้ CSS `translate` ขับด้วยตัวแปร `--p` ที่ JS คำนวณตามตำแหน่ง scroll ใช้ได้ทั้ง PC และมือถือ (รวม iOS)
ความแรงปรับที่ `--pi` ใน `css/style.css` (PC = 1, มือถือ = 0.55) และปิดเองถ้าผู้ใช้ตั้ง "ลดการเคลื่อนไหว" ในเครื่อง

**ย้อนกลับไปเวอร์ชันเดิม**
คัดลอก `backup/v1-original/index.html` มาทับ `index.html` ที่ root แล้ว commit

**ทำไมต้องโฮสต์เอง ใช้ Artifact บน claude.ai ไม่ได้เหรอ**
หน้า Artifact ถูก CSP บล็อกการ `fetch` ไปโดเมนภายนอกทั้งหมด จึงดึง Google Sheets แบบเรียลไทม์ไม่ได้
เว็บนี้จึงต้องอยู่บนโฮสต์ปกติ เช่น GitHub Pages, Netlify, Vercel หรือ Cloudflare Pages
ทั้งสี่ที่ใช้วิธีเดียวกัน คือลาก `index.html` พร้อมโฟลเดอร์ `css/` และ `js/` ไปวาง

**ทำไมใช้ JSONP ไม่ใช้ fetch ธรรมดา**
Apps Script Web App ตอบกลับผ่าน redirect ไปโดเมน googleusercontent ซึ่งบางเบราว์เซอร์จะติด CORS
เว็บนี้จึงเรียกผ่าน `<script>` tag (JSONP) ซึ่งทำงานได้แน่นอนทุกเบราว์เซอร์ ไม่ต้องตั้งค่าอะไรเพิ่ม

**ความเป็นส่วนตัว**
`PublishSurveyData.gs` ส่งออกเฉพาะยอดนับรวมเท่านั้น ไม่มีคำตอบรายบุคคลหลุดออกมา
และกลุ่มที่มีคนตอบน้อยกว่า 3 คนจะถูกยุบรวมเป็น "กลุ่มเล็กเกินกว่าจะเปิดเผย" เพื่อกัน re-identification
แถวที่ผู้ตอบเลือก "ไม่ยินยอม" จะถูกข้ามทั้งแถว
ปรับเกณฑ์ได้ที่ตัวแปร `MIN_CELL` ในสคริปต์

**ถ้าแก้ข้อความคำถามในฟอร์ม**
สคริปต์จับคอลัมน์ด้วยคำบางคำในหัวตาราง ถ้าแก้คำถามแล้วตัวเลขหาย
ให้ไปแก้ค่า `match` ในตัวแปร `FIELDS` ให้ตรงกับหัวคอลัมน์ใหม่

**ปรับความถี่การอัปเดต**
- ฝั่งเว็บ: `LIVE_REFRESH_MS` ใน `js/config.js` (หน่วยมิลลิวินาที) — หยุดดึงอัตโนมัติเมื่อผู้ใช้สลับไปแท็บอื่น
- ฝั่ง Apps Script: `CACHE_SEC` คือเวลาที่จะคำนวณผลสรุปซ้ำ ตั้งไว้ 60 วินาที ช่วยไม่ให้ชนโควตา

---

## ที่มาข้อมูล

- ชุดข้อมูลอัตราการว่างงานระยะยาว สำนักงานสถิติแห่งชาติ (2561–2568) — อยู่ใน `js/data.js` 3.6 KB
- ขนาดกำลังแรงงานรายไตรมาส จากรายงานการสำรวจภาวะการทำงานของประชากร ไตรมาส 3/2567 และ 3/2568
- ผลสำรวจในบทที่ 6 มาจากแบบสอบถามของโครงการนี้เอง เป็นการสมัครใจตอบ ไม่ใช่การสุ่มตัวอย่าง
