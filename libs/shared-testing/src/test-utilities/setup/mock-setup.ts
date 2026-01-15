// This file is deprecated - global mocks have been removed
// All mocking is now handled through dependency injection overrides
// in individual test files using TestModuleBuilder and MockFactory

// This file is kept for backward compatibility but should not be used
// for new tests. Use the following patterns instead:
//
// For unit tests:
//   TestModuleBuilder.forService(MyService).withMocks([...])
//
// For integration tests:
//   TestModuleBuilder.forModule(MyModule).withMocks([...])
//
// For E2E tests:
//   TestApplicationFactory.create().withMocks([...])

export const DEPRECATED_MOCK_SETUP = 'Use dependency injection overrides instead of global mocks';