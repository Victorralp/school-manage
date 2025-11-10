import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase before any imports
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  orderBy: vi.fn()
}));

// Import after mocking
const { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc 
} = await import('firebase/firestore');

const { migrateExistingTeachers, validateMigration } = await import('../migrationScript');

describe('Migration Script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('migrateExistingTeachers', () => {
    it('should create subscriptions for all teachers', async () => {
      // Mock teachers data
      const mockTeachers = [
        {
          id: 'teacher1',
          data: () => ({
            name: 'John Doe',
            email: 'john@test.com',
            role: 'teacher',
            schoolId: 'school1',
            status: 'active'
          })
        },
        {
          id: 'teacher2',
          data: () => ({
            name: 'Jane Smith',
            email: 'jane@test.com',
            role: 'teacher',
            schoolId: 'school1',
            status: 'active'
          })
        }
      ];

      // Mock Firestore queries
      getDocs.mockImplementation((queryRef) => {
        // Teachers query
        if (queryRef === 'teachersQuery') {
          return Promise.resolve({
            size: 2,
            docs: mockTeachers
          });
        }
        // Exams query
        if (queryRef === 'examsQuery') {
          return Promise.resolve({ size: 2 });
        }
        // Students query
        if (queryRef === 'studentsQuery') {
          return Promise.resolve({ size: 5 });
        }
        return Promise.resolve({ size: 0, docs: [] });
      });

      query.mockReturnValue('teachersQuery');
      getDoc.mockResolvedValue({ exists: () => false });
      setDoc.mockResolvedValue(undefined);

      const results = await migrateExistingTeachers();

      expect(results.total).toBe(2);
      expect(results.created).toBeGreaterThan(0);
      expect(results.failed).toBe(0);
    });

    it('should skip teachers with existing subscriptions', async () => {
      const mockTeachers = [
        {
          id: 'teacher1',
          data: () => ({
            name: 'John Doe',
            role: 'teacher',
            schoolId: 'school1'
          })
        }
      ];

      getDocs.mockResolvedValue({
        size: 1,
        docs: mockTeachers
      });

      query.mockReturnValue('query');
      
      // Mock existing subscription
      getDoc.mockResolvedValue({ 
        exists: () => true,
        data: () => ({
          planTier: 'free',
          currentSubjects: 0,
          currentStudents: 0
        })
      });

      const results = await migrateExistingTeachers();

      expect(results.skipped).toBeGreaterThan(0);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should handle teachers with no subjects or students', async () => {
      const mockTeachers = [
        {
          id: 'teacher1',
          data: () => ({
            name: 'New Teacher',
            role: 'teacher',
            schoolId: null
          })
        }
      ];

      getDocs.mockImplementation((queryRef) => {
        if (queryRef === 'teachersQuery') {
          return Promise.resolve({
            size: 1,
            docs: mockTeachers
          });
        }
        return Promise.resolve({ size: 0, docs: [] });
      });

      query.mockReturnValue('teachersQuery');
      getDoc.mockResolvedValue({ exists: () => false });
      setDoc.mockResolvedValue(undefined);

      const results = await migrateExistingTeachers();

      expect(results.created).toBeGreaterThan(0);
      
      // Verify the call was made with correct structure
      const callArgs = setDoc.mock.calls[0][1];
      expect(callArgs).toMatchObject({
        planTier: 'free',
        subjectLimit: 3,
        studentLimit: 10,
        amount: 0,
        currency: 'NGN',
        status: 'active'
      });
      expect(callArgs.currentSubjects).toBeGreaterThanOrEqual(0);
      expect(callArgs.currentStudents).toBeGreaterThanOrEqual(0);
    });

    it('should set correct Free plan limits', async () => {
      const mockTeachers = [
        {
          id: 'teacher1',
          data: () => ({
            name: 'Teacher',
            role: 'teacher'
          })
        }
      ];

      getDocs.mockImplementation((queryRef) => {
        if (queryRef === 'teachersQuery') {
          return Promise.resolve({
            size: 1,
            docs: mockTeachers
          });
        }
        return Promise.resolve({ size: 0 });
      });

      query.mockReturnValue('teachersQuery');
      getDoc.mockResolvedValue({ exists: () => false });
      setDoc.mockResolvedValue(undefined);

      await migrateExistingTeachers();

      const callArgs = setDoc.mock.calls[0][1];
      expect(callArgs).toMatchObject({
        planTier: 'free',
        subjectLimit: 3,
        studentLimit: 10,
        amount: 0,
        currency: 'NGN',
        status: 'active'
      });
    });

    it('should handle errors gracefully', async () => {
      const mockTeachers = [
        {
          id: 'teacher1',
          data: () => ({ name: 'Teacher 1', role: 'teacher' })
        },
        {
          id: 'teacher2',
          data: () => ({ name: 'Teacher 2', role: 'teacher' })
        }
      ];

      getDocs.mockResolvedValue({
        size: 2,
        docs: mockTeachers
      });

      query.mockReturnValue('query');
      getDoc.mockResolvedValue({ exists: () => false });
      
      // First call succeeds, second fails
      setDoc
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Firestore error'));

      const results = await migrateExistingTeachers();

      expect(results.failed).toBeGreaterThan(0);
      expect(results.errors).toHaveLength(1);
      expect(results.errors[0]).toHaveProperty('error');
    });

    it('should count subjects correctly for each teacher', async () => {
      const mockTeachers = [
        {
          id: 'teacher1',
          data: () => ({ name: 'Teacher 1', role: 'teacher' })
        }
      ];

      let callCount = 0;
      getDocs.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Teachers query
          return Promise.resolve({
            size: 1,
            docs: mockTeachers
          });
        } else if (callCount === 2) {
          // Exams query for teacher1
          return Promise.resolve({ size: 5 });
        } else {
          // Students query
          return Promise.resolve({ size: 0 });
        }
      });

      query.mockReturnValue('query');
      getDoc.mockResolvedValue({ exists: () => false });
      setDoc.mockResolvedValue(undefined);

      await migrateExistingTeachers();

      const callArgs = setDoc.mock.calls[0][1];
      expect(callArgs.currentSubjects).toBe(5);
    });

    it('should count students correctly for each teacher', async () => {
      const mockTeachers = [
        {
          id: 'teacher1',
          data: () => ({ 
            name: 'Teacher 1', 
            role: 'teacher',
            schoolId: 'school1'
          })
        }
      ];

      let callCount = 0;
      getDocs.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Teachers query
          return Promise.resolve({
            size: 1,
            docs: mockTeachers
          });
        } else if (callCount === 2) {
          // Exams query
          return Promise.resolve({ size: 0 });
        } else {
          // Students query
          return Promise.resolve({ size: 12 });
        }
      });

      query.mockReturnValue('query');
      getDoc.mockResolvedValue({ exists: () => false });
      setDoc.mockResolvedValue(undefined);

      await migrateExistingTeachers();

      const callArgs = setDoc.mock.calls[0][1];
      expect(callArgs.currentStudents).toBe(12);
    });
  });

  describe('validateMigration', () => {
    it('should validate all teachers have subscriptions', async () => {
      const mockTeachers = [
        {
          id: 'teacher1',
          data: () => ({ name: 'Teacher 1', role: 'teacher' })
        }
      ];

      getDocs.mockImplementation((queryRef) => {
        // Teachers query
        if (queryRef === 'teachersQuery') {
          return Promise.resolve({
            size: 1,
            docs: mockTeachers
          });
        }
        // Subscriptions query
        if (queryRef === 'subscriptionsQuery') {
          return Promise.resolve({
            size: 1,
            docs: []
          });
        }
        return Promise.resolve({ size: 0 });
      });

      query.mockReturnValue('teachersQuery');
      collection.mockReturnValue('subscriptionsQuery');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          currentSubjects: 2,
          currentStudents: 5
        })
      });

      const results = await validateMigration();

      expect(results.totalTeachers).toBe(1);
      expect(results.totalSubscriptions).toBe(1);
    });

    it('should detect teachers without subscriptions', async () => {
      const mockTeachers = [
        {
          id: 'teacher1',
          data: () => ({ name: 'Teacher 1', role: 'teacher' })
        }
      ];

      getDocs.mockImplementation(() => {
        return Promise.resolve({
          size: 1,
          docs: mockTeachers
        });
      });

      query.mockReturnValue('query');
      collection.mockReturnValue('collection');
      
      // No subscription exists
      getDoc.mockResolvedValue({
        exists: () => false
      });

      const results = await validateMigration();

      expect(results.teachersWithoutSubscriptions).toHaveLength(1);
      expect(results.teachersWithoutSubscriptions[0]).toHaveProperty('id', 'teacher1');
    });

    it('should detect incorrect usage counts', async () => {
      const mockTeachers = [
        {
          id: 'teacher1',
          data: () => ({ 
            name: 'Teacher 1', 
            role: 'teacher',
            schoolId: 'school1'
          })
        }
      ];

      let callCount = 0;
      getDocs.mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 2) {
          // Teachers and subscriptions queries
          return Promise.resolve({
            size: 1,
            docs: mockTeachers
          });
        } else if (callCount === 3) {
          // Actual exams count
          return Promise.resolve({ size: 5 });
        } else {
          // Actual students count
          return Promise.resolve({ size: 10 });
        }
      });

      query.mockReturnValue('query');
      collection.mockReturnValue('collection');
      
      // Subscription with incorrect counts
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          currentSubjects: 2, // Should be 5
          currentStudents: 8  // Should be 10
        })
      });

      const results = await validateMigration();

      expect(results.subscriptionsWithIncorrectCounts).toHaveLength(1);
      expect(results.subscriptionsWithIncorrectCounts[0]).toMatchObject({
        teacherId: 'teacher1',
        expected: { subjects: 5, students: 10 },
        actual: { subjects: 2, students: 8 }
      });
    });

    it('should pass validation when all data is correct', async () => {
      const mockTeachers = [
        {
          id: 'teacher1',
          data: () => ({ 
            name: 'Teacher 1', 
            role: 'teacher',
            schoolId: 'school1'
          })
        }
      ];

      let callCount = 0;
      getDocs.mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 2) {
          return Promise.resolve({
            size: 1,
            docs: mockTeachers
          });
        } else if (callCount === 3) {
          return Promise.resolve({ size: 3 });
        } else {
          return Promise.resolve({ size: 8 });
        }
      });

      query.mockReturnValue('query');
      collection.mockReturnValue('collection');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          currentSubjects: 3,
          currentStudents: 8
        })
      });

      const results = await validateMigration();

      expect(results.teachersWithoutSubscriptions).toHaveLength(0);
      expect(results.subscriptionsWithIncorrectCounts).toHaveLength(0);
    });
  });
});
