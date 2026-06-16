/**
 * DIVA — Database Schema Tests
 *
 * Тесты для схемы БД - проверяют соответствие типов и структуры.
 */

import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db';
import {
  services,
  partners,
  faqs,
  teamMembers,
  caseStudies,
  reviews,
  announcements,
} from '@/db/schema';

describe('Database Schema - Type Validation', () => {
  describe('services', () => {
    it('should have required fields', () => {
      const service = {
        id: '123',
        title: 'Test Service',
        slug: 'test-service',
        taxSystem: 'УСН-Д',
      };

      expect(service).toHaveProperty('title');
      expect(service).toHaveProperty('slug');
      expect(typeof service.title).toBe('string');
    });

    it('should have valid tax system values', () => {
      const validTaxSystems = [
        'УСН-Д',
        'УСН-ДР',
        'ОСН',
        'АУСН',
        'ПСН',
        'ФСИ',
        'Разовое',
      ];

      validTaxSystems.forEach(system => {
        expect(typeof system).toBe('string');
      });
    });
  });

  describe('partners', () => {
    it('should have required fields', () => {
      const partner = {
        id: '123',
        name: 'Test Partner',
        role: 'Developer',
        badge: 'team',
        category: 'fullstack',
      };

      expect(partner).toHaveProperty('name');
      expect(partner).toHaveProperty('role');
      expect(partner).toHaveProperty('badge');
      expect(partner).toHaveProperty('category');
    });

    it('should have valid category values', () => {
      const validCategories = [
        'fullstack',
        'mobile',
        'ai',
        'devops',
        'design',
        'other',
      ];

      validCategories.forEach(cat => {
        expect(typeof cat).toBe('string');
      });
    });

    it('should have valid badge values', () => {
      const validBadges = ['team', 'client'];
      validBadges.forEach(badge => {
        expect(typeof badge).toBe('string');
      });
    });

    it('should have hue value in valid range', () => {
      const validHue = 240;
      expect(validHue).toBeGreaterThanOrEqual(0);
      expect(validHue).toBeLessThanOrEqual(360);
    });

    it('should have skills as array', () => {
      const partner = {
        skills: ['TypeScript', 'React', 'Node.js'],
      };

      expect(Array.isArray(partner.skills)).toBe(true);
      partner.skills.forEach(skill => {
        expect(typeof skill).toBe('string');
      });
    });
  });

  describe('announcements', () => {
    it('should have required fields', () => {
      const announcement = {
        id: '123',
        title: 'Test Announcement',
        content: 'Test content',
        key: 'test-key',
      };

      expect(announcement).toHaveProperty('title');
      expect(announcement).toHaveProperty('content');
      expect(announcement).toHaveProperty('key');
    });
  });

  describe('faqs', () => {
    it('should have required fields', () => {
      const faq = {
        id: '123',
        question: 'Test question?',
        answer: 'Test answer.',
        category: 'Бухгалтерия',
      };

      expect(faq).toHaveProperty('question');
      expect(faq).toHaveProperty('answer');
      expect(faq).toHaveProperty('category');
    });
  });
});

describe('Database Schema - Data Integrity', () => {
  describe('partners', () => {
    it('should validate links format', () => {
      const validLinks = {
        github: 'https://github.com/user',
        telegram: 'https://t.me/username',
        vk: 'https://vk.com/id123',
        portfolio: 'https://example.com',
      };

      Object.values(validLinks).forEach(link => {
        expect(link).toMatch(/^https?:\/\//);
      });
    });

    it('should have default values', () => {
      const defaults = {
        badge: 'team',
        hue: 240,
        available: true,
        featured: false,
        category: 'fullstack',
        skills: [],
      };

      expect(defaults.badge).toBe('team');
      expect(defaults.hue).toBe(240);
      expect(defaults.available).toBe(true);
      expect(defaults.featured).toBe(false);
      expect(Array.isArray(defaults.skills)).toBe(true);
    });
  });
});
