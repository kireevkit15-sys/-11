/**
 * DIVA — CMS Library Unit Tests
 *
 * Тесты для lib/cms.ts функций с моками fetch.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мокаем fetch глобально
vi.stubGlobal('fetch', vi.fn());

describe('CMS Library - getServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch services from API', async () => {
    const mockServices = [
      { id: '1', title: 'Бухгалтерия для УСН', slug: 'usn' },
      { id: '2', title: 'Бухгалтерия для ОСН', slug: 'osn' },
    ];

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockServices }),
    } as Response);

    const { getServices } = await import('@/lib/cms');
    const result = await getServices();

    expect(result).toEqual(mockServices);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/content/services'),
      expect.any(Object)
    );
  });

  it('should return empty array on error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const { getServices } = await import('@/lib/cms');
    const result = await getServices();

    expect(result).toEqual([]);
  });

  it('should return empty array when API returns non-ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    } as Response);

    const { getServices } = await import('@/lib/cms');
    const result = await getServices();

    expect(result).toEqual([]);
  });
});

describe('CMS Library - getFaqs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch FAQs from API', async () => {
    const mockFaqs = [
      { id: '1', question: 'Вопрос 1', answer: 'Ответ 1' },
      { id: '2', question: 'Вопрос 2', answer: 'Ответ 2' },
    ];

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockFaqs }),
    } as Response);

    const { getFaqs } = await import('@/lib/cms');
    const result = await getFaqs();

    expect(result).toEqual(mockFaqs);
  });

  it('should filter by category using getFaqsByCategory', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    } as Response);

    const { getFaqsByCategory } = await import('@/lib/cms');
    await getFaqsByCategory('Бухгалтерия');

    // Category is URL-encoded
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('category='),
      expect.any(Object)
    );
  });
});

describe('CMS Library - getPartners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch partners from API', async () => {
    const mockPartners = [
      { id: '1', name: 'Syntax Labs', role: 'Full-stack команда' },
    ];

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockPartners }),
    } as Response);

    const { getPartners } = await import('@/lib/cms');
    const result = await getPartners();

    expect(result).toEqual(mockPartners);
  });

  it('should filter by category using getPartnersByCategory', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    } as Response);

    const { getPartnersByCategory } = await import('@/lib/cms');
    await getPartnersByCategory('fullstack');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('category=fullstack'),
      expect.any(Object)
    );
  });

  it('should filter featured partners', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    } as Response);

    const { getFeaturedPartner } = await import('@/lib/cms');
    await getFeaturedPartner();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('featured=true'),
      expect.any(Object)
    );
  });
});

describe('CMS Library - getMediaUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null for null input', async () => {
    const { getMediaUrl } = await import('@/lib/cms');
    expect(getMediaUrl(null)).toBeNull();
  });

  it('should return null for undefined input', async () => {
    const { getMediaUrl } = await import('@/lib/cms');
    expect(getMediaUrl(undefined)).toBeNull();
  });

  it('should return full URLs as-is', async () => {
    const { getMediaUrl } = await import('@/lib/cms');
    const fullUrl = 'https://example.com/image.jpg';
    expect(getMediaUrl(fullUrl)).toBe(fullUrl);
  });

  it('should prepend base for relative paths', async () => {
    const { getMediaUrl } = await import('@/lib/cms');
    const relativePath = '/uploads/image.jpg';
    const result = getMediaUrl(relativePath);
    expect(result).toContain(relativePath);
  });
});

describe('CMS Library - getTeamMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch team members from API', async () => {
    const mockMembers = [
      { id: '1', fullName: 'Иван Петров', position: 'Бухгалтер' },
    ];

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockMembers }),
    } as Response);

    const { getTeamMembers } = await import('@/lib/cms');
    const result = await getTeamMembers();

    expect(result).toEqual(mockMembers);
  });
});

describe('CMS Library - getCaseStudies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch case studies from API', async () => {
    const mockCases = [
      { id: '1', title: 'NeuroBio', slug: 'neurobio' },
    ];

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCases }),
    } as Response);

    const { getCaseStudies } = await import('@/lib/cms');
    const result = await getCaseStudies();

    expect(result).toEqual(mockCases);
  });
});

describe('CMS Library - getReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch reviews with limit', async () => {
    const mockReviews = [
      { id: '1', authorName: 'Клиент 1', text: 'Отзыв 1' },
    ];

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockReviews }),
    } as Response);

    const { getReviews } = await import('@/lib/cms');
    const result = await getReviews(5);

    expect(result).toEqual(mockReviews);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=5'),
      expect.any(Object)
    );
  });
});

describe('CMS Library - serviceToLocalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should convert service correctly', async () => {
    const { serviceToLocalService } = await import('@/lib/cms');

    const service = {
      title: 'Бухгалтерия для УСН',
      basePrice: 7900,
      taxSystem: 'УСН-Д',
      includes: ['Отчётность', 'Декларация'],
    };

    const result = serviceToLocalService(service as any);

    expect(result.title).toBe('Бухгалтерия для УСН');
    expect(result.price).toBe('7 900');
    expect(result.perUnit).toBe('₽ / мес');
    expect(result.icon).toBe('Rocket');
    expect(result.items).toEqual(['Отчётность', 'Декларация']);
    expect(result.isFsi).toBe(false);
  });

  it('should handle ФСИ tax system', async () => {
    const { serviceToLocalService } = await import('@/lib/cms');

    const service = {
      title: 'Отчёты по гранту',
      basePrice: 35000,
      taxSystem: 'ФСИ',
      includes: ['Финансовый отчёт'],
    };

    const result = serviceToLocalService(service as any);

    expect(result.isFsi).toBe(true);
    expect(result.perUnit).toBe('₽ / грант');
    expect(result.icon).toBe('Trophy');
  });
});
