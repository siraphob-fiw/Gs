import { vi } from 'vitest';
import { 
  MockFactory, 
  BaseMockFactory, 
  TestDataBuilder, 
  MockFactoryUtils 
} from '../factories/mock-factory';

// Test interfaces
interface TestUser {
  id: string;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

interface TestTenant {
  id: string;
  name: string;
  users: TestUser[];
  settings: {
    maxUsers: number;
    features: string[];
  };
}

// Test factory implementations
class TestUserFactory extends BaseMockFactory<TestUser> {
  create(overrides?: Partial<TestUser>): TestUser {
    const sequence = this.nextSequence();
    
    const defaults: TestUser = {
      id: `user-${sequence}`,
      name: `Test User ${sequence}`,
      email: `user${sequence}@example.com`,
      age: 25 + sequence,
      isActive: true
    };

    return this.mergeOverrides(defaults, overrides);
  }
}

class TestTenantFactory extends BaseMockFactory<TestTenant> {
  create(overrides?: Partial<TestTenant>): TestTenant {
    const sequence = this.nextSequence();
    
    const defaults: TestTenant = {
      id: `tenant-${sequence}`,
      name: `Test Tenant ${sequence}`,
      users: [],
      settings: {
        maxUsers: 100,
        features: ['basic', 'standard']
      }
    };

    return this.mergeOverrides(defaults, overrides);
  }
}

describe('MockFactory', () => {
  describe('BaseMockFactory', () => {
    let userFactory: TestUserFactory;

    beforeEach(() => {
      userFactory = new TestUserFactory();
    });

    it('should create entities with sequential IDs', () => {
      const user1 = userFactory.create();
      const user2 = userFactory.create();
      const user3 = userFactory.create();

      expect(user1.id).toBe('user-1');
      expect(user2.id).toBe('user-2');
      expect(user3.id).toBe('user-3');
    });

    it('should apply overrides correctly', () => {
      const user = userFactory.create({
        name: 'Custom Name',
        age: 30,
        isActive: false
      });

      expect(user.name).toBe('Custom Name');
      expect(user.age).toBe(30);
      expect(user.isActive).toBe(false);
      expect(user.id).toBe('user-1'); // Should still have generated ID
    });

    it('should create multiple entities', () => {
      const users = userFactory.createMany(3);

      expect(users).toHaveLength(3);
      expect(users[0].id).toBe('user-1');
      expect(users[1].id).toBe('user-2');
      expect(users[2].id).toBe('user-3');
    });

    it('should create multiple entities with overrides', () => {
      const users = userFactory.createMany(2, { isActive: false });

      expect(users).toHaveLength(2);
      expect(users[0].isActive).toBe(false);
      expect(users[1].isActive).toBe(false);
    });

    it('should reset sequence and cache', () => {
      userFactory.create();
      userFactory.create();
      
      userFactory.reset();
      
      const user = userFactory.create();
      expect(user.id).toBe('user-1'); // Should start from 1 again
    });

    it('should handle caching', () => {
      userFactory.setCached('test-key', 'test-value');
      expect(userFactory.getCached('test-key')).toBe('test-value');
      
      userFactory.reset();
      expect(userFactory.getCached('test-key')).toBeUndefined();
    });
  });

  describe('TestDataBuilder', () => {
    let builder: TestDataBuilder;
    let userFactory: TestUserFactory;
    let tenantFactory: TestTenantFactory;

    beforeEach(() => {
      builder = new TestDataBuilder();
      userFactory = new TestUserFactory();
      tenantFactory = new TestTenantFactory();
      
      builder.registerFactory('user', userFactory);
      builder.registerFactory('tenant', tenantFactory);
    });

    it('should register and retrieve factories', () => {
      expect(builder.hasFactory('user')).toBe(true);
      expect(builder.hasFactory('tenant')).toBe(true);
      expect(builder.hasFactory('nonexistent')).toBe(false);

      const retrievedFactory = builder.getFactory('user');
      expect(retrievedFactory).toBe(userFactory);
    });

    it('should list factory names', () => {
      const names = builder.getFactoryNames();
      expect(names).toContain('user');
      expect(names).toContain('tenant');
      expect(names).toHaveLength(2);
    });

    it('should throw error for non-existent factory', () => {
      expect(() => {
        builder.getFactory('nonexistent');
      }).toThrow('Factory not found: nonexistent');
    });

    it('should create related entities', () => {
      const { primary: tenant, related: users } = builder.createRelated(
        tenantFactory,
        userFactory,
        'users',
        3
      );

      expect(tenant.users).toHaveLength(3);
      expect(users).toHaveLength(3);
      expect(tenant.users).toEqual(users);
    });

    it('should create hierarchy of entities', () => {
      // Create a simple hierarchy factory for testing
      interface HierarchyNode {
        id: string;
        parent?: HierarchyNode;
        children: HierarchyNode[];
      }

      class HierarchyFactory extends BaseMockFactory<HierarchyNode> {
        create(overrides?: Partial<HierarchyNode>): HierarchyNode {
          const sequence = this.nextSequence();
          return this.mergeOverrides({
            id: `node-${sequence}`,
            children: []
          }, overrides);
        }
      }

      const hierarchyFactory = new HierarchyFactory();
      const root = builder.createHierarchy(
        hierarchyFactory,
        'parent',
        'children',
        2, // depth
        2  // children per level
      );

      expect(root.children).toHaveLength(2);
      expect(root.children[0].children).toHaveLength(2);
      expect(root.children[1].children).toHaveLength(2);
    });

    it('should create circular relationships', () => {
      interface CircularA {
        id: string;
        b?: CircularB;
      }

      interface CircularB {
        id: string;
        a?: CircularA;
      }

      class CircularAFactory extends BaseMockFactory<CircularA> {
        create(overrides?: Partial<CircularA>): CircularA {
          return this.mergeOverrides({
            id: `a-${this.nextSequence()}`
          }, overrides);
        }
      }

      class CircularBFactory extends BaseMockFactory<CircularB> {
        create(overrides?: Partial<CircularB>): CircularB {
          return this.mergeOverrides({
            id: `b-${this.nextSequence()}`
          }, overrides);
        }
      }

      const aFactory = new CircularAFactory();
      const bFactory = new CircularBFactory();

      const { primary: a, related: b } = builder.createCircularRelationship(
        aFactory,
        bFactory,
        'b',
        'a'
      );

      expect(a.b).toBe(b);
      expect(b.a).toBe(a);
    });

    it('should create batch with relationships', () => {
      const { primaries: tenants, related: allUsers } = builder.createBatchWithRelationships(
        tenantFactory,
        userFactory,
        3,
        (tenant, users) => {
          tenant.users = users;
          users.forEach(user => {
            user.email = `${user.name.toLowerCase().replace(/\s+/g, '')}@${tenant.name.toLowerCase().replace(/\s+/g, '')}.com`;
          });
        }
      );

      expect(tenants).toHaveLength(3);
      expect(allUsers.length).toBeGreaterThan(0);
      
      tenants.forEach(tenant => {
        expect(tenant.users.length).toBeGreaterThan(0);
        tenant.users.forEach(user => {
          expect(user.email).toContain(tenant.name.toLowerCase().replace(/\s+/g, ''));
        });
      });
    });

    it('should reset all factories', () => {
      userFactory.create();
      tenantFactory.create();

      builder.resetAll();

      const user = userFactory.create();
      const tenant = tenantFactory.create();

      expect(user.id).toBe('user-1');
      expect(tenant.id).toBe('tenant-1');
    });

    it('should create and restore snapshots', () => {
      userFactory.create();
      userFactory.create();
      tenantFactory.create();

      const snapshot = builder.createSnapshot();
      
      userFactory.create(); // This should increment sequence
      
      builder.restoreSnapshot(snapshot);
      
      const nextUser = userFactory.create();
      expect(nextUser.id).toBe('user-3'); // Should continue from snapshot state
    });

    it('should clear factories', () => {
      expect(builder.hasFactory('user')).toBe(true);
      
      builder.clearFactories();
      
      expect(builder.hasFactory('user')).toBe(false);
      expect(builder.getFactoryNames()).toHaveLength(0);
    });
  });

  describe('MockFactoryUtils', () => {
    it('should create factory from template', () => {
      const template: TestUser = {
        id: 'template-id',
        name: 'Template User',
        email: 'template@example.com',
        age: 25,
        isActive: true
      };

      const factory = MockFactoryUtils.fromTemplate(template);
      const user = factory.create();

      expect(user).toEqual(template);
      expect(user).not.toBe(template); // Should be a different object
    });

    it('should create factory with generator', () => {
      const factory = MockFactoryUtils.withGenerator<TestUser>((sequence) => ({
        id: `generated-${sequence}`,
        name: `Generated User ${sequence}`,
        email: `generated${sequence}@example.com`,
        age: 20 + sequence,
        isActive: sequence % 2 === 0
      }));

      const user1 = factory.create();
      const user2 = factory.create();

      expect(user1.id).toBe('generated-1');
      expect(user1.isActive).toBe(false); // sequence 1 % 2 !== 0
      expect(user2.id).toBe('generated-2');
      expect(user2.isActive).toBe(true); // sequence 2 % 2 === 0
    });

    it('should create factory with cycle', () => {
      const values = [
        { id: '1', name: 'First' },
        { id: '2', name: 'Second' },
        { id: '3', name: 'Third' }
      ];

      const factory = MockFactoryUtils.withCycle(values);

      const result1 = factory.create();
      const result2 = factory.create();
      const result3 = factory.create();
      const result4 = factory.create(); // Should cycle back to first

      expect(result1.name).toBe('First');
      expect(result2.name).toBe('Second');
      expect(result3.name).toBe('Third');
      expect(result4.name).toBe('First');
    });

    it('should create factory with random choice', () => {
      const values = [
        { id: '1', name: 'Option1' },
        { id: '2', name: 'Option2' },
        { id: '3', name: 'Option3' }
      ];

      const factory = MockFactoryUtils.withRandomChoice(values);

      // Create multiple entities and verify they're from the available options
      const results = Array.from({ length: 10 }, () => factory.create());
      
      results.forEach(result => {
        expect(values.some(v => v.name === result.name)).toBe(true);
      });
    });

    it('should create factory with condition', () => {
      const trueFactory = MockFactoryUtils.fromTemplate({ type: 'true', value: 1 });
      const falseFactory = MockFactoryUtils.fromTemplate({ type: 'false', value: 0 });

      const conditionalFactory = MockFactoryUtils.withCondition(
        (sequence) => sequence % 2 === 0,
        trueFactory,
        falseFactory
      );

      const result1 = conditionalFactory.create(); // sequence 1, odd
      const result2 = conditionalFactory.create(); // sequence 2, even

      expect(result1.type).toBe('false');
      expect(result2.type).toBe('true');
    });

    it('should create factory with transform', () => {
      const baseFactory = MockFactoryUtils.fromTemplate({
        firstName: 'John',
        lastName: 'Doe'
      });

      const transformedFactory = MockFactoryUtils.withTransform(
        baseFactory,
        (base) => ({
          fullName: `${base.firstName} ${base.lastName}`,
          initials: `${base.firstName[0]}${base.lastName[0]}`
        })
      );

      const result = transformedFactory.create();

      expect(result.fullName).toBe('John Doe');
      expect(result.initials).toBe('JD');
    });

    it('should create composite factory', () => {
      const nameFactory = MockFactoryUtils.fromTemplate({ name: 'Test Name' });
      const emailFactory = MockFactoryUtils.fromTemplate({ email: 'test@example.com' });
      const ageFactory = MockFactoryUtils.fromTemplate({ age: 25 });

      const compositeFactory = MockFactoryUtils.composite([
        nameFactory,
        emailFactory,
        ageFactory
      ]);

      const result = compositeFactory.create();

      expect(result.name).toBe('Test Name');
      expect(result.email).toBe('test@example.com');
      expect(result.age).toBe(25);
    });

    it('should create factory with validation', () => {
      const baseFactory = MockFactoryUtils.withGenerator<{ value: number }>(() => ({
        value: Math.floor(Math.random() * 100)
      }));

      const validatedFactory = MockFactoryUtils.withValidation(
        baseFactory,
        (entity) => entity.value > 50,
        100
      );

      const result = validatedFactory.create();
      expect(result.value).toBeGreaterThan(50);
    });

    it('should create factory with tracking', () => {
      const baseFactory = MockFactoryUtils.fromTemplate({ id: 'test', name: 'Test' });
      const trackingFactory = MockFactoryUtils.withTracking(baseFactory);

      trackingFactory.create();
      trackingFactory.create();
      trackingFactory.create();

      const generated = trackingFactory.getGenerated();
      expect(generated).toHaveLength(3);

      trackingFactory.clearTracking();
      expect(trackingFactory.getGenerated()).toHaveLength(0);
    });

    it('should throw error for empty cycle values', () => {
      expect(() => {
        MockFactoryUtils.withCycle([]);
      }).toThrow('Values array cannot be empty');
    });

    it('should throw error for empty random choice values', () => {
      expect(() => {
        MockFactoryUtils.withRandomChoice([]);
      }).toThrow('Values array cannot be empty');
    });
  });
});