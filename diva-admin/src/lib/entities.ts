/**
 * Diva Admin — Реестр сущностей (единый источник правды для UI и API).
 *
 * Каждая запись описывает таблицу БД, её поля формы и колонки списка.
 * Из этого реестра питаются:
 *   - динамический API  /api/[entity] и /api/[entity]/[id]
 *   - динамические страницы /admin/[entity] (список, создание, редактирование)
 *   - дашборд и боковое меню
 *
 * ВАЖНО: поле `table` — серверное (drizzle). В клиентские компоненты передаём
 * только сериализуемую часть (label/fields/columns/slug) через getClientEntity().
 */

import type { PgTable } from 'drizzle-orm/pg-core';
import {
  services,
  faqs,
  teamMembers,
  caseStudies,
  reviews,
  articles,
  videos,
  siteStatistics,
  districtStats,
  navigationItems,
  socialLinks,
  trustPillars,
  fsiDeadlines,
  glossaryTerms,
  announcements,
  partners,
  heroConfigs,
  footerConfigs,
  announcementMessages,
} from '@db/schema';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'list' // массив строк (jsonb)
  | 'json' // произвольный JSON (jsonb), редактируется как текст
  | 'image' // URL изображения с загрузкой файла
  | 'date'; // timestamp

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  help?: string;
  /** Секция формы для группировки полей (напр. «Контакты»). */
  group?: string;
  /** Значение, подставляемое в форму при создании новой записи (не при
   *  редактировании — тогда берётся из БД). Используется в emptyValue().
   *  Для checkbox: true/false; для list: [] (явно задавать не нужно). */
  defaultValue?: boolean | string | number;
}

export interface ColumnConfig {
  key: string;
  label: string;
  /** badge — отрисовать как «пилюлю», bool — галочку/прочерк */
  kind?: 'text' | 'badge' | 'bool' | 'number';
}

export interface EntityConfig {
  slug: string;
  label: string; // единственное число
  labelPlural: string;
  icon: string; // имя lucide-иконки
  /** Скрыть из меню/дашборда (сайт пока не отображает эту сущность). */
  hidden?: boolean;
  /** Singleton-настройка: одна запись, без кнопок «Добавить»/«Удалить». */
  singleton?: boolean;
  /** Группа в меню (для блоков управления сайтом). */
  group?: string;
  table: PgTable;
  orderBy: string; // имя js-поля для сортировки списка
  orderDir?: 'asc' | 'desc';
  titleField: string; // что показывать как заголовок записи
  columns: ColumnConfig[]; // колонки таблицы списка
  fields: FieldConfig[]; // поля формы
  /** Web-страницы, которые зависят от этой сущности.
   *  Инвалидируются через revalidatePath() после успешной мутации.
   *  Если не задано — revalidate не вызывается (например, admin_users). */
  revalidatePaths?: readonly string[];
  /** Теги для ISR-кеша. Совпадают с тем, что web fetchApi ставит в next.tags.
   *  Если не задано — admin всё равно вызовет `cms:<slug>` по умолчанию. */
  revalidateTags?: readonly string[];
}

const TAX_SYSTEMS = ['УСН-Д', 'УСН-ДР', 'ОСН', 'АУСН', 'ПСН', 'ФСИ', 'Разовое'];

