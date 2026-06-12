import { describe, it, expect } from 'vitest'
import { validateModuleName, generateModulePath, parseCliArgs } from '../src/core/cli'

describe('CLI Module Generation', () => {
  describe('validateModuleName', () => {
    it('should accept valid lowercase name', () => {
      expect(validateModuleName('accounts')).toBe(true)
    })

    it('should accept name with numbers', () => {
      expect(validateModuleName('module2')).toBe(true)
    })

    it('should accept name with hyphens', () => {
      expect(validateModuleName('my-module')).toBe(true)
    })

    it('should accept name with underscores', () => {
      expect(validateModuleName('my_module')).toBe(true)
    })

    it('should reject name starting with uppercase', () => {
      expect(validateModuleName('Accounts')).toBe(false)
    })

    it('should reject name with spaces', () => {
      expect(validateModuleName('my module')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(validateModuleName('')).toBe(false)
    })
  })

  describe('generateModulePath', () => {
    it('should generate correct path', () => {
      expect(generateModulePath('test')).toBe('src/modules/test')
    })
  })

  describe('parseCliArgs', () => {
    it('should parse valid args', () => {
      const result = parseCliArgs(['my-module'])
      expect(result).toEqual({ name: 'my-module' })
    })

    it('should throw on empty args', () => {
      expect(() => parseCliArgs([])).toThrow('Module name is required')
    })

    it('should throw on invalid name', () => {
      expect(() => parseCliArgs(['Invalid'])).toThrow('Invalid module name')
    })
  })
})
