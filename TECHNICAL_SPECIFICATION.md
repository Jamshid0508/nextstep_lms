
# TEXNIK HUJJAT (TZ) — NEXT STEP O'QUV MARKAZI CRM + LMS TIZIMI

## 0. HUJJAT HAQIDA

- **Holat:** Loyiha (draft) — birinchi to'liq versiya. Ishlab chiqish davomida to'ldiriladi/aniqlashtiriladi.
- **Asos:** Ushbu TZ mavjud `edu.itcenterqamashi` (IT Center Qamashi) loyihasidan CRM negizi (arxitektura, modellar, RBAC yondashuvi) sifatida foydalanadi va ustiga **Next Step** uchun yangi LMS modullarini (uy vazifa, test, talaba/ota-ona portali) qo'shadi.
- **Til:** Interfeys — o'zbek tili (asosiy). Kodda inglizcha nomlash (o'sha loyihadagi kabi).

---

## 1. LOYIHA HAQIDA

| | |
|---|---|
| **Loyiha nomi** | Next Step — O'quv Markazi Boshqaruv va Ta'lim Tizimi |
| **Versiya** | 1.0.0 (MVP) |
| **Arxitektura** | MERN Stack (MongoDB + Express + React + Node.js) + TypeScript |
| **UI Library** | Ant Design |
| **Maqsad** | Bitta tizimda ham o'quv markazni operatsion boshqarish (CRM), ham talabalarga haqiqiy ta'lim xizmati (uy vazifa, test, progress) taqdim etish |

### MVP qamroviga KIRADI
- To'liq CRM: filiallar, kurslar, guruhlar, dars jadvali, davomat, to'lovlar (qo'lda qayd), moliya, audit log, sozlamalar
- RBAC: SUPER_ADMIN, ADMIN, TEACHER, STUDENT, PARENT
- **Uy vazifasi (Homework)** moduli — o'qituvchi beradi, talaba topshiradi, o'qituvchi baholaydi
- **Test/Quiz** moduli — o'qituvchi yaratadi, talaba yechadi, avtomatik ballash
- **Talaba portali** — jadval, davomat, uy vazifa, test, baholar, to'lov tarixi (faqat ko'rish)
- **Ota-ona portali** — farzandi(lari) bo'yicha davomat, uy vazifa/test natijalari, to'lov holati
- Ichki (in-app) bildirishnomalar

### MVP qamroviga KIRMAYDI (keyingi fazalar — pastda 13-bo'limda)
- Onlayn to'lov integratsiyasi (Payme/Click) — hozircha to'lovlar qo'lda qayd qilinadi
- Video darslar / kurs kontenti
- Mobil ilova (native) — faqat responsive web
- SMS / Telegram bot xabarnomalari
- Sertifikat generatsiyasi
- Ko'p tillilik (UZ/RU/EN)

---

## 2. ARXITEKTURA VA TEXNOLOGIYALAR

Reference loyihadagi stack asos qilib olinadi (kod va patternlarni qayta ishlatish uchun):