export const ENTITIES: Record<string, EntityConfig> = {
  services: {
    slug: 'services',
    label: 'Услуга',
    labelPlural: 'Услуги',
    icon: 'Briefcase',
    table: services,
    orderBy: 'sortOrder',
    titleField: 'title',
    revalidatePaths: ['/'],
    revalidateTags: ['cms:services'],
    columns: [
      { key: 'title', label: 'Название' },
      { key: 'taxSystem', label: 'Налог', kind: 'badge' },
      { key: 'basePrice', label: 'Цена', kind: 'number' },
      { key: 'isHighlighted', label: 'На витрине', kind: 'bool' },
    ],
    fields: [
      { name: 'title', label: 'Название', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true, help: 'URL: /services/<slug>' },
      { name: 'taxSystem', label: 'Система налогообложения', type: 'select', options: TAX_SYSTEMS },
      { name: 'basePrice', label: 'Базовая цена, ₽', type: 'number', help: 'Пусто = «по запросу»' },
      { name: 'includes', label: 'Что входит', type: 'list' },
      { name: 'targetAudience', label: 'Целевая аудитория', type: 'text' },
      { name: 'isHighlighted', label: 'Показывать на витрине', type: 'checkbox' },
      { name: 'key', label: 'Ключ (key)', type: 'text' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  faqs: {
    slug: 'faqs',
    label: 'Вопрос',
    labelPlural: 'FAQ',
    icon: 'MessageSquare',
    table: faqs,
    orderBy: 'sortOrder',
    titleField: 'question',
    revalidatePaths: ['/'],
    revalidateTags: ['cms:faqs'],
    columns: [
      { key: 'question', label: 'Вопрос' },
      { key: 'category', label: 'Категория', kind: 'badge' },
    ],
    fields: [
      { name: 'question', label: 'Вопрос', type: 'text', required: true },
      { name: 'answer', label: 'Ответ', type: 'textarea', required: true },
      { name: 'category', label: 'Категория', type: 'text' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  'team-members': {
    slug: 'team-members',
    label: 'Сотрудник',
    labelPlural: 'Команда',
    icon: 'Users',
    table: teamMembers,
    orderBy: 'sortOrder',
    titleField: 'fullName',
    revalidatePaths: ['/'],
    revalidateTags: ['cms:team-members'],
    columns: [
      { key: 'fullName', label: 'Имя' },
      { key: 'position', label: 'Должность' },
      { key: 'isFounder', label: 'Основатель', kind: 'bool' },
    ],
    fields: [
      { name: 'fullName', label: 'ФИО', type: 'text', required: true },
      { name: 'position', label: 'Должность', type: 'text', required: true },
      { name: 'photoUrl', label: 'Фото', type: 'image' },
      { name: 'bio', label: 'Биография', type: 'textarea' },
      { name: 'education', label: 'Образование', type: 'text' },
      { name: 'yearsExperience', label: 'Лет опыта', type: 'number' },
      { name: 'specialization', label: 'Специализация', type: 'text' },
      { name: 'quote', label: 'Цитата', type: 'textarea' },
      { name: 'isFounder', label: 'Основатель', type: 'checkbox' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  'case-studies': {
    slug: 'case-studies',
    label: 'Кейс',
    labelPlural: 'Кейсы',
    icon: 'FileText',
    table: caseStudies,
    orderBy: 'sortOrder',
    titleField: 'title',
    revalidatePaths: ['/'],
    revalidateTags: ['cms:case-studies'],
    columns: [
      { key: 'title', label: 'Кейс' },
      { key: 'clientName', label: 'Клиент' },
      { key: 'period', label: 'Период' },
    ],
    fields: [
      { name: 'title', label: 'Заголовок', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'clientName', label: 'Клиент', type: 'text' },
      { name: 'clientLogoUrl', label: 'Логотип клиента', type: 'image' },
      { name: 'tags', label: 'Теги', type: 'list' },
      { name: 'task', label: 'Задача', type: 'textarea' },
      { name: 'solution', label: 'Решение', type: 'textarea' },
      { name: 'result', label: 'Результат', type: 'textarea' },
      { name: 'quote', label: 'Цитата', type: 'textarea' },
      { name: 'quoteAuthor', label: 'Автор цитаты', type: 'text' },
      { name: 'period', label: 'Период', type: 'text' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  reviews: {
    slug: 'reviews',
    label: 'Отзыв',
    labelPlural: 'Отзывы',
    icon: 'Star',
    table: reviews,
    orderBy: 'sortOrder',
    titleField: 'authorName',
    revalidatePaths: ['/'],
    revalidateTags: ['cms:reviews'],
    columns: [
      { key: 'authorName', label: 'Автор' },
      { key: 'source', label: 'Источник', kind: 'badge' },
      { key: 'rating', label: 'Оценка', kind: 'number' },
    ],
    fields: [
      { name: 'authorName', label: 'Имя автора', type: 'text', required: true },
      { name: 'authorProject', label: 'Проект/компания', type: 'text' },
      { name: 'text', label: 'Текст отзыва', type: 'textarea', required: true },
      { name: 'source', label: 'Источник', type: 'select', options: ['Email', 'Telegram', 'VK', 'Сайт', 'Google', 'Яндекс'] },
      { name: 'sourceUrl', label: 'Ссылка на источник', type: 'text' },
      { name: 'rating', label: 'Оценка (1–5)', type: 'number' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  articles: {
    slug: 'articles',
    label: 'Статья',
    labelPlural: 'Статьи',
    icon: 'BookOpen',
    hidden: true,
    table: articles,
    orderBy: 'sortOrder',
    titleField: 'title',
    columns: [
      { key: 'title', label: 'Заголовок' },
      { key: 'category', label: 'Категория', kind: 'badge' },
      { key: 'readingMinutes', label: 'Мин. чтения', kind: 'number' },
    ],
    fields: [
      { name: 'title', label: 'Заголовок', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'excerpt', label: 'Краткое описание', type: 'textarea' },
      { name: 'body', label: 'Текст (Markdown)', type: 'textarea' },
      { name: 'coverUrl', label: 'Обложка', type: 'image' },
      { name: 'category', label: 'Категория', type: 'text' },
      { name: 'readingMinutes', label: 'Время чтения, мин', type: 'number' },
      { name: 'seoTitle', label: 'SEO Title', type: 'text' },
      { name: 'seoDescription', label: 'SEO Description', type: 'textarea' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  videos: {
    slug: 'videos',
    label: 'Видео',
    labelPlural: 'Видео',
    icon: 'Video',
    table: videos,
    orderBy: 'sortOrder',
    titleField: 'title',
    revalidatePaths: ['/'],
    revalidateTags: ['cms:videos'],
    columns: [
      { key: 'title', label: 'Название' },
      { key: 'platform', label: 'Платформа', kind: 'badge' },
      { key: 'views', label: 'Просмотры', kind: 'number' },
    ],
    fields: [
      { name: 'title', label: 'Название', type: 'text', required: true },
      { name: 'videoId', label: 'ID видео', type: 'text', required: true, help: 'Напр. YouTube video id' },
      { name: 'platform', label: 'Платформа', type: 'select', options: ['youtube', 'rutube', 'vk', 'vimeo'] },
      { name: 'description', label: 'Описание', type: 'textarea' },
      { name: 'views', label: 'Просмотры', type: 'number' },
      { name: 'duration', label: 'Длительность', type: 'text', placeholder: '12:34' },
      { name: 'thumbnailUrl', label: 'Превью видео', type: 'image' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  'site-statistics': {
    slug: 'site-statistics',
    label: 'Показатель',
    labelPlural: 'Статистика',
    icon: 'BarChart3',
    table: siteStatistics,
    orderBy: 'sortOrder',
    titleField: 'label',
    revalidatePaths: ['/'],
    revalidateTags: ['cms:site-statistics'],
    columns: [
      { key: 'label', label: 'Подпись' },
      { key: 'value', label: 'Значение', kind: 'number' },
      { key: 'key', label: 'Ключ', kind: 'badge' },
    ],
    fields: [
      { name: 'key', label: 'Ключ', type: 'text', required: true },
      { name: 'value', label: 'Значение', type: 'number', required: true },
      { name: 'suffix', label: 'Суффикс', type: 'text', placeholder: '+, %, ₽' },
      { name: 'label', label: 'Подпись', type: 'text', required: true },
      { name: 'caption', label: 'Доп. текст', type: 'text' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  'district-stats': {
    slug: 'district-stats',
    label: 'Округ',
    labelPlural: 'Округа',
    icon: 'Map',
    hidden: true,
    table: districtStats,
    orderBy: 'sortOrder',
    titleField: 'name',
    columns: [
      { key: 'name', label: 'Округ' },
      { key: 'code', label: 'Код', kind: 'badge' },
      { key: 'clients', label: 'Клиентов', kind: 'number' },
    ],
    fields: [
      { name: 'code', label: 'Код', type: 'text', required: true },
      { name: 'shortName', label: 'Короткое имя', type: 'text', required: true },
      { name: 'name', label: 'Название', type: 'text', required: true },
      { name: 'capital', label: 'Центр', type: 'text' },
      { name: 'clients', label: 'Клиентов', type: 'number' },
      { name: 'color', label: 'Цвет (hex)', type: 'text' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  'navigation-items': {
    slug: 'navigation-items',
    label: 'Пункт меню',
    labelPlural: 'Навигация',
    icon: 'Navigation',
    hidden: true,
    table: navigationItems,
    orderBy: 'sortOrder',
    titleField: 'label',
    columns: [
      { key: 'label', label: 'Пункт' },
      { key: 'href', label: 'Ссылка' },
      { key: 'type', label: 'Тип', kind: 'badge' },
    ],
    fields: [
      { name: 'label', label: 'Текст', type: 'text', required: true },
      { name: 'href', label: 'Ссылка', type: 'text', required: true },
      { name: 'type', label: 'Тип', type: 'select', options: ['nav', 'footer', 'cta'] },
      { name: 'icon', label: 'Иконка', type: 'text' },
      { name: 'description', label: 'Описание', type: 'text' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  'social-links': {
    slug: 'social-links',
    label: 'Соцсеть',
    labelPlural: 'Соцсети',
    icon: 'Link2',
    table: socialLinks,
    orderBy: 'sortOrder',
    titleField: 'label',
    revalidatePaths: ['/'],
    revalidateTags: ['cms:social-links'],
    columns: [
      { key: 'label', label: 'Название' },
      { key: 'platform', label: 'Платформа', kind: 'badge' },
      { key: 'href', label: 'Ссылка' },
    ],
    fields: [
      { name: 'platform', label: 'Платформа', type: 'text', required: true },
      { name: 'label', label: 'Подпись', type: 'text', required: true },
      { name: 'href', label: 'Ссылка', type: 'text', required: true },
      { name: 'actionText', label: 'Текст действия', type: 'text' },
      { name: 'iconColor', label: 'Цвет иконки (hex)', type: 'text' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  'trust-pillars': {
    slug: 'trust-pillars',
    label: 'Столп доверия',
    labelPlural: 'Доверие',
    icon: 'Shield',
    table: trustPillars,
    orderBy: 'sortOrder',
    titleField: 'title',
    revalidatePaths: ['/'],
    revalidateTags: ['cms:trust-pillars'],
    columns: [
      { key: 'number', label: '№', kind: 'badge' },
      { key: 'title', label: 'Заголовок' },
    ],
    fields: [
      { name: 'number', label: 'Номер', type: 'text', required: true },
      { name: 'title', label: 'Заголовок', type: 'text', required: true },
      { name: 'content', label: 'Текст', type: 'textarea' },
      { name: 'quote', label: 'Цитата', type: 'textarea' },
      { name: 'hue', label: 'Оттенок (0–360)', type: 'number' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  'fsi-deadlines': {
    slug: 'fsi-deadlines',
    label: 'Дедлайн ФСИ',
    labelPlural: 'Дедлайны ФСИ',
    icon: 'Calendar',
    hidden: true,
    table: fsiDeadlines,
    orderBy: 'deadlineDate',
    orderDir: 'asc',
    titleField: 'title',
    columns: [
      { key: 'title', label: 'Грант' },
      { key: 'grantType', label: 'Тип', kind: 'badge' },
      { key: 'deadlineDate', label: 'Дедлайн' },
    ],
    fields: [
      { name: 'title', label: 'Название', type: 'text', required: true },
      { name: 'description', label: 'Описание', type: 'textarea' },
      { name: 'deadlineDate', label: 'Дата дедлайна', type: 'date', required: true },
      { name: 'grantType', label: 'Тип гранта', type: 'select', options: ['Старт', 'Старт-1', 'Старт-2', 'Развитие', 'Бизнес-Старт', 'Студенческий стартап'] },
      { name: 'stage', label: 'Этап', type: 'text' },
      { name: 'url', label: 'Ссылка', type: 'text' },
    ],
  },

  'glossary-terms': {
    slug: 'glossary-terms',
    label: 'Термин',
    labelPlural: 'Глоссарий',
    icon: 'BookText',
    hidden: true,
    table: glossaryTerms,
    orderBy: 'sortOrder',
    titleField: 'term',
    columns: [
      { key: 'term', label: 'Термин' },
      { key: 'category', label: 'Категория', kind: 'badge' },
    ],
    fields: [
      { name: 'term', label: 'Термин', type: 'text', required: true },
      { name: 'definition', label: 'Определение', type: 'textarea', required: true },
      { name: 'category', label: 'Категория', type: 'text' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  announcements: {
    slug: 'announcements',
    label: 'Объявление',
    labelPlural: 'Объявления',
    icon: 'Megaphone',
    group: 'Объявления',
    table: announcements,
    orderBy: 'sortOrder',
    titleField: 'title',
    revalidatePaths: ['/', '/announcements'],
    revalidateTags: ['cms:announcements'],
    columns: [
      { key: 'title', label: 'Заголовок' },
      { key: 'category', label: 'Категория', kind: 'badge' },
      { key: 'available', label: 'Активно', kind: 'bool' },
      { key: 'featured', label: 'Топ', kind: 'bool' },
    ],
    fields: [
      { name: 'title', label: 'Заголовок', type: 'text', required: true },
      { name: 'content', label: 'Текст', type: 'textarea', required: true },
      { name: 'imageUrl', label: 'Обложка (фото)', type: 'image', help: 'Загрузите изображение — появится в карточке на сайте' },
      { name: 'key', label: 'Ключ', type: 'text', required: true },
      { name: 'category', label: 'Категория', type: 'text' },
      { name: 'badge', label: 'Бейдж', type: 'text' },
      { name: 'hue', label: 'Оттенок (0–360)', type: 'number' },
      { name: 'available', label: 'Активно', type: 'checkbox' },
      { name: 'featured', label: 'В топе', type: 'checkbox' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  partners: {
    slug: 'partners',
    icon: 'Handshake',
    label: 'Партнёр',
    labelPlural: 'Партнёры (вкладка «Объявления»)',
    group: 'Объявления',
    table: partners,
    orderBy: 'sortOrder',
    titleField: 'name',
    revalidatePaths: ['/'],
    revalidateTags: ['cms:partners'],
    columns: [
      { key: 'name', label: 'Имя' },
      { key: 'role', label: 'Роль' },
      { key: 'category', label: 'Категория', kind: 'badge' },
      { key: 'available', label: 'Доступен', kind: 'bool' },
    ],
    fields: [
      { name: 'name', label: 'Имя', type: 'text', required: true, group: 'Основное' },
      { name: 'role', label: 'Роль', type: 'text', required: true, group: 'Основное' },
      { name: 'company', label: 'Компания', type: 'text', group: 'Основное' },
      { name: 'logoUrl', label: 'Логотип', type: 'image', help: 'Если задан — показывается вместо инициалов', group: 'Основное' },
      { name: 'bio', label: 'О себе', type: 'textarea', group: 'Основное' },
      { name: 'skills', label: 'Навыки', type: 'list', group: 'Основное' },
      { name: 'category', label: 'Категория', type: 'select', options: ['fullstack', 'mobile', 'ai', 'devops', 'design', 'other'], group: 'Основное' },
      // available — вверху смысла нет, но дефолт true критичен: без него
      // новый партнёр сохраняется скрытым (available=false) и не виден на
      // сайте, что сбивает редакторов. Ставим галочку сразу включённой.
      { name: 'available', label: 'Доступен (показывать на сайте)', type: 'checkbox', defaultValue: true, help: 'Если выключено — партнёр не появится в объявлениях', group: 'Основное' },
      { name: 'githubLink', label: 'GitHub', type: 'text', group: 'Контакты и ссылки' },
      { name: 'portfolioLink', label: 'Портфолио', type: 'text', group: 'Контакты и ссылки' },
      { name: 'vkLink', label: 'VK', type: 'text', group: 'Контакты и ссылки' },
      { name: 'telegramLink', label: 'Telegram', type: 'text', group: 'Контакты и ссылки' },
      { name: 'contact', label: 'Контакт', type: 'text', placeholder: '@username', group: 'Контакты и ссылки' },
      { name: 'badge', label: 'Тип', type: 'select', options: ['team', 'client'], help: 'team — «Команда ДИВА», client — «Клиент»', group: 'Оформление' },
      { name: 'hue', label: 'Оттенок карточки (0–360)', type: 'number', help: 'Цвет свечения карточки на сайте', group: 'Оформление' },
      { name: 'featured', label: 'В топе', type: 'checkbox', group: 'Оформление' },
      { name: 'sortOrder', label: 'Порядок', type: 'number', group: 'Оформление' },
    ],
  },
  // ===== Управление фронтендом =====

  'announcement-messages': {
    slug: 'announcement-messages',
    label: 'Сообщение',
    labelPlural: 'Полоска объявлений',
    icon: 'Megaphone',
    group: 'Сайт',
    table: announcementMessages,
    orderBy: 'sortOrder',
    titleField: 'message',
    revalidatePaths: ['/'],
    revalidateTags: ['cms:announcement-messages'],
    columns: [
      { key: 'message', label: 'Сообщение' },
      { key: 'ctaText', label: 'Кнопка', kind: 'badge' },
      { key: 'available', label: 'Активно', kind: 'bool' },
    ],
    fields: [
      { name: 'message', label: 'Текст сообщения', type: 'text', required: true },
      { name: 'ctaText', label: 'Текст кнопки', type: 'text' },
      { name: 'href', label: 'Ссылка кнопки', type: 'text', placeholder: '#lead-magnet' },
      { name: 'available', label: 'Показывать', type: 'checkbox' },
      { name: 'sortOrder', label: 'Порядок', type: 'number' },
    ],
  },

  'hero-configs': {
    slug: 'hero-configs',
    label: 'Hero-секция',
    labelPlural: 'Hero (главный экран)',
    icon: 'Sparkles',
    group: 'Сайт',
    singleton: true,
    table: heroConfigs,
    orderBy: 'id',
    titleField: 'headline',
    revalidatePaths: ['/'],
    revalidateTags: ['cms:hero-configs'],
    columns: [
      { key: 'headline', label: 'Заголовок' },
      { key: 'statNumber', label: 'Цифра', kind: 'badge' },
    ],
    fields: [
      {
        name: 'headline',
        label: 'Заголовок',
        type: 'textarea',
        required: true,
        help: 'Переносы строк сохраняются. Слово в *звёздочках* выделяется акцентом, напр. Тогда *кто строит*',
      },
      { name: 'subheadline', label: 'Подзаголовок', type: 'textarea' },
      { name: 'ctaText', label: 'Текст кнопки', type: 'text' },
      { name: 'badges', label: 'Бейджи', type: 'list' },
      { name: 'statNumber', label: 'Статистика — число', type: 'text', placeholder: '94%' },
      { name: 'statLabel', label: 'Статистика — подпись', type: 'text', placeholder: 'остаются' },
    ],
  },

  'footer-configs': {
    slug: 'footer-configs',
    label: 'Футер',
    labelPlural: 'Футер',
    icon: 'PanelBottom',
    group: 'Сайт',
    singleton: true,
    table: footerConfigs,
    orderBy: 'id',
    titleField: 'email',
    revalidatePaths: ['/'],
    revalidateTags: ['cms:footer-configs'],
    columns: [
      { key: 'email', label: 'Email' },
      { key: 'workHours', label: 'Часы работы' },
    ],
    fields: [
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'phones', label: 'Телефоны', type: 'list' },
      { name: 'address', label: 'Адрес', type: 'text' },
      { name: 'workHours', label: 'Часы работы', type: 'text' },
      { name: 'legalInfo', label: 'Юр. строка (©/ИНН/ОГРН)', type: 'textarea' },
      { name: 'copyright', label: 'Подпись справа внизу', type: 'text' },
      {
        name: 'navColumns',
        label: 'Колонки меню (JSON)',
        type: 'json',
        help: 'Массив: [{ "title": "...", "links": [{ "label": "...", "href": "..." }] }]',
      },
    ],
  },
};

export type ClientEntity = Omit<EntityConfig, 'table'>;

/** Сериализуемая часть конфига для передачи в клиентские компоненты. */
export function getClientEntity(slug: string): ClientEntity | null {
  const e = ENTITIES[slug];
  if (!e || e.hidden) return null;
  const { table: _table, ...rest } = e;
  return rest;
}

export function getEntity(slug: string): EntityConfig | null {
  return ENTITIES[slug] ?? null;
}

/**
 * Возвращает сущность только если она не hidden. Используется в API-роутах
 * (/api/[entity], /api/[entity]/[id]) — раньше hidden-сущности были доступны
 * по прямому URL, что раскрывало неподдерживаемые таблицы (articles,
 * fsi-deadlines и т.п.) даже когда они скрыты из меню.
 */
export function getVisibleEntity(slug: string): EntityConfig | null {
  const e = ENTITIES[slug];
  if (!e || e.hidden) return null;
  return e;
}

const GROUP_ORDER = ['Контент', 'Объявления', 'Сайт'];

/** Видимые в меню/дашборде сущности (без скрытых), сгруппированные. */
export const ENTITY_LIST = Object.values(ENTITIES)
  .filter((e) => !e.hidden)
  .map((e) => ({
    slug: e.slug,
    label: e.labelPlural,
    icon: e.icon,
    group: e.group ?? 'Контент',
  }))
  .sort((a, b) => {
    const ga = GROUP_ORDER.indexOf(a.group);
    const gb = GROUP_ORDER.indexOf(b.group);
    return (ga === -1 ? 99 : ga) - (gb === -1 ? 99 : gb);
  });
