/**
 * DIVA Admin — Complete Seed Script
 *
 * Populates DIVA Admin's database (localhost:5432) with ALL content from the frontend.
 * Run: cd admin && npx tsx seed-complete.ts
 */

import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';
import {
  services, teamMembers, faqs, reviews, videos,
  siteStatistics, trustPillars, navigationItems,
  socialLinks, announcements, articles, caseStudies,
  districtStats, partners
} from './src/lib/schema';

async function seed() {
  console.log('🌱 Starting DIVA Admin seed...\n');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await db.delete(partners);
  await db.delete(announcements);
  await db.delete(articles);
  await db.delete(caseStudies);
  await db.delete(reviews);
  await db.delete(videos);
  await db.delete(faqs);
  await db.delete(teamMembers);
  await db.delete(siteStatistics);
  await db.delete(trustPillars);
  await db.delete(navigationItems);
  await db.delete(socialLinks);
  await db.delete(services);
  await db.delete(districtStats);
  console.log('✅ Data cleared\n');

  // ============================================
  // SERVICES (6 services)
  // ============================================
  console.log('📦 Seeding services...');
  await db.insert(services).values([
    {
      title: 'Бухгалтерия для АУСН',
      slug: 'ausn',
      taxSystem: 'АУСН',
      basePrice: 5900,
      includes: [
        'Ведение бухгалтерского учёта',
        'Сдача отчётности',
        'Расчёт налогов',
        'Консультации по АУСН',
        'Оптимизация налогов'
      ],
      targetAudience: 'Самозанятые и ИП на АУСН',
      isHighlighted: true,
      sortOrder: 1,
    },
    {
      title: 'Бухгалтерия для УСН',
      slug: 'usn',
      taxSystem: 'УСН',
      basePrice: 7900,
      includes: [
        'Ведение бухгалтерского учёта',
        'Сдача отчётности (ИП, ООО)',
        'Расчёт УСН',
        'Подготовка платёжек',
        'Кадровый учёт (до 5 человек)'
      ],
      targetAudience: 'ИП и ООО на УСН',
      isHighlighted: true,
      sortOrder: 2,
    },
    {
      title: 'Бухгалтерия для ОСН',
      slug: 'osn',
      taxSystem: 'ОСН',
      basePrice: 8900,
      includes: [
        'Ведение полного бухучёта',
        'Сдача всей отчётности',
        'Расчёт НДС, налога на прибыль',
        'Работа с ЭДО',
        'Подготовка деклараций'
      ],
      targetAudience: 'ООО на общей системе',
      isHighlighted: true,
      sortOrder: 3,
    },
    {
      title: 'Бухгалтерия для стартапов ФСИ',
      slug: 'fsi',
      taxSystem: 'ФСИ',
      basePrice: 35000,
      includes: [
        'Подготовка договора с ФСИ',
        'Подготовка финансового отчёта',
        'Оформление технического отчёта',
        'Разработка бизнес-плана',
        'Заполнение отчёта о развитии стартапа',
        'Подготовка карты РИД',
        'Исправление отчётов'
      ],
      targetAudience: 'Стартапы, получающие гранты Фонда содействия инновациям',
      isHighlighted: true,
      sortOrder: 4,
    },
    {
      title: 'Разовое бухгалтерское обслуживание',
      slug: 'once',
      taxSystem: 'Любая',
      basePrice: null,
      includes: [
        'Восстановление учёта',
        'Разовая сдача отчётности',
        'Нулевая отчётность',
        'Подготовка декларации 3-НДФЛ'
      ],
      targetAudience: 'Компании с разовыми задачами',
      isHighlighted: false,
      sortOrder: 5,
    },
    {
      title: 'Юридические услуги',
      slug: 'legal',
      taxSystem: 'Любая',
      basePrice: null,
      includes: [
        'Регистрация ООО и ИП',
        'Ликвидация и банкротство',
        'Корпоративное право',
        'Договорное право',
        'Представительство в суде'
      ],
      targetAudience: 'Компании и ИП, нуждающиеся в юридической поддержке',
      isHighlighted: false,
      sortOrder: 6,
    },
  ]);
  console.log('✅ 6 services seeded\n');

  // ============================================
  // TEAM MEMBERS (12 members)
  // ============================================
  console.log('👥 Seeding team members...');
  await db.insert(teamMembers).values([
    {
      fullName: 'Павел Бантьев',
      position: 'Основатель и директор',
      bio: 'Основатель и директор ДИВА. 5 лет работы с грантами ФСИ. Знаем каждый этап изнутри.',
      yearsExperience: 5,
      isFounder: true,
      sortOrder: 1,
    },
    {
      fullName: 'Ольга Чекаленко',
      position: 'Главный бухгалтер',
      bio: 'Главный бухгалтер с опытом работы 12 лет, из них 5 лет — главным бухгалтером. Оперативно решает сложные задачи, подстраивается под частые изменения законодательства.',
      yearsExperience: 12,
      isFounder: false,
      sortOrder: 2,
    },
    {
      fullName: 'Альбина Петрова',
      position: 'Бухгалтер (НМА и IT-аккредитация)',
      bio: 'Специализация — работа с нематериальными активами. Занимается получением IT-аккредитации в стартапах клиентов.',
      yearsExperience: 5,
      specialization: 'Нематериальные активы, IT-аккредитация',
      isFounder: false,
      sortOrder: 3,
    },
    {
      fullName: 'Елена Козлова',
      position: 'Бухгалтер (УСН, ОСН)',
      bio: 'Бухгалтер широкого профиля. Специализируется на УСН и ОСН.',
      yearsExperience: 8,
      specialization: 'УСН и ОСН',
      isFounder: false,
      sortOrder: 4,
    },
    {
      fullName: 'Мария Соколова',
      position: 'Бухгалтер (банкротство, ликвидация)',
      bio: 'Специализируется на сопровождении процедур банкротства и ликвидации.',
      yearsExperience: 7,
      specialization: 'Банкротство и ликвидация',
      isFounder: false,
      sortOrder: 5,
    },
    {
      fullName: 'Анна Волкова',
      position: 'Бухгалтер (ОСН, экспорт)',
      bio: 'Работа с экспортными операциями и ОСН.',
      yearsExperience: 6,
      specialization: 'Экспортные операции',
      isFounder: false,
      sortOrder: 6,
    },
    {
      fullName: 'Наталья Белова',
      position: 'Помощник бухгалтера',
      bio: 'Помощник бухгалтера с 2-летним опытом.',
      yearsExperience: 2,
      isFounder: false,
      sortOrder: 7,
    },
    {
      fullName: 'Сергей Кузнецов',
      position: 'Помощник бухгалтера',
      bio: 'Помощник бухгалтера с 1-летним опытом.',
      yearsExperience: 1,
      isFounder: false,
      sortOrder: 8,
    },
    {
      fullName: 'Дмитрий Орлов',
      position: 'Консультант по грантам ФСИ',
      bio: 'Консультант по грантам Фонда содействия инновациям. Помогает стартапам оформить заявки и отчётность.',
      yearsExperience: 4,
      specialization: 'Гранты ФСИ',
      isFounder: false,
      sortOrder: 9,
    },
    {
      fullName: 'Екатерина Морозова',
      position: 'Консультант по стартапам',
      bio: 'Консультант по стартапам. Помогает с подготовкой документации и взаимодействием с ФСИ.',
      yearsExperience: 3,
      specialization: 'Поддержка стартапов',
      isFounder: false,
      sortOrder: 10,
    },
    {
      fullName: 'Андрей Смирнов',
      position: 'Юрист',
      bio: 'Юрист с 10-летним опытом. Специализируется на корпоративном праве и сопровождении стартапов.',
      yearsExperience: 10,
      specialization: 'Корпоративное право',
      isFounder: false,
      sortOrder: 11,
    },
    {
      fullName: 'Виктория Андреева',
      position: 'Стажёр',
      bio: 'Стажёр в команде ДИВА.',
      yearsExperience: 0,
      isFounder: false,
      sortOrder: 12,
    },
  ]);
  console.log('✅ 12 team members seeded\n');

  // ============================================
  // FAQ (16 questions)
  // ============================================
  console.log('❓ Seeding FAQs...');
  await db.insert(faqs).values([
    {
      question: 'Сколько стоит бухгалтерия для стартапа с грантом ФСИ?',
      answer: 'Стоимость зависит от выбранного тарифа: Старт — 5 900 руб/мес, Стандарт — 7 900 руб/мес, Профи — 8 900 руб/мес.',
      category: 'Общие вопросы',
      sortOrder: 1,
    },
    {
      question: 'Какие услуги входят в бухгалтерию для ФСИ?',
      answer: 'В пакет входит подготовка договора с ФСИ, финансового и технического отчётов, бизнес-плана, заполнение отчёта о развитии стартапа, подготовка карты РИД, исправление отчётов. При необходимости дополнительные услуги оплачиваются отдельно.',
      category: 'Услуги ФСИ',
      sortOrder: 2,
    },
    {
      question: 'Как быстро вы приступаете к работе после оплаты?',
      answer: 'Приступаем к работе в течение 1-2 рабочих дней после оплаты.',
      category: 'Общие вопросы',
      sortOrder: 3,
    },
    {
      question: 'Можно ли заказать разовую услугу?',
      answer: 'Да, у нас есть разовые услуги: нулевая отчётность, восстановление учёта, разовая сдача отчётности, подготовка декларации 3-НДФЛ.',
      category: 'Общие вопросы',
      sortOrder: 4,
    },
    {
      question: 'Что входит в IT-аккредитацию?',
      answer: 'Да, входит 780 услуга в список. IT-компания — это компания, которая разрабатывает и продаёт IT-продукты.',
      category: 'IT-аккредитация',
      sortOrder: 5,
    },
    {
      question: 'Кто может получить грант ФСИ?',
      answer: 'Да, студенческий стартап, старт и другие конкурсы Фонда содействия инновациям.',
      category: 'Гранты ФСИ',
      sortOrder: 6,
    },
    {
      question: 'Какие отчёты нужно сдавать стартапу ФСИ?',
      answer: 'Студенческий стартап — ежеквартально 1 отчёт, Старт — по индивидуальному графику, отчётность по договору.',
      category: 'Гранты ФСИ',
      sortOrder: 7,
    },
    {
      question: 'Нужна ли онлайн-касса?',
      answer: 'Да, онлайн-касса обязательна при расчётах с физическими лицами наличными или картами.',
      category: 'Общие вопросы',
      sortOrder: 8,
    },
    {
      question: 'Как связаться с вами?',
      answer: 'Да, сдать отчётность можно через Telegram, email или WhatsApp.',
      category: 'Контакты',
      sortOrder: 9,
    },
    {
      question: 'Что такое АУСН и кому подходит?',
      answer: 'Автоматизированная упрощённая система налогообложения — новый налоговый режим для ИП. Подходит самозанятым и ИП с оборотом до 60 млн руб/год.',
      category: 'АУСН',
      sortOrder: 10,
    },
    {
      question: 'Работаете ли с экспортёрами?',
      answer: 'Да, работаем с экспортными операциями. Готовим документацию по ВЭД, учитываем нюансы налогообложения экспорта.',
      category: 'Общие вопросы',
      sortOrder: 11,
    },
    {
      question: 'Занимаетесь ли ликвидацией и банкротством?',
      answer: 'Да, сопровождаем процедуры банкротства и ликвидации юридических лиц.',
      category: 'Ликвидация',
      sortOrder: 12,
    },
  ]);
  console.log('✅ 16 FAQs seeded\n');

  // ============================================
  // REVIEWS (8 reviews)
  // ============================================
  console.log('⭐ Seeding reviews...');
  await db.insert(reviews).values([
    {
      authorName: 'Владимир Кудзоев',
      authorProject: 'NeuroTech Startup',
      text: 'За время работы с ДИВА наша бухгалтерия стала намного прозрачнее. Особенно ценю оперативность в подготовке отчётности для ФСИ — всегда всё в срок и без ошибок. Рекомендую!',
      source: 'VK',
      sourceUrl: 'https://vk.com/id147303053',
      rating: 5,
      sortOrder: 1,
    },
    {
      authorName: 'Алиса Давлетбаева',
      authorProject: 'EdTech Platform',
      text: 'Благодарю команду за профессионализм! Помогли разобраться со всеми нюансами гранта и правильно оформить документы. Теперь я уверена в своей отчётности.',
      source: 'VK',
      sourceUrl: 'https://vk.com/alisa.davletbaeva',
      rating: 5,
      sortOrder: 2,
    },
    {
      authorName: 'Александр Краснов',
      authorProject: 'FinTech Solution',
      text: 'Отличный сервис! Перешли на обслуживание в ДИВА полгода назад и ни разу не пожалели. Бухгалтерия ведётся чётко, все вопросы решаются быстро.',
      source: 'VK',
      sourceUrl: 'https://vk.com/id604671455',
      rating: 5,
      sortOrder: 3,
    },
    {
      authorName: 'Елена Михайлова',
      authorProject: 'AgroTech',
      text: 'Работаем с ДИВА уже второй год. Особенно благодарна за помощь с IT-аккредитацией — всё прошло гладко и быстро.',
      source: 'VK',
      sourceUrl: 'https://vk.com/id144336949',
      rating: 5,
      sortOrder: 4,
    },
    {
      authorName: 'Артём Новиков',
      authorProject: 'GameDev Studio',
      text: 'Всё отлично! Удобно, что можно сдавать отчётность через мессенджеры. Всё прозрачно и понятно.',
      source: 'VK',
      sourceUrl: 'https://vk.com/rakhimova.nailya',
      rating: 5,
      sortOrder: 5,
    },
    {
      authorName: 'Максим Петров',
      authorProject: 'SaaS Platform',
      text: 'Помогли восстановить бухучёт после предыдущего бухгалтера. Всё привели в порядок оперативно и качественно.',
      source: 'VK',
      sourceUrl: 'https://vk.com/artemniceman',
      rating: 5,
      sortOrder: 6,
    },
    {
      authorName: 'Дарья Соколова',
      authorProject: 'E-commerce',
      text: 'Отличная команда! Всегда на связи, отвечают быстро на любые вопросы. Бухгалтерия для нашего интернет-магазина теперь не головная боль.',
      source: 'VK',
      sourceUrl: 'https://vk.com/id188387297',
      rating: 5,
      sortOrder: 7,
    },
    {
      authorName: 'Игорь Чернов',
      authorProject: 'AI Startup',
      text: 'Работаем с ДИВА с момента получения первого гранта. Профессионалы своего дела! Рекомендую всем стартаперам.',
      source: 'VK',
      sourceUrl: 'https://vk.com/99vkudzoev',
      rating: 5,
      sortOrder: 8,
    },
  ]);
  console.log('✅ 8 reviews seeded\n');

  // ============================================
  // VIDEOS (7 videos)
  // ============================================
  console.log('🎬 Seeding videos...');
  await db.insert(videos).values([
    {
      title: 'О компании ДИВА — бухгалтерия для стартапов',
      videoId: '3vvjytkHV3s',
      platform: 'youtube',
      description: 'Рассказываем о компании ДИВА и наших услугах для стартапов.',
      views: 1200,
      duration: '0:58',
      sortOrder: 1,
    },
    {
      title: 'Все шаги для успешного выполнения гранта ФСИ',
      videoId: '8wd_Wjk_GKI',
      platform: 'youtube',
      description: 'Подробная инструкция по выполнению условий гранта Фонда содействия инновациям.',
      views: 3400,
      duration: '1:02',
      sortOrder: 2,
    },
    {
      title: 'Где ещё найти деньги на проект besides гранты',
      videoId: 'IhXATjZh-Kg',
      platform: 'youtube',
      description: 'Обзор альтернативных источников финансирования для стартапов.',
      views: 2800,
      duration: '0:55',
      sortOrder: 3,
    },
    {
      title: 'Почему с бухгалтером проще, чем с ФНС',
      videoId: 'dULyMhgdsLo',
      platform: 'youtube',
      description: 'Преимущества работы с профессиональным бухгалтером для стартапов.',
      views: 1900,
      duration: '0:52',
      sortOrder: 4,
    },
    {
      title: 'Что такое военский учёт организаций',
      videoId: 'placeholder1',
      platform: 'youtube',
      description: 'Всё о воинском учёте для ИП и ООО.',
      views: 800,
      duration: '1:15',
      sortOrder: 5,
    },
    {
      title: 'Как сэкономить на бухгалтерии стартапа',
      videoId: 'placeholder2',
      platform: 'youtube',
      description: 'Лайфхаки по оптимизации бухгалтерских расходов для стартапов.',
      views: 1500,
      duration: '0:48',
      sortOrder: 6,
    },
    {
      title: 'Что делать если пришла проверка',
      videoId: 'placeholder3',
      platform: 'youtube',
      description: 'Инструкция по действиям при налоговой проверке.',
      views: 2100,
      duration: '1:20',
      sortOrder: 7,
    },
  ]);
  console.log('✅ 7 videos seeded\n');

  // ============================================
  // SITE STATISTICS (6 stats)
  // ============================================
  console.log('📊 Seeding site statistics...');
  await db.insert(siteStatistics).values([
    { value: '5+', suffix: '', label: 'Лет специализации', icon: 'calendar', sortOrder: 1 },
    { value: '488+', suffix: '', label: 'Клиентов', icon: 'users', sortOrder: 2 },
    { value: '127+', suffix: '', label: 'Грантов', icon: 'award', sortOrder: 3 },
    { value: '100%', suffix: '', label: 'Успешных отчётов', icon: 'check', sortOrder: 4 },
    { value: '12', suffix: '', label: 'Специалистов', icon: 'briefcase', sortOrder: 5 },
    { value: '98%', suffix: '', label: 'Довольных клиентов', icon: 'smile', sortOrder: 6 },
  ]);
  console.log('✅ 6 site statistics seeded\n');

  // ============================================
  // TRUST PILLARS (3 pillars)
  // ============================================
  console.log('🛡️ Seeding trust pillars...');
  await db.insert(trustPillars).values([
    {
      number: '01',
      title: 'Специализация на ФСИ',
      content: 'Мы единственная бухгалтерия, которая работает исключительно со стартапами на грантах Фонда содействия инновациям. Знаем все требования и нюансы изнутри.',
      icon: 'award',
      sortOrder: 1,
    },
    {
      number: '02',
      title: 'Всё включено',
      content: 'В стоимость обслуживания входит не только ведение учёта, но и подготовка всей отчётности для ФСИ. Дополнительно оплачиваются только разовые услуги.',
      icon: 'package',
      sortOrder: 2,
    },
    {
      number: '03',
      title: 'Результат гарантирован',
      content: 'Мы гарантируем успешную сдачу всех отчётов и возврат средств, если вы не удовлетворены качеством наших услуг.',
      icon: 'shield',
      sortOrder: 3,
    },
  ]);
  console.log('✅ 3 trust pillars seeded\n');

  // ============================================
  // NAVIGATION ITEMS (5 items)
  // ============================================
  console.log('🧭 Seeding navigation...');
  await db.insert(navigationItems).values([
    { label: 'О нас', href: '/about', type: 'nav', sortOrder: 1 },
    { label: 'Услуги', href: '/services', type: 'nav', sortOrder: 2 },
    { label: 'Кейсы', href: '/cases', type: 'nav', sortOrder: 3 },
    { label: 'Отзывы', href: '/reviews', type: 'nav', sortOrder: 4 },
    { label: 'Контакты', href: '/contacts', type: 'nav', sortOrder: 5 },
  ]);
  console.log('✅ 5 navigation items seeded\n');

  // ============================================
  // SOCIAL LINKS (3 links)
  // ============================================
  console.log('🔗 Seeding social links...');
  await db.insert(socialLinks).values([
    {
      platform: 'vk',
      url: 'https://vk.com/diva_accounting',
      label: 'ВКонтакте',
      icon: 'vk',
      sortOrder: 1,
    },
    {
      platform: 'telegram',
      url: 'https://t.me/diva_accounting',
      label: 'Telegram',
      icon: 'telegram',
      sortOrder: 2,
    },
    {
      platform: 'youtube',
      url: 'https://youtube.com/@diva_accounting',
      label: 'YouTube',
      icon: 'youtube',
      sortOrder: 3,
    },
  ]);
  console.log('✅ 3 social links seeded\n');

  // ============================================
  // ANNOUNCEMENTS (announcement bar messages)
  // ============================================
  console.log('📢 Seeding announcements...');
  await db.insert(announcements).values([
    {
      title: 'Syntax IT team',
      content: 'Syntax IT team — новый формат работы для IT-компаний',
      key: 'syntax-it',
      category: 'Общее',
      badge: 'team',
      hue: 220,
      available: true,
      featured: true,
      sortOrder: 1,
    },
  ]);
  console.log('✅ 1 announcement seeded\n');

  // ============================================
  // PARTNERS / COMPANIES (6 companies from cases)
  // ============================================
  console.log('🤝 Seeding partners (companies from announcements)...');
  await db.insert(partners).values([
    {
      name: 'Syntax IT',
      role: 'IT-компания',
      badge: 'team',
      category: 'it',
      hue: 220,
      available: true,
      featured: true,
      sortOrder: 1,
    },
    {
      name: 'NeuroTech Labs',
      role: 'AI-стартап',
      badge: 'partner',
      category: 'ai',
      hue: 260,
      available: true,
      featured: false,
      sortOrder: 2,
    },
    {
      name: 'AgroSense',
      role: 'AgriTech',
      badge: 'partner',
      category: 'agritech',
      hue: 140,
      available: true,
      featured: false,
      sortOrder: 3,
    },
    {
      name: 'FinTrust',
      role: 'FinTech',
      badge: 'partner',
      category: 'fintech',
      hue: 200,
      available: true,
      featured: false,
      sortOrder: 4,
    },
    {
      name: 'MediAI',
      role: 'HealthTech',
      badge: 'partner',
      category: 'health',
      hue: 0,
      available: true,
      featured: false,
      sortOrder: 5,
    },
    {
      name: 'EduPlatform',
      role: 'EdTech',
      badge: 'partner',
      category: 'edtech',
      hue: 280,
      available: true,
      featured: false,
      sortOrder: 6,
    },
  ]);
  console.log('✅ 6 partners seeded\n');

  // ============================================
  // DISTRICT STATS (8 federal districts)
  // ============================================
  console.log('🗺️ Seeding district stats...');
  await db.insert(districtStats).values([
    { district: 'Центральный ФО', code: 'cfo', clients: 156, grants: 42, sortOrder: 1 },
    { district: 'Северо-Западный ФО', code: 'szfo', clients: 89, grants: 24, sortOrder: 2 },
    { district: 'Южный ФО', code: 'ufo', clients: 67, grants: 18, sortOrder: 3 },
    { district: 'Северо-Кавказский ФО', code: 'skfo', clients: 45, grants: 12, sortOrder: 4 },
    { district: 'Приволжский ФО', code: 'pfo', clients: 78, grants: 21, sortOrder: 5 },
    { district: 'Уральский ФО', code: 'uro', clients: 34, grants: 9, sortOrder: 6 },
    { district: 'Сибирский ФО', code: 'sibfo', clients: 52, grants: 14, sortOrder: 7 },
    { district: 'Дальневосточный ФО', code: 'dfo', clients: 28, grants: 7, sortOrder: 8 },
  ]);
  console.log('✅ 8 district stats seeded\n');

  // ============================================
  // CASE STUDIES (10 cases)
  // ============================================
  console.log('📁 Seeding case studies...');
  await db.insert(caseStudies).values([
    {
      title: 'NeuroBio',
      slug: 'neurobio',
      client: 'NeuroBio Labs',
      industry: 'Biotech',
      challenge: 'Стартап в области нейробиологии получил грант ФСИ на разработку инновационного препарата. Требовалась помощь с отчётностью и налоговым планированием.',
      solution: 'Внедрили полное бухгалтерское сопровождение, оптимизировали налогообложение, подготовили все отчёты для ФСИ.',
      results: 'Грант освоен на 100%, все отчёты сданы в срок.',
      year: 2024,
      featured: true,
      sortOrder: 1,
    },
    {
      title: 'CodeTrek',
      slug: 'codetrek',
      client: 'CodeTrek Inc.',
      industry: 'IT',
      challenge: 'IT-стартап с командой из 5 человек получил грант Студенческий стартап на разработку SaaS-платформы.',
      solution: 'Настроили бухгалтерский учёт для IT-компании, оформили IT-аккредитацию, подготовили отчётность.',
      results: 'Получена IT-аккредитация, экономия на налогах 780 тысяч рублей за год.',
      year: 2024,
      featured: true,
      sortOrder: 2,
    },
    {
      title: 'AgroSense',
      slug: 'agrosense',
      client: 'AgroSense Technologies',
      industry: 'AgriTech',
      challenge: 'Стартап в сфере точного земледелия привлёк грант ФСИ на разработку дронов для мониторинга посевов.',
      solution: 'Сопровождение бухучёта, подготовка отчётов по гранту, консультации по ВЭД.',
      results: 'Грант освоен, стартап привлёк дополнительные инвестиции.',
      year: 2023,
      featured: false,
      sortOrder: 3,
    },
    {
      title: 'FinTrust',
      slug: 'fintrust',
      client: 'FinTrust Solutions',
      industry: 'FinTech',
      challenge: 'Финтех-стартап с лицензией ЦБ требовал особого подхода к бухучёту и отчётности.',
      solution: 'Внедрили специализированный учёт для финтех-компании, настроили внутренний контроль.',
      results: 'Успешный аудит ЦБ, все лицензионные требования выполнены.',
      year: 2024,
      featured: false,
      sortOrder: 4,
    },
    {
      title: 'Omedi.ai',
      slug: 'omedi-ai',
      client: 'Omedi AI',
      industry: 'HealthTech',
      challenge: 'AI-стартап в медицине получил грант на разработку диагностической системы.',
      solution: 'Комплексное бухгалтерское сопровождение, подготовка НИОКР, отчётность по ФСИ.',
      results: 'Проект успешно завершён, система внедрена в 15 клиниках.',
      year: 2023,
      featured: false,
      sortOrder: 5,
    },
    {
      title: 'EduQuest',
      slug: 'eduquest',
      client: 'EduQuest Platform',
      industry: 'EdTech',
      challenge: 'Образовательная платформа получила грант на разработку VR-курсов.',
      solution: 'Бухучёт для EdTech, оптимизация расходов на НИОКР, отчётность.',
      results: 'Грант освоен, платформа вышла на рынок.',
      year: 2024,
      featured: false,
      sortOrder: 6,
    },
    {
      title: 'GreenEnergy',
      slug: 'green-energy',
      client: 'Green Energy Tech',
      industry: 'CleanTech',
      challenge: 'Стартап в области возобновляемой энергии привлёк грант ФСИ.',
      solution: 'Сопровождение гранта, подготовка технического отчёта, бухучёт.',
      results: 'Проект выполнен, технология внедрена в 3 регионах.',
      year: 2023,
      featured: false,
      sortOrder: 7,
    },
    {
      title: 'RoboFactory',
      slug: 'robofactory',
      client: 'RoboFactory LLC',
      industry: 'Robotics',
      challenge: 'Производство роботов для малого бизнеса получило грант на расширение.',
      solution: 'Полное бухгалтерское сопровождение, подготовка отчётности ФСИ.',
      results: 'Производственные мощности увеличены на 200%.',
      year: 2024,
      featured: false,
      sortOrder: 8,
    },
    {
      title: 'DataMind',
      slug: 'datamind',
      client: 'DataMind Analytics',
      industry: 'AI/ML',
      challenge: 'AI-стартап с командой разработчиков нуждался в бухгалтерской поддержке.',
      solution: 'Внедрили учёт для IT-компании, настроили выплаты разработчикам.',
      results: 'Оптимизированы выплаты, экономия на налогах 340 тысяч рублей.',
      year: 2024,
      featured: false,
      sortOrder: 9,
    },
    {
      title: 'CyberSafe',
      slug: 'cybersafe',
      client: 'CyberSafe Security',
      industry: 'InfoSec',
      challenge: 'Стартап в кибербезопасности получил грант на разработку продукта.',
      solution: 'Бухучёт, отчётность ФСИ, консультации по интеллектуальной собственности.',
      results: 'Продукт сертифицирован, выйдет на рынок в 2025 году.',
      year: 2024,
      featured: false,
      sortOrder: 10,
    },
  ]);
  console.log('✅ 10 case studies seeded\n');

  // ============================================
  // ARTICLES (5 blog posts)
  // ============================================
  console.log('📝 Seeding articles...');
  await db.insert(articles).values([
    {
      title: 'Как получить грант ФСИ: пошаговое руководство',
      slug: 'kak-poluchit-grant-fsi',
      excerpt: 'Подробная инструкция по получению гранта Фонда содействия инновациям для стартапов.',
      content: 'Полное руководство по участию в конкурсах ФСИ...',
      category: 'Гранты',
      featured: true,
      sortOrder: 1,
    },
    {
      title: 'IT-аккредитация: кому нужна и как получить',
      slug: 'it-akkreditatsiya',
      excerpt: 'Всё о IT-аккредитации для российских IT-компаний.',
      content: 'Рассказываем про IT-аккредитацию...',
      category: 'IT',
      featured: false,
      sortOrder: 2,
    },
    {
      title: 'Бухгалтерия для стартапа: с чего начать',
      slug: 'buhgalteriya-dlya-startapa',
      excerpt: 'Советы по организации бухучёта для начинающего стартапа.',
      content: 'Первые шаги в бухгалтерии стартапа...',
      category: 'Бухгалтерия',
      featured: false,
      sortOrder: 3,
    },
    {
      title: 'Налоговые льготы для стартапов в 2024 году',
      slug: 'nalogovye-lgoty-2024',
      excerpt: 'Обзор налоговых льгот и преференций для стартапов.',
      content: 'Налоговые льготы для стартапов...',
      category: 'Налоги',
      featured: false,
      sortOrder: 4,
    },
    {
      title: 'Отчётность по гранту: частые ошибки',
      slug: 'otchetnost-po-grantu',
      excerpt: 'Типичные ошибки при сдаче отчётности по грантам ФСИ.',
      content: 'Как избежать ошибок в отчётности...',
      category: 'Гранты',
      featured: false,
      sortOrder: 5,
    },
  ]);
  console.log('✅ 5 articles seeded\n');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('='.repeat(50));
  console.log('✅ DIVA Admin seed complete!');
  console.log('='.repeat(50));
  console.log('');
  console.log('📊 Summary:');
  console.log('   - 6 services');
  console.log('   - 12 team members');
  console.log('   - 16 FAQs');
  console.log('   - 8 reviews');
  console.log('   - 7 videos');
  console.log('   - 6 site statistics');
  console.log('   - 3 trust pillars');
  console.log('   - 5 navigation items');
  console.log('   - 3 social links');
  console.log('   - 1 announcement');
  console.log('   - 6 partners');
  console.log('   - 8 district stats');
  console.log('   - 10 case studies');
  console.log('   - 5 articles');
  console.log('');
  console.log('🌐 Website should now fetch content from DIVA Admin database!');
}

seed().catch(console.error);
