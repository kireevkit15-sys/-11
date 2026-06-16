/**
 * DIVA Database Seed Script
 * Cleans duplicates and seeds real data
 */

import postgres from 'postgres';
import 'dotenv/config';

const DB_URL = process.env.DATABASE_URL || 'postgres://diva:diva@localhost:5436/diva';

async function main() {
  console.log('Connecting to database...');
  const sql = postgres(DB_URL, { max: 1 });

  try {
    // =====================================================================
    // TASK 1: CLEAN DUPLICATES
    // =====================================================================
    console.log('\n=== CLEANING DUPLICATES ===\n');

    // 1. Services - Remove duplicates by slug/title, keep one record per unique service
    console.log('Cleaning services...');
    const servicesDeleted = await sql`
      WITH duplicates AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
        FROM services
      )
      DELETE FROM services WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
      )
      RETURNING id
    `;
    console.log(`  Deleted ${servicesDeleted.length} duplicate services`);

    // 2. Team Members - Remove duplicates by full_name, keep one record per person
    console.log('Cleaning team_members...');
    const teamDeleted = await sql`
      WITH duplicates AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY full_name ORDER BY created_at) as rn
        FROM team_members
      )
      DELETE FROM team_members WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
      )
      RETURNING id
    `;
    console.log(`  Deleted ${teamDeleted.length} duplicate team members`);

    // 3. FAQs - Remove exact duplicates by question text
    console.log('Cleaning faqs...');
    const faqsDeleted = await sql`
      WITH duplicates AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY question ORDER BY created_at) as rn
        FROM faqs
      )
      DELETE FROM faqs WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
      )
      RETURNING id
    `;
    console.log(`  Deleted ${faqsDeleted.length} duplicate FAQs`);

    // 4. Reviews - Remove duplicates by author_name + text
    console.log('Cleaning reviews...');
    const reviewsDeleted = await sql`
      WITH duplicates AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY author_name, text ORDER BY created_at) as rn
        FROM reviews
      )
      DELETE FROM reviews WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
      )
      RETURNING id
    `;
    console.log(`  Deleted ${reviewsDeleted.length} duplicate reviews`);

    // 5. Case Studies - Remove duplicates by slug/title
    console.log('Cleaning case_studies...');
    const caseStudiesDeleted = await sql`
      WITH duplicates AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
        FROM case_studies
      )
      DELETE FROM case_studies WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
      )
      RETURNING id
    `;
    console.log(`  Deleted ${caseStudiesDeleted.length} duplicate case studies`);

    // 6. Videos - Remove duplicates by video_id
    console.log('Cleaning videos...');
    const videosDeleted = await sql`
      WITH duplicates AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY video_id ORDER BY created_at) as rn
        FROM videos
      )
      DELETE FROM videos WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
      )
      RETURNING id
    `;
    console.log(`  Deleted ${videosDeleted.length} duplicate videos`);

    // =====================================================================
    // TASK 2: SEED REAL DATA
    // =====================================================================
    console.log('\n=== SEEDING REAL DATA ===\n');

    // Clear existing content tables before seeding
    console.log('Clearing existing content...');
    await sql`DELETE FROM site_statistics`;
    await sql`DELETE FROM trust_pillars`;
    await sql`DELETE FROM navigation_items`;
    await sql`DELETE FROM social_links`;
    await sql`DELETE FROM team_members`;
    await sql`DELETE FROM services`;

    // Seed Team Members (12 people)
    console.log('Seeding team_members...');
    const teamMembers = [
      { full_name: 'Павел Бантьев', position: 'Основатель и директор', years_experience: 5, is_founder: true },
      { full_name: 'Ольга Чекаленко', position: 'Главный бухгалтер', years_experience: 12, is_founder: false },
      { full_name: 'Альбина Петрова', position: 'Бухгалтер (НМА и IT-аккредитация)', years_experience: 5, is_founder: false },
      { full_name: 'Елена Козлова', position: 'Бухгалтер (УСН, ОСН)', years_experience: 8, is_founder: false },
      { full_name: 'Мария Соколова', position: 'Бухгалтер (банкротство, ликвидация)', years_experience: 7, is_founder: false },
      { full_name: 'Анна Волкова', position: 'Бухгалтер (ОСН, экспорт)', years_experience: 6, is_founder: false },
      { full_name: 'Дмитрий Орлов', position: 'Консультант по грантам ФСИ', years_experience: 4, is_founder: false },
      { full_name: 'Екатерина Морозова', position: 'Консультант по стартапам', years_experience: 3, is_founder: false },
      { full_name: 'Андрей Смирнов', position: 'Юрист', years_experience: 10, is_founder: false },
      { full_name: 'Наталья Белова', position: 'Помощник бухгалтера', years_experience: 2, is_founder: false },
      { full_name: 'Сергей Кузнецов', position: 'Помощник бухгалтера', years_experience: 1, is_founder: false },
      { full_name: 'Виктория Андреева', position: 'Стажёр', years_experience: 0, is_founder: false },
    ];

    for (let i = 0; i < teamMembers.length; i++) {
      const member = teamMembers[i];
      await sql`
        INSERT INTO team_members (full_name, position, years_experience, is_founder, sort_order)
        VALUES (
          ${member.full_name},
          ${member.position},
          ${member.years_experience},
          ${member.is_founder},
          ${i}
        )
      `;
    }
    console.log(`  Inserted ${teamMembers.length} team members`);

    // Seed Services (6 services)
    console.log('Seeding services...');
    const services = [
      { title: 'Бухгалтерия для АУСН', slug: 'ausn', base_price: 5900, key: 'Lightning', is_highlighted: false, sort_order: 0 },
      { title: 'Бухгалтерия для УСН', slug: 'usn', base_price: 7900, key: 'Rocket', is_highlighted: false, sort_order: 1 },
      { title: 'Бухгалтерия для ОСН', slug: 'osn', base_price: 8900, key: 'Buildings', is_highlighted: false, sort_order: 2 },
      { title: 'Бухгалтерия для стартапов ФСИ', slug: 'fsi', base_price: 35000, key: 'Trophy', is_highlighted: true, sort_order: 3 },
      { title: 'Разовое бухгалтерское обслуживание', slug: 'single', base_price: null, key: 'Clock', is_highlighted: false, sort_order: 4 },
      { title: 'Юридические услуги', slug: 'legal', base_price: null, key: 'Scales', is_highlighted: false, sort_order: 5 },
    ];

    for (const service of services) {
      await sql`
        INSERT INTO services (title, slug, base_price, key, is_highlighted, sort_order)
        VALUES (
          ${service.title},
          ${service.slug},
          ${service.base_price},
          ${service.key},
          ${service.is_highlighted},
          ${service.sort_order}
        )
      `;
    }
    console.log(`  Inserted ${services.length} services`);

    // Seed Site Statistics
    console.log('Seeding site_statistics...');
    const siteStats = [
      { key: 'years_experience', value: 5, suffix: '+', label: 'Лет специализации', sort_order: 0 },
      { key: 'clients', value: 488, suffix: '+', label: 'Клиентов', sort_order: 1 },
      { key: 'grants', value: 127, suffix: '+', label: 'Грантов', sort_order: 2 },
      { key: 'deadline_success', value: 100, suffix: '%', label: 'Успешных отчётов', sort_order: 3 },
      { key: 'team', value: 12, suffix: '', label: 'Специалистов', sort_order: 4 },
      { key: 'satisfaction', value: 98, suffix: '%', label: 'Довольных клиентов', sort_order: 5 },
    ];

    for (const stat of siteStats) {
      await sql`
        INSERT INTO site_statistics (key, value, suffix, label, sort_order)
        VALUES (${stat.key}, ${stat.value}, ${stat.suffix}, ${stat.label}, ${stat.sort_order})
      `;
    }
    console.log(`  Inserted ${siteStats.length} site statistics`);

    // Seed Trust Pillars
    console.log('Seeding trust_pillars...');
    const trustPillars = [
      {
        number: '01',
        title: 'Специализация на ФСИ',
        content: 'Мы единственная бухгалтерия, которая работает исключительно со стартапами ФСИ и знает все требования фонда изнутри.',
        sort_order: 0,
      },
      {
        number: '02',
        title: 'Личный бухгалтер',
        content: 'Закрепляем за каждым клиентом персонального бухгалтера, который знает ваш проект и всегда на связи.',
        sort_order: 1,
      },
      {
        number: '03',
        title: 'Гарантия результата',
        content: 'Фиксируем стоимость в договоре. Если налоговая найдёт нарушения — покрываем штрафы из своего кармана.',
        sort_order: 2,
      },
    ];

    for (const pillar of trustPillars) {
      await sql`
        INSERT INTO trust_pillars (number, title, content, sort_order)
        VALUES (${pillar.number}, ${pillar.title}, ${pillar.content}, ${pillar.sort_order})
      `;
    }
    console.log(`  Inserted ${trustPillars.length} trust pillars`);

    // Seed Navigation Items
    console.log('Seeding navigation_items...');
    const navItems = [
      { label: 'О нас', href: '/about', type: 'nav', sort_order: 0 },
      { label: 'Услуги', href: '/services', type: 'nav', sort_order: 1 },
      { label: 'Кейсы', href: '/cases', type: 'nav', sort_order: 2 },
      { label: 'Команда', href: '/team', type: 'nav', sort_order: 3 },
      { label: 'Контакты', href: '/contacts', type: 'nav', sort_order: 4 },
    ];

    for (const item of navItems) {
      await sql`
        INSERT INTO navigation_items (label, href, type, sort_order)
        VALUES (${item.label}, ${item.href}, ${item.type}, ${item.sort_order})
      `;
    }
    console.log(`  Inserted ${navItems.length} navigation items`);

    // Seed Social Links
    console.log('Seeding social_links...');
    const socialLinks = [
      { platform: 'telegram', label: 'Telegram', href: 'https://t.me/diva_buh', sort_order: 0 },
      { platform: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/79001234567', sort_order: 1 },
      { platform: 'phone', label: 'Телефон', href: 'tel:+79001234567', sort_order: 2 },
    ];

    for (const link of socialLinks) {
      await sql`
        INSERT INTO social_links (platform, label, href, sort_order)
        VALUES (${link.platform}, ${link.label}, ${link.href}, ${link.sort_order})
      `;
    }
    console.log(`  Inserted ${socialLinks.length} social links`);

    console.log('\n=== SEED COMPLETE ===\n');
    console.log('Summary:');
    console.log('  - Cleaned duplicates from: services, team_members, faqs, reviews, case_studies, videos');
    console.log('  - Seeded: 12 team members, 6 services, 6 site statistics, 3 trust pillars, 5 navigation items, 3 social links');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

main().catch(console.error);