import '@testing-library/jest-dom/vitest';

/**
 * `VITE_API_BASE_URL` is required by the API client, which throws without it.
 * Tests get a fixed value so the thrown-configuration path is exercised
 * deliberately rather than by accident.
 */
(import.meta.env as Record<string, string>).VITE_API_BASE_URL = 'http://127.0.0.1:4000';
