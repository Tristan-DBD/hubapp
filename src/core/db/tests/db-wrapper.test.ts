import { describe, it, expect, beforeEach } from 'vitest'
import { dbManager } from '../db-manager'

describe('DB Wrapper', () => {
  beforeEach(() => {
    dbManager.clearAll()
  })

  describe('set/get', () => {
    it('should store and retrieve a string value', () => {
      const db = dbManager.getDB('accounts')
      db.set('name', 'test-value')
      expect(db.get('name')).toBe('test-value')
    })

    it('should store and retrieve a number', () => {
      const db = dbManager.getDB('accounts')
      db.set('count', 42)
      expect(db.get('count')).toBe(42)
    })

    it('should store and retrieve an object', () => {
      const db = dbManager.getDB('accounts')
      const obj = { key: 'value', num: 123 }
      db.set('data', obj)
      expect(db.get('data')).toEqual(obj)
    })

    it('should store and retrieve an array', () => {
      const db = dbManager.getDB('accounts')
      const arr = [1, 2, 3]
      db.set('items', arr)
      expect(db.get('items')).toEqual(arr)
    })
  })

  describe('delete', () => {
    it('should remove a stored value', () => {
      const db = dbManager.getDB('accounts')
      db.set('temp', 'value')
      expect(db.get('temp')).toBe('value')
      db.delete('temp')
      expect(db.get('temp')).toBeNull()
    })

    it('should not throw when deleting non-existent key', () => {
      const db = dbManager.getDB('accounts')
      expect(() => db.delete('nonexistent')).not.toThrow()
    })
  })

  describe('get null/undefined', () => {
    it('should return null for non-existent key', () => {
      const db = dbManager.getDB('accounts')
      expect(db.get('does-not-exist')).toBeNull()
    })
  })

  describe('namespace isolation', () => {
    it('should isolate storage between modules', () => {
      const dbA = dbManager.getDB('moduleA')
      const dbB = dbManager.getDB('moduleB')

      dbA.set('key', 'value-a')
      dbB.set('key', 'value-b')

      expect(dbA.get('key')).toBe('value-a')
      expect(dbB.get('key')).toBe('value-b')
    })

    it('should not leak data from one module to another', () => {
      const dbAccounts = dbManager.getDB('accounts')
      dbAccounts.set('salary', 5000)

      const dbNotes = dbManager.getDB('notes')
      expect(dbNotes.get('salary')).toBeNull()
    })
  })

  describe('DB Manager', () => {
    it('should return the same instance for the same module', () => {
      const db1 = dbManager.getDB('test')
      const db2 = dbManager.getDB('test')
      expect(db1).toBe(db2)
    })

    it('should return different instances for different modules', () => {
      const db1 = dbManager.getDB('moduleA')
      const db2 = dbManager.getDB('moduleB')
      expect(db1).not.toBe(db2)
    })

    it('should unregister a module', () => {
      dbManager.getDB('temp')
      dbManager.unregisterModule('temp')
      const dbNew = dbManager.getDB('temp')
      expect(dbNew).toBeDefined()
    })
  })
})
