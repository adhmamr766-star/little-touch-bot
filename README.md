# Little Touch — Order → Telegram relay

سيرفر صغير بيستقبل بيانات الطلب من الموقع (الاسم، المنتج، العنوان، رقم الموبايل...) من غير أي بيانات بطاقة، ويبعتها كرسالة لبوت تيليجرام.

## 1. اعملي بوت تيليجرام
1. افتحي شات مع **@BotFather** في تيليجرام.
2. ابعتي `/newbot` واتبعي التعليمات (اسم البوت + username ينتهي بـ `bot`).
3. هيديكي **Token** شكله `123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` — ده الـ `TELEGRAM_BOT_TOKEN`.

## 2. اجيبي الـ Chat ID
1. ابعتي أي رسالة للبوت بتاعك (أو ضيفيه لجروب وابعتي فيه رسالة).
2. افتحي في المتصفح:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. هتلاقي `"chat":{"id": 123456789, ...}` — الرقم ده هو `TELEGRAM_CHAT_ID`.

## 3. شغّلي السيرفر محلي (اختياري للتجربة)
```bash
cp .env.example .env
# افتحي .env وحطي TOKEN و CHAT_ID اللي جبتيهم
npm install
npm start
```
هيشتغل على `http://localhost:3000/order`.

## 4. ارفعيه على استضافة مجانية (Render مثلاً)
1. ارفعي المجلد ده كـ repo على GitHub.
2. ادخلي [render.com](https://render.com) → New → Web Service → اختاري الـ repo.
3. Build command: `npm install` — Start command: `npm start`.
4. في Environment، ضيفي نفس المتغيرات اللي في `.env.example` (TOKEN, CHAT_ID, SHARED_SECRET, ALLOWED_ORIGIN = رابط موقعك).
5. بعد الـ deploy هتاخدي رابط زي: `https://your-service.onrender.com`

رابط الطلب النهائي هيبقى: `https://your-service.onrender.com/order`

## 5. وصّليه بالموقع
ابعتيلي الرابط ده، وأنا أضيفه لصفحة الطلب في الموقع عشان أي طلب يتبعت تلقائي للبوت.

## ملاحظات أمان
- السيرفر ده **مبيستقبلش ولا بيلمس بيانات بطاقات بنكية خالص** — دي لازم تعدي بس على بوابة دفع حقيقية (Telr, PayTabs...).
- `SHARED_SECRET` بيمنع أي حد تاني غير موقعك إنه يبعت طلبات وهمية للبوت.
- Render المجاني بينام لو مفيش استخدام لفترة، فأول طلب بعد فترة سكون ممكن ياخد كذا ثانية إضافية.
