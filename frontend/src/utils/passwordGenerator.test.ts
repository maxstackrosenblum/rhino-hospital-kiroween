/**
 * Tests for password generation utility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  generatePassword, 
  generatePasswordOptions, 
  isCryptoAvailable, 
  getPasswordRequirements,
  type PasswordGenerationOptions 
} from './passwordGenerator';

describe('Password Generator', () => {
  beforeEach(() => {
    // Mock crypto.getRandomValues if not available in test environment
    if (!global.crypto) {
      global.crypto = {
        getRandomValues: (array: Uint32Array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 4294967296);
          }
          return array;
        }
      } as Crypto;
    }
  });

  describe('generatePassword', () => {
    it('should generate password meeting default policy requirements', () => {
      const result = generatePassword();
      
      expect(result.password.length).toBeGreaterThanOrEqual(12);
      expect(result.meetsPolicy).toBe(true);
      expect(result.policyErrors).toHaveLength(0);
      expect(result.strength).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });

    it('should generate password with specified length', () => {
      const options: PasswordGenerationOptions = { length: 16 };
      const result = generatePassword(options);
      
      expect(result.password.length).toBe(16);
    });

    it('should enforce minimum length even if smaller length requested', () => {
      const options: PasswordGenerationOptions = { length: 8 };
      const result = generatePassword(options);
      
      // Should enforce minimum of 12 characters
      expect(result.password.length).toBeGreaterThanOrEqual(12);
    });

    it('should include required character types', () => {
      const result = generatePassword();
      const password = result.password;
      
      expect(/[A-Z]/.test(password)).toBe(true); // uppercase
      expect(/[a-z]/.test(password)).toBe(true); // lowercase
      expect(/\d/.test(password)).toBe(true); // digit
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true); // special char
    });

    it('should respect character type options', () => {
      const options: PasswordGenerationOptions = {
        includeUppercase: false,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecialChars: false
      };
      
      const result = generatePassword(options);
      const password = result.password;
      
      expect(/[A-Z]/.test(password)).toBe(false); // no uppercase
      expect(/[a-z]/.test(password)).toBe(true); // has lowercase
      expect(/\d/.test(password)).toBe(true); // has digit
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(false); // no special
    });

    it('should generate different passwords on multiple calls', () => {
      const password1 = generatePassword().password;
      const password2 = generatePassword().password;
      const password3 = generatePassword().password;
      
      expect(password1).not.toBe(password2);
      expect(password2).not.toBe(password3);
      expect(password1).not.toBe(password3);
    });

    it('should calculate strength correctly', () => {
      const result = generatePassword({ length: 20 });
      
      expect(['weak', 'fair', 'good', 'strong', 'very_strong']).toContain(result.strength);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should throw error when no character sets enabled', () => {
      const options: PasswordGenerationOptions = {
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSpecialChars: false
      };
      
      expect(() => generatePassword(options)).toThrow('At least one character set must be enabled');
    });
  });

  describe('generatePasswordOptions', () => {
    it('should generate multiple password options', () => {
      const options = generatePasswordOptions(3);
      
      expect(options).toHaveLength(3);
      expect(options.every(opt => opt.meetsPolicy)).toBe(true);
      
      // Should be different passwords
      const passwords = options.map(opt => opt.password);
      expect(new Set(passwords).size).toBe(3);
    });

    it('should sort options by strength score', () => {
      const options = generatePasswordOptions(5);
      
      for (let i = 1; i < options.length; i++) {
        expect(options[i-1].score).toBeGreaterThanOrEqual(options[i].score);
      }
    });
  });

  describe('utility functions', () => {
    it('should detect crypto availability', () => {
      const isAvailable = isCryptoAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should return password requirements', () => {
      const requirements = getPasswordRequirements();
      
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements.some(req => req.includes('12 characters'))).toBe(true);
      expect(requirements.some(req => req.includes('uppercase'))).toBe(true);
      expect(requirements.some(req => req.includes('lowercase'))).toBe(true);
      expect(requirements.some(req => req.includes('number'))).toBe(true);
      expect(requirements.some(req => req.includes('special character'))).toBe(true);
    });
  });

  describe('policy validation', () => {
    it('should identify policy violations correctly', () => {
      const options: PasswordGenerationOptions = {
        length: 8, // Too short
        includeUppercase: false // Missing uppercase
      };
      
      const result = generatePassword(options);
      
      // Should enforce minimum length but respect character type options
      expect(result.password.length).toBeGreaterThanOrEqual(12);
      expect(/[A-Z]/.test(result.password)).toBe(false); // No uppercase as requested
      expect(result.meetsPolicy).toBe(false); // Should not meet policy without uppercase
      expect(result.policyErrors.some(error => error.includes('uppercase'))).toBe(true);
    });

    it('should handle edge cases gracefully', () => {
      // Test with custom special characters
      const options: PasswordGenerationOptions = {
        specialChars: '@#$'
      };
      
      const result = generatePassword(options);
      expect(result.meetsPolicy).toBe(true);
      expect(/[@#$]/.test(result.password)).toBe(true);
    });
  });
});