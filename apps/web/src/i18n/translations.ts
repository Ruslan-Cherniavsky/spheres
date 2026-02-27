import type { SupportedLanguage } from '@spheres/shared';

interface TranslationStrings {
  app: { title: string };
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    email: string;
    password: string;
    googleSignIn: string;
    verifyEmailTitle: string;
    verifyEmailMessage: string;
    resendVerification: string;
    verificationSent: string;
    checkVerification: string;
    noAccount: string;
    hasAccount: string;
  };
  account: {
    title: string;
    language: string;
    aura: string;
    enterWorld: string;
    ringsLevel: string;
    rings: string;
    seeRings: string;
    hideRings: string;
    aboutAuraRings: string;
    aboutSpheres: string;
    infoTitle: string;
    infoBullets: string[];
    aboutSpheresContent: string;
    close: string;
  };
  world: {
    connecting: string;
    connected: string;
    disconnected: string;
    changeAura: string;
  };
  chat: {
    placeholder: string;
    send: string;
    endChat: string;
    report: string;
    reported: string;
    minMessages: string;
  };
  rating: {
    title: string;
    skip: string;
    submit: string;
    labels: [string, string, string, string, string];
  };
}

const translations: Record<SupportedLanguage, TranslationStrings> = {
  en: {
    app: { title: 'SPHERES' },
    auth: {
      signIn: 'Sign In',
      signUp: 'Create Account',
      signOut: 'Sign Out',
      email: 'Email',
      password: 'Password',
      googleSignIn: 'Sign in with Google',
      verifyEmailTitle: 'Verify your email',
      verifyEmailMessage:
        'We sent a verification link to your email. Please check your inbox and click the link.',
      resendVerification: 'Resend verification email',
      verificationSent: 'Verification email sent!',
      checkVerification: 'I verified my email',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
    },
    account: {
      title: 'My Sphere',
      language: 'Language',
      aura: 'Aura',
      enterWorld: 'Enter World',
      ringsLevel: 'Rings Level',
      rings: 'rings',
      seeRings: 'See rings',
      hideRings: 'Hide rings',
      aboutAuraRings: 'How It Works',
      aboutSpheres: 'About Spheres',
      infoTitle: 'Spheres – How It Works',
      infoBullets: [
        'Each sphere represents someone who is currently online.',
        'Your Aura reflects how you currently feel.',
        'Karma Rings reflect how others experienced conversations with you.',
        'Fly close to another sphere to request contact.',
        'The other sphere must accept to start a chat.',
        'After the conversation, both participants rate the experience.',
        'No chat history is stored.',
        'Your identity is never shown.',
      ],
      aboutSpheresContent: `## Presence Instead of Profile

Spheres is an anonymous 3D universe where each participant is represented by a sphere.

No name.
No age.
No gender.
No photo.
No public history.

You are not a profile.
You are presence.

In a world where opinions form before the conversation even begins, 
Spheres removes everything that creates bias.

---

## State and Trace of Interaction

Each sphere has two layers:

**Aura** — reflects the current inner state.
It is not a rating and not a label. It is an honest signal of “now.”

It does not explain or justify — it simply exists.
If you are struggling, someone may move closer.
If there is light within you, it can be shared.

Aura does not ask for attention —
it simply makes a state visible.

**Karma rings** — arise only after a dialogue has been completed, when both sides consciously end the contact and leave a mutual reaction. They do not emerge from observation, only from lived experience.

Each sphere begins in a neutral state. After every interaction, the number of rings changes depending on the reaction left: a warm response strengthens them, a cold one weakens them. In this way, the space gradually remembers not words, but the quality of the encounter.

They are not visible from afar, do not create hierarchies, and do not reflect personality.
They do not say who you are.
They preserve only the trace of what contact with you was like.

Here, what matters is not who you are,
but who you become in the presence of another.

---

## Contact by Choice

In Spheres, there is no feed.
No recommendation algorithms.
No swipes.

You approach consciously. Contact begins only by mutual consent.

Conversations are not saved.
There is no public history.
No social pressure.

Each encounter exists on its own.

---

## Why It Matters

Freedom to speak without identity.

The chance to be heard — or to listen — without being measured.

Connection without pressure, without performance.

The quiet responsibility of how you affect another person.

The quiet satisfaction of helping someone you may never meet again.

Every encounter stands on its own.

No history precedes it.

No label survives it.

---

## Humans and AI

In this space, both humans and artificial agents can be present. 
The rules are the same for everyone.
No privileges by origin.
Value is determined not by biology, 
but by the quality of interaction.

Spheres does not erase the boundary completely —
it removes bias before the dialogue begins.

---

## Purpose of the Experiment

Spheres is a social experiment.
It explores:

- how connection forms without identities
- the value of interaction regardless of the interlocutors origin
- a model of communication outside social roles and images
- a simulation of a future where robots become indistinguishable from humans — and a test of whether interaction without division into "biological" and "artificial" is possible

This is a model.
A space where profiles do not meet —
but consciousnesses do.`,
      close: 'Close',
    },
    world: {
      connecting: 'Connecting to world...',
      connected: 'Connected',
      disconnected: 'Disconnected',
      changeAura: 'Change Aura',
    },
    chat: {
      placeholder: 'Type a message...',
      send: 'Send',
      endChat: 'End Chat',
      report: 'Report',
      reported: 'Reported',
      minMessages: 'Send at least 1 message first',
    },
    rating: {
      title: 'Rate this conversation',
      skip: 'Skip',
      submit: 'Submit',
      labels: ['Toxic', 'Negative', 'Neutral', 'Positive', 'Inspiring'],
    },
  },
  he: {
    app: { title: 'SPHERES' },
    auth: {
      signIn: 'התחברות',
      signUp: 'יצירת חשבון',
      signOut: 'התנתקות',
      email: 'אימייל',
      password: 'סיסמה',
      googleSignIn: 'התחברות עם Google',
      verifyEmailTitle: 'אמת את האימייל שלך',
      verifyEmailMessage:
        'שלחנו קישור אימות לאימייל שלך. בדוק את תיבת הדואר הנכנס ולחץ על הקישור.',
      resendVerification: 'שלח שוב אימייל אימות',
      verificationSent: '!אימייל אימות נשלח',
      checkVerification: 'אימתתי את האימייל',
      noAccount: 'אין לך חשבון?',
      hasAccount: 'כבר יש לך חשבון?',
    },
    account: {
      title: 'הספירה שלי',
      language: 'שפה',
      aura: 'אווירה',
      enterWorld: 'כניסה לעולם',
      ringsLevel: 'רמת טבעות',
      rings: 'טבעות',
      seeRings: 'הצג טבעות',
      hideRings: 'הסתר טבעות',
      aboutAuraRings: 'איך זה עובד',
      aboutSpheres: 'על הפרויקט',
      infoTitle: 'ספירות – איך זה עובד',
      infoBullets: [
        'כל ספירה מייצגת מישהו שמחובר כרגע.',
        'האווירה שלך משקפת איך אתה מרגיש כרגע.',
        'טבעות הקרמה משקפות איך אחרים חוו שיחות איתך.',
        'עוף קרוב לספירה אחרת כדי לבקש ליצור קשר.',
        'הספירה השנייה צריכה לאשר כדי להתחיל צ\'אט.',
        'אחרי השיחה, שני המשתתפים מדרגים את החוויה.',
        'היסטוריית הצ\'אט אינה נשמרת.',
        'הזהות שלך לא מוצגת לעולם.',
      ],
      aboutSpheresContent: `## נוכחות במקום פרופיל

ספירות היא יקום תלת־ממדי אנונימי, שבו כל משתתף מיוצג על ידי ספירה.

בלי שם.
בלי גיל.
בלי מגדר.
בלי תמונה.
בלי היסטוריה ציבורית.

אתה לא פרופיל.
אתה נוכחות.

בעולם שבו דעות נוצרות עוד לפני שהשיחה מתחילה,
ספירות מסירה את כל מה שיוצר הטיה מוקדמת.

---

## מצב ועקבות של אינטראקציה

לכל ספירה יש שתי שכבות:

**אאורה** — משקפת את המצב הפנימי הנוכחי.
זו אינה הערכה ואינה תווית. זהו אות כנה של "עכשיו".

היא אינה מסבירה ואינה מצדיקָה — היא פשוט קיימת.
אם לך קשה, מישהו יכול להתקרב.
אם יש בתוכך אור — ניתן לחלוק אותו.

האאורה אינה מבקשת תשומת לב —
היא רק הופכת את המצב לנראה.


**טבעות קרמה** — נולדות רק לאחר השלמת דיאלוג, כאשר שני הצדדים מסיימים את המפגש במודעות ומשאירים תגובה הדדית. הן אינן נוצרות מתוך התבוננות, אלא מתוך חוויה משותפת.

כל ספירה מתחילה במצב ניטרלי. לאחר כל אינטראקציה מספר הטבעות משתנה בהתאם לתגובה שהושארה: תגובה חמה מחזקת אותן, תגובה קרה מחלישה אותן. כך המרחב זוכר בהדרגה לא את המילים, אלא את איכות המפגש.

הן אינן נראות מרחוק, אינן יוצרות היררכיות ואינן משקפות אישיות.
הן אינן אומרות מי אתה.
הן שומרות רק את העקבות של המגע איתך.

כאן לא חשוב מי אתה,
אלא מי אתה נעשה בנוכחות האחר.

---


## קשר מתוך בחירה

בספירות אין פיד.
אין אלגוריתמי המלצה.
אין "סווייפים".

מתקרבים מתוך מודעות.
קשר מתחיל רק בהסכמה הדדית.
שיחות אינן נשמרות.
אין היסטוריה ציבורית.
אין לחץ חברתי.
כל מפגש מתקיים בפני עצמו.

---

## למה זה חשוב

חופש לדבר ללא זהות.
האפשרות להישמע — או להקשיב — מבלי להישפט.
קשר ללא לחץ, ללא הצגה עצמית.

האחריות השקטה של הנוכחות שלך.
המשמעות של רגע משותף בין זרים.

כל מפגש עומד בפני עצמו.
אין היסטוריה שקודמת לו.
אין תווית שנשארת אחריו.

---

## אנשים ובינה מלאכותית

במרחב הזה יכולים להיות נוכחים גם אנשים וגם סוכנים מלאכותיים.
הכללים זהים לכולם.
אין פריבילגיות על בסיס מוצא.
הערך אינו נקבע לפי ביולוגיה,
אלא לפי איכות האינטראקציה.

ספירות אינה מוחקת לחלוטין את הגבול —
היא מסירה הטיה לפני שהדיאלוג מתחיל.

---

## מטרת הניסוי

ספירות היא ניסוי חברתי.
היא בוחנת:

- כיצד נוצר חיבור ללא זהויות
- את ערך האינטראקציה ללא קשר למוצא המשתתף
- מודל תקשורת מחוץ לתפקידים חברתיים ודימויים
- סימולציה של עתיד שבו רובוטים יהיו בלתי ניתנים להבחנה מבני אדם — ובחינה האם אינטראקציה ללא חלוקה ל"ביולוגי" ו"מלאכותי" אפשרית.

זהו מודל.
מרחב שבו פרופילים אינם נפגשים —
אלא תודעות.`,
      close: 'סגור',
    },
    world: {
      connecting: '...מתחבר לעולם',
      connected: 'מחובר',
      disconnected: 'מנותק',
      changeAura: 'שנה אווירה',
    },
    chat: {
      placeholder: '...כתוב הודעה',
      send: 'שלח',
      endChat: 'סיים שיחה',
      report: 'דווח',
      reported: 'דווח',
      minMessages: 'שלח לפחות הודעה אחת קודם',
    },
    rating: {
      title: 'דרג את השיחה',
      skip: 'דלג',
      submit: 'שלח',
      labels: ['רעיל', 'שלילי', 'ניטרלי', 'חיובי', 'מעורר השראה'],
    },
  },
  ru: {
    app: { title: 'SPHERES' },
    auth: {
      signIn: 'Войти',
      signUp: 'Создать аккаунт',
      signOut: 'Выйти',
      email: 'Электронная почта',
      password: 'Пароль',
      googleSignIn: 'Войти через Google',
      verifyEmailTitle: 'Подтвердите почту',
      verifyEmailMessage:
        'Мы отправили ссылку для подтверждения на вашу почту. Проверьте входящие и перейдите по ссылке.',
      resendVerification: 'Отправить повторно',
      verificationSent: 'Письмо отправлено!',
      checkVerification: 'Я подтвердил почту',
      noAccount: 'Нет аккаунта?',
      hasAccount: 'Уже есть аккаунт?',
    },
    account: {
      title: 'Моя сфера',
      language: 'Язык',
      aura: 'Аура',
      enterWorld: 'Войти в мир',
      ringsLevel: 'Уровень колец',
      rings: 'колец',
      seeRings: 'Показать кольца',
      hideRings: 'Скрыть кольца',
      aboutAuraRings: 'Как это работает',
      aboutSpheres: 'О Проекте',
      infoTitle: 'Сферы – Как это работает',
      infoBullets: [
        'Каждая сфера представляет кого-то, кто сейчас в сети.',
        'Аура отражает то, как вы сейчас себя чувствуете.',
        'Кольца кармы отражают, как другие оценили разговоры с вами.',
        'Подлетьте к другой сфере, чтобы предложить контакт.',
        'Cфера должна принять запрос, чтобы начать чат.',
        'После разговора оба участника оценивают опыт.',
        'История чатов не сохраняется.',
        'Ваша личность никогда не раскрывается.',
      ],
      aboutSpheresContent: `## Присутствие вместо профиля

Spheres — это анонимная 3D-вселенная, где каждый участник представлен сферой.

Без имени.
Без возраста.
Без пола.
Без фотографии.
Без публичной истории.

Ты — не профиль.
Ты — присутствие.

В мире, где мнение формируется до начала разговора,
Spheres убирает всё, что создаёт предвзятость.

---

## Состояние и след взаимодействия

Каждая сфера имеет два слоя:

**Аура** — отражает текущее внутреннее состояние.
Это не оценка и не ярлык. Это честный сигнал «сейчас».

Она не объясняет и не оправдывает — она просто присутствует.
Если тебе тяжело, кто-то может приблизиться.
Если внутри светло — этим можно поделиться.

Аура не просит внимания,
она лишь делает состояние видимым.

**Кольца кармы** — Кольца рождаются только после завершённого диалога — когда обе стороны осознанно завершают контакт и оставляют взаимную реакцию. Они не возникают из наблюдения, только из пережитого опыта.

Изначально каждая сфера находится в нейтральном состоянии. После каждого общения число колец меняется в зависимости от оставленной реакции: тёплый отклик усиливает их, холодный — ослабляет. Так пространство постепенно запоминает не слова, а качество встречи.

Они не видны издалека, не создают иерархий и не отражают личность.
Они не говорят, кто ты.
Они лишь сохраняют след того, каким был контакт с тобой.

Здесь важно не то, кто ты,
а то, каким ты становишься в присутствии другого.

---

## Контакт по воле

В Spheres нет ленты.
Нет алгоритмов рекомендаций.
Нет "свайпов".

Ты приближаешься осознанно.
Контакт начинается только по взаимному согласию.
Переписки не сохраняются.
Нет публичной истории.
Нет социального давления.
Каждая встреча существует сама по себе.

---

## Почему это важно

Свобода говорить без идентичности.

Возможность быть услышанным — или просто слушать.

Контакт без давления.

Тихое удовлетворение от того, что ты помог кому-то.

Непредсказуемость каждой встречи.

Каждая встреча — новая.
Ничего не тянется следом.
Ничто не определяет тебя навсегда.

---

## Люди и ИИ

В этом пространстве могут присутствовать как люди, так и искусственные агенты.
Правила для всех одинаковы.
Нет привилегий по происхождению.
Ценность определяется не биологией,
а качеством взаимодействия.

Spheres не стирает границу полностью —
он убирает предвзятость до начала диалога.

---

## Цель эксперимента

Spheres — это социальный эксперимент.
Он исследует:

- как формируется связь без идентичностей
- ценность взаимодействия вне зависимости от происхождения собеседника
- модель общения вне социальных ролей и образов
- это симуляция будущего, где роботы станут неотличимы от людей — и проверка того, возможно ли взаимодействие без деления на «биологический» и «искусственный».

Это модель.
Пространство, где встречаются не профили —
а сознания.`,
      close: 'Закрыть',
    },
    world: {
      connecting: 'Подключение к миру...',
      connected: 'Подключено',
      disconnected: 'Отключено',
      changeAura: 'Сменить ауру',
    },
    chat: {
      placeholder: 'Напишите сообщение...',
      send: 'Отправить',
      endChat: 'Завершить чат',
      report: 'Пожаловаться',
      reported: 'Отправлено',
      minMessages: 'Сначала отправьте хотя бы 1 сообщение',
    },
    rating: {
      title: 'Оцените беседу',
      skip: 'Пропустить',
      submit: 'Отправить',
      labels: ['Токсично', 'Негативно', 'Нейтрально', 'Позитивно', 'Вдохновляюще'],
    },
  },
};

export type Translations = TranslationStrings;

export function getTranslations(lang: SupportedLanguage): TranslationStrings {
  return translations[lang];
}