### Backend
- Node.js + Express
- MongoDB + Mongoose (ODM)
- JWT (access + refresh token) autentifikatsiya
- bcryptjs — parol hashing
- Zod — validatsiya
- helmet, express-rate-limit, CORS — xavfsizlik
- Multer + **Cloudinary** (yoki S3-compatible storage) — uy vazifasi fayllarini yuklash uchun (Vercel kabi serverless muhitda diskka doimiy yozib bo'lmaydi, shuning uchun tashqi storage kerak)

### Frontend
- React + Vite + TypeScript
- Ant Design — UI komponentlar
- React Router DOM — routing (rol asosida alohida route guruhlari: `/admin`, `/teacher`, `/student`, `/parent`)
- Axios — HTTP client
- dayjs — sana/vaqt
- xlsx — Excel import/export (foydalanuvchilar uchun, reference loyihadagidek)

### Loyiha tuzilmasi (yuqori daraja)
```
next-step/
├── client/          # React + Vite + TS (barcha rollar uchun bitta SPA, role-based routing)
│   └── src/
│       ├── pages/
│       │   ├── admin/        # SUPER_ADMIN, ADMIN sahifalari (reference'dagi kabi)
│       │   ├── teacher/      # + Homework, Quiz boshqaruvi
│       │   ├── student/      # YANGI: Student portali
│       │   └── parent/       # YANGI: Ota-ona portali
├── server/
│   └── src/
│       ├── models/           # User, Branch, Course, Group, Schedule, Attendance,
│       │                     # Payment, FinanceSection, AuditLog, Setting,
│       │                     # + YANGI: Homework, HomeworkSubmission, Quiz,
│       │                     #          QuizAttempt, ParentChild, Notification
│       ├── controllers/{superadmin,teacher,student,parent}/
│       └── routes/{superadmin,teacher,student,parent}/
```

> **Amaliy tavsiya:** Reference loyihadagi `server/src` va `client/src` tuzilmasi, middleware'lari (auth, rbac, validate, error) va CRUD patternlari to'g'ridan-to'g'ri boshlang'ich nuqta (starting point) sifatida ko'chirib olinishi mumkin — bu development vaqtini sezilarli qisqartiradi.

---

## 3. FOYDALANUVCHI ROLLARI (RBAC)

| Rol | Qamrov | Yangi huquqlar (Next Step'da) |
|---|---|---|
| **SUPER_ADMIN** | Tizim bo'yicha to'liq | Ota-onalarni farzandlarga biriktirish/ajratish |
| **ADMIN** | Filial darajasida | O'zgarishsiz (reference'dagi kabi) |
| **TEACHER** | Faqat o'z guruhlari | **YANGI:** Uy vazifasi yaratish/baholash, Test yaratish/natijalarni ko'rish |
| **STUDENT** | Faqat o'z ma'lumotlari | **YANGI:** Uy vazifa topshirish, Test yechish, baholarini ko'rish |
| **PARENT** (yangi rol) | Faqat bog'langan farzand(lar)i | Farzandining davomati, uy vazifa/test natijalari, to'lov holatini ko'rish (faqat o'qish huquqi) |

**Muhim qoida:** PARENT roli hech qachon boshqa talabaning ma'lumotini ko'ra olmaydi — bu `ParentChild` bog'lanish jadvali orqali har bir so'rovda tekshiriladi (middleware darajasida).

---

## 4. MA'LUMOTLAR BAZASI MODELLARI

### 4.1 Reference'dan olinadigan modellar (deyarli o'zgarishsiz)
`User`, `Branch`, `Course`, `Group`, `Schedule`, `Attendance`, `Payment`, `FinanceSection`, `AuditLog`, `Setting`, `RefreshToken` — reference loyihadagi struktura bilan bir xil (qarang: mavjud `edu.itcenterqamashi` loyihasi).

**Farq:** `User.role` enumiga `PARENT` qo'shiladi:
```javascript
role: Enum  // SUPER_ADMIN | ADMIN | TEACHER | STUDENT | PARENT
```

### 4.2 YANGI modellar

**Homework (Uy vazifasi)**
```javascript
{
  _id: ObjectId,
  groupId: ObjectId,          // Guruh (ref: Group)
  teacherId: ObjectId,        // O'qituvchi (ref: User)
  title: String,
  description: String,
  attachments: [{ name: String, url: String }],
  assignedDate: Date,
  dueDate: Date,
  maxScore: Number,           // masalan 100
  status: Enum,               // active | closed
  createdAt: Date,
  updatedAt: Date
}
```

**HomeworkSubmission (Topshirilgan vazifa)**
```javascript
{
  _id: ObjectId,
  homeworkId: ObjectId,       // ref: Homework
  studentId: ObjectId,        // ref: User
  submissionText: String,
  attachments: [{ name: String, url: String }],
  submittedAt: Date,
  isLate: Boolean,
  score: Number,
  feedback: String,
  status: Enum,               // not_submitted | submitted | graded | late
  gradedBy: ObjectId,         // ref: User (teacher)
  gradedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Quiz (Test)**
```javascript
{
  _id: ObjectId,
  groupId: ObjectId,          // ref: Group
  teacherId: ObjectId,        // ref: User
  title: String,
  description: String,
  questions: [{
    text: String,
    type: Enum,               // single | multiple | true_false | short_answer
    options: [String],
    correctAnswers: [Number], // variant indexlari
    points: Number
  }],
  timeLimitMinutes: Number,
  availableFrom: Date,
  availableTo: Date,
  attemptsAllowed: Number,    // default: 1
  status: Enum,               // draft | published | closed
  createdAt: Date,
  updatedAt: Date
}
```

**QuizAttempt (Test urinishi)**
```javascript
{
  _id: ObjectId,
  quizId: ObjectId,           // ref: Quiz
  studentId: ObjectId,        // ref: User
  answers: [{
    questionIndex: Number,
    selectedOptions: [Number],
    textAnswer: String        // short_answer uchun
  }],
  score: Number,
  maxScore: Number,
  startedAt: Date,
  submittedAt: Date,
  status: Enum,               // in_progress | submitted | graded
  createdAt: Date,
  updatedAt: Date
}
```

**ParentChild (Ota-ona — Farzand bog'lanishi)**
```javascript
{
  _id: ObjectId,
  parentId: ObjectId,         // ref: User (role=PARENT)
  studentId: ObjectId,        // ref: User (role=STUDENT)
  relationship: Enum,         // father | mother | guardian
  createdBy: ObjectId,        // ref: User (kim biriktirgan)
  createdAt: Date
}
```

**Notification (Bildirishnoma)**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // kimga (ref: User)
  type: Enum,                 // HOMEWORK_ASSIGNED | HOMEWORK_GRADED | QUIZ_ASSIGNED
                               // | QUIZ_GRADED | PAYMENT_DUE | ATTENDANCE_MARKED | GENERAL
  title: String,
  message: String,
  relatedEntityType: String,
  relatedEntityId: ObjectId,
  isRead: Boolean,
  createdAt: Date
}
```

