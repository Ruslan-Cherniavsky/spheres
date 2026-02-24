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
    infoTitle: string;
    infoBullets: string[];
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
      infoTitle: 'Spheres – How It Works',
      infoBullets: [
        'Every sphere represents a real person who is currently online.',
        'Your Aura reflects how you currently feel.',
        'Karma Rings reflect how others experienced conversations with you.',
        'Fly close to another sphere to request contact.',
        'The other sphere must accept to start a chat.',
        'After the conversation, both participants rate the experience.',
        'No chat history is stored.',
        'Your identity is never shown.',
      ],
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
      infoTitle: 'ספירות – איך זה עובד',
      infoBullets: [
        'כל ספירה מייצגת אדם אמיתי שמחובר כרגע.',
        'האווירה שלך משקפת איך אתה מרגיש כרגע.',
        'טבעות הקרמה משקפות איך אחרים חוו שיחות איתך.',
        'עוף קרוב לספירה אחרת כדי לבקש ליצור קשר.',
        'הספירה השנייה צריכה לאשר כדי להתחיל צ\'אט.',
        'אחרי השיחה, שני המשתתפים מדרגים את החוויה.',
        'היסטוריית הצ\'אט אינה נשמרת.',
        'הזהות שלך לא מוצגת לעולם.',
      ],
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
      infoTitle: 'Сферы – Как это работает',
      infoBullets: [
        'Каждая сфера — это реальный человек, который сейчас в сети.',
        'Аура отражает то, как вы сейчас себя чувствуете.',
        'Кольца кармы отражают, как другие оценили разговоры с вами.',
        'Подлетьте к другой сфере, чтобы предложить контакт.',
        'Cфера должна принять запрос, чтобы начать чат.',
        'После разговора оба участника оценивают опыт.',
        'История чатов не сохраняется.',
        'Ваша личность никогда не раскрывается.',
      ],
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
