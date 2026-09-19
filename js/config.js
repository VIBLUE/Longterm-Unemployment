/* ============================================================
   ตั้งค่า — แก้ 2 บรรทัดนี้หลัง deploy Apps Script และสร้างฟอร์ม
   ============================================================ */
var API_URL  = 'https://script.google.com/macros/s/AKfycbyxwRKY4eOz-7nXzG7GklqDp9zWpFg3xwwGewIcWdaKrRoecBgtJHo0VFQUtmeTyRKL/exec';   // URL ที่ลงท้ายด้วย /exec จาก PublishSurveyData.gs
var FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSelbkhTs4fx3OrwQxWr1I5ZkSsjf6pGsF8LscQ_SOPxM4Sdcw/viewform';   // ลิงก์ Google Form สำหรับปุ่ม "ตอบแบบสอบถาม"
var LIVE_REFRESH_MS = 60000;   // ความถี่ดึงผลสำรวจใหม่ (มิลลิวินาที)