---

## 5. API ENDPOINTS (Yangi qo'shiladiganlar)

Base URL: `/api/v1` (reference'dagi javob formati bilan bir xil: `{ success, data }` / `{ success:false, error }`)

### Super Admin — Ota-ona bog'lash
```
POST   /superadmin/parents/:parentId/link-child          # Farzand biriktirish
DELETE /superadmin/parents/:parentId/unlink-child/:studentId
GET    /superadmin/parents/:parentId/children
```

### Teacher — Uy vazifasi
```
GET    /teacher/homeworks
POST   /teacher/homeworks
GET    /teacher/homeworks/:id
PATCH  /teacher/homeworks/:id
DELETE /teacher/homeworks/:id
GET    /teacher/homeworks/:id/submissions
PATCH  /teacher/homeworks/:id/submissions/:submissionId   # Baholash (score, feedback)
```

### Teacher — Test
```
GET    /teacher/quizzes
POST   /teacher/quizzes
GET    /teacher/quizzes/:id
PATCH  /teacher/quizzes/:id
DELETE /teacher/quizzes/:id
PATCH  /teacher/quizzes/:id/publish
GET    /teacher/quizzes/:id/attempts
PATCH  /teacher/quizzes/:id/attempts/:attemptId           # short_answer uchun qo'lda baholash
```

### Student
```
GET    /student/dashboard
GET    /student/schedules
GET    /student/attendance
GET    /student/homeworks
POST   /student/homeworks/:id/submit
GET    /student/quizzes
POST   /student/quizzes/:id/start
POST   /student/quizzes/:id/submit
GET    /student/grades
GET    /student/payments                                  # faqat ko'rish
GET    /student/notifications
PATCH  /student/notifications/:id/read
```

### Parent
```
GET    /parent/children
GET    /parent/children/:studentId/dashboard
GET    /parent/children/:studentId/attendance
GET    /parent/children/:studentId/homeworks
GET    /parent/children/:studentId/grades
GET    /parent/children/:studentId/payments
GET    /parent/notifications
PATCH  /parent/notifications/:id/read
```

> Barcha `/parent/children/:studentId/*` endpointlarida middleware `ParentChild` jadvalidan tekshirib, faqat bog'langan `studentId` uchun ruxsat beradi (403 aks holda).

---

## 6. FRONTEND SAHIFALAR

### Mavjud (reference'dan moslashtiriladi)
Dashboard, Users, Branches, Courses, Groups, Schedules (5 ko'rinish), Attendance, Payments, Finance, Audit Logs, Settings, Teacher Dashboard/Schedule/Salary.

### YANGI — Teacher paneli
| Sahifa | Route | Funksiya |
|---|---|---|
| Uy vazifalari | `/teacher/homeworks` | Guruh bo'yicha vazifa yaratish, tahrirlash, topshirilganlarni ko'rish, baholash |
| Testlar | `/teacher/quizzes` | Savol konstruktori (single/multiple/true-false/short-answer), test nashr qilish, natijalarni ko'rish |

### YANGI — Talaba portali (`/student`)
| Sahifa | Funksiya |
|---|---|
| Dashboard | Bugungi darslar, yaqinlashayotgan muddatlar (vazifa/test), umumiy progress |
| Jadval | O'z dars jadvali (faqat ko'rish) |
| Davomat | Davomat tarixi va foizi |
| Uy vazifalari | Ro'yxat (holat: topshirilmagan/topshirilgan/baholangan), topshirish formasi (matn + fayl) |
| Testlar | Ro'yxat, testni boshlash (timer bilan), natija |
| Baholar | Uy vazifa + test baholari, umumiy o'zlashtirish % |
| To'lovlar | To'lov tarixi (faqat ko'rish) |

### YANGI — Ota-ona portali (`/parent`)
| Sahifa | Funksiya |
|---|---|
| Dashboard | Bir nechta farzand bo'lsa — tanlash; tanlangan farzand bo'yicha umumiy holat |
| Davomat | Farzandining davomati |
| Uy vazifa / Test | Farzandining topshirgan vazifalari va test natijalari |
| To'lovlar | Farzandi uchun to'lov holati (qarzdorlik, tarix) |

### Umumiy
- **Bildirishnoma qo'ng'irog'i (notification bell)** — AppShell headerida, barcha rollar uchun (TEACHER/STUDENT/PARENT), o'qilmagan sonini ko'rsatadi.
- Student/Parent portal layout — soddalashtirilgan, mobil-birinchi (card-based), chunki bu foydalanuvchilar texnik jihatdan kamroq tayyor bo'lishi mumkin.

---

## 7. BAHOLASH VA PROGRESS TIZIMI

- **Uy vazifasi bahosi:** o'qituvchi `score` (0–maxScore) va `feedback` kiritadi.
- **Test bahosi:** `single`/`multiple`/`true_false` — avtomatik hisoblanadi; `short_answer` — o'qituvchi qo'lda tasdiqlaydi/ballaydi.
- **Umumiy o'zlashtirish (%)** — har bir talaba uchun guruh kesimida: uy vazifalar o'rtacha bali va testlar o'rtacha balining oddiy o'rtachasi sifatida hisoblanadi (MVP uchun sodda formula; kelajakda og'irlik koeffitsientlari sozlanishi mumkin).
- Talaba/ota-ona portalida progress **progress bar** va oxirgi 5 ta baho ko'rinishida ko'rsatiladi.

---

## 8. BILDIRISHNOMALAR (In-app Notifications)

| Trigger | Kimga | Type |
|---|---|---|
| Yangi uy vazifasi berildi | Guruhdagi barcha talabalar | HOMEWORK_ASSIGNED |
| Uy vazifasi baholandi | Talaba (+ agar bog'langan bo'lsa, ota-ona) | HOMEWORK_GRADED |
| Yangi test nashr qilindi | Guruhdagi barcha talabalar | QUIZ_ASSIGNED |
| Test natijasi tayyor | Talaba (+ ota-ona) | QUIZ_GRADED |
| Davomat belgilandi (absent/late) | Ota-ona | ATTENDANCE_MARKED |
| To'lov muddati yaqinlashmoqda/o'tib ketdi | Talaba + ota-ona | PAYMENT_DUE |

Xabarnomalar faqat **tizim ichida** (bell icon + ro'yxat) ko'rsatiladi — SMS/Telegram/Email integratsiyasi Phase 2'da.

---

## 9. XAVFSIZLIK

Reference loyihadagi asoslar saqlanadi (JWT access+refresh, bcrypt, helmet, rate-limit, CORS, audit log) + qo'shimcha:

- **Ma'lumot izolyatsiyasi:** STUDENT faqat o'ziga tegishli homework/quiz/attendance/payment ko'radi; PARENT faqat `ParentChild` orqali bog'langan talaba(lar) ma'lumotini ko'radi — har bir endpointda middleware darajasida tekshiriladi.
- **Fayl yuklash (homework attachments):** ruxsat etilgan formatlar (pdf, doc/docx, jpg, png), maksimal hajm (masalan 10MB), tashqi storage (Cloudinary/S3) orqali — zararli fayl turlarini rad etish.
- **Test xavfsizligi (anti-cheat, MVP darajasida):** har bir talaba uchun bitta faol urinish (`attemptsAllowed`), vaqt tugagach avtomatik yuborish, testni faqat `availableFrom`–`availableTo` oralig'ida boshlash mumkin.

---

## 10. NOFUNKSIONAL TALABLAR

- **Server:** Node.js 18+, MongoDB 5.0+
- **Brauzer:** Chrome/Firefox/Safari/Edge (oxirgi 2 versiya)
- **Responsive:** Desktop / Tablet / Mobile (student va parent portali uchun ayniqsa muhim)
- **Zaxira nusxa (backup):** MongoDB Atlas avtomatik backup (yoki kunlik dump)
- **Kengaytiriluvchanlik:** Bir nechta filialga (branch) mo'ljallangan arxitektura (reference'dagi kabi)

---

## 11. ISHLAB CHIQISH BOSQICHLARI (MVP Roadmap)

| Bosqich | Qamrov |
|---|---|
| **M0 — Skeleton** | Loyiha tuzilmasi (client+server), auth, RBAC middleware, DB ulanish — reference loyiha patternlari asosida |
| **M1 — CRM Core** | Users, Branches, Courses, Groups, Schedules, Attendance, Payments, Finance, Audit Log, Settings, Dashboard |
| **M2 — Homework** | Teacher: yaratish/baholash; Student: ko'rish/topshirish |
| **M3 — Quiz** | Teacher: konstruktor/nashr; Student: yechish; avtomatik ballash |
| **M4 — Portallar** | Student portal, Parent portal, ParentChild bog'lash, in-app bildirishnomalar |
| **M5 — Sinov va ishga tushirish** | QA, xatolarni tuzatish, deployment, real ma'lumotlar bilan sinov |

### Phase 2 (MVP'dan keyin, kelajak rejalar)
- Onlayn to'lov integratsiyasi (Payme/Click)
- Video darslar / kurs kontenti moduli
- Mobil ilova (React Native) yoki PWA
- SMS/Telegram bot xabarnomalari
- Sertifikat generatsiyasi (PDF)
- Ko'p tillilik (UZ/RU/EN), dark mode

---

## 12. QABUL QILISH MEZONLARI (Definition of Done — MVP)

- [ ] SUPER_ADMIN/ADMIN CRM'ning barcha bo'limlarini (filial, kurs, guruh, jadval, davomat, to'lov, moliya) to'liq boshqara oladi
- [ ] TEACHER o'z guruhlariga uy vazifasi va test bera oladi, natijalarni baholay oladi
- [ ] STUDENT o'ziga tegishli vazifa/testni ko'rib, topshira/yecha oladi va baholarini ko'radi
- [ ] PARENT faqat bog'langan farzand(lar)ining ma'lumotini ko'radi, boshqasini ko'ra olmaydi (tekshirilgan)
- [ ] Barcha rollar uchun bildirishnoma tizimi ishlaydi
- [ ] Fayl yuklash xavfsiz cheklovlar bilan ishlaydi
- [ ] Responsive dizayn — mobil qurilmada student/parent portali qulay ishlaydi

---

## 13. OCHIQ SAVOLLAR (keyingi suhbatda aniqlashtirish uchun)

- Deployment: reference'dagi kabi Vercel (backend) + Netlify (frontend) ishlatiladimi, yoki boshqa hosting?
- Fayl storage provayderi: Cloudinary, AWS S3 yoki boshqa? (hisob ma'lumotlari kerak bo'ladi)
- Next Step uchun boshlang'ich ma'lumotlar: filiallar soni, kurslar ro'yxati, narxlar — mavjudmi?
- ~~Brending: logo, rang sxemasi~~ ✅ **Hal qilindi** — foydalanuvchi taqdim etgan logo asosida blue→teal→green gradient brend identifikatsiyasi tanlandi va kodga tatbiq etildi (14-bo'limga qarang).

---

## 14. AMALGA OSHIRISH HOLATI

**M0 (skeleton) — bajarildi (2026-08-01):**

- Repo tuzilmasi: `client/` (Vite+React+TS+AntD) va `server/` (Express+Mongoose) — reference loyihadan noldan, bir xil patternlar bilan yozildi (fork emas)
- Server: barcha 16 model, JWT auth (access+refresh), RBAC middleware, SUPER_ADMIN avto-seed, dashboard summary endpoint — MongoDB'ga ulanib, login oqimi uchtan-uchga sinovdan o'tdi
- Client: brend logotipi (SVG, `Logo.tsx` komponenti — gradient ikonka + wordmark, light/dark variant), AntD tema tokenlari (`theme/brand.ts`), Login sahifasi, rol asosidagi sidebar navigatsiyasi (`config/nav.tsx`), Dashboard (jonli statistikalar bilan), qolgan bo'limlar uchun "tez orada" placeholder sahifalar
- Brauzerda (Playwright orqali) tekshirildi: login → JWT → dashboard, konsolda xatolik yo'q

**Keyingi navbat:** M1 (CRM CRUD sahifalari: Users, Branches, Courses, Groups, Schedules, Attendance, Payments, Finance, Audit Log, Settings) — 11-bo'limdagi roadmap bo'yicha.

---

**Hujjat yaratildi:** 2026-08-01
**Versiya:** 1.1.0 (M0 bajarildi)
