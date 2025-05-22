import { NextRequest } from 'next/server'; // Keep this

// Mock the global fetch function
global.fetch = jest.fn();

describe('POST /api/roast', () => {
  const originalEnv = { ...process.env }; // Deep copy original env

  // Define a helper to mock NextRequest
  const mockRequest = (body: any) => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  let POST_handler: any; // To hold the dynamically imported POST handler

  beforeEach(() => {
    jest.resetModules(); // Reset modules before each test to re-evaluate module-level constants
    process.env = { ...originalEnv }; // Restore original environment variables
    (fetch as jest.Mock).mockClear(); // Clear fetch mock calls and history
  });

  afterAll(() => {
    process.env = { ...originalEnv }; // Ensure original env is restored
    jest.restoreAllMocks(); // Restore all mocks
  });

  describe('when OPENROUTER_API_KEY is set', () => {
    beforeEach(async () => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      // Dynamically import the route to get the POST handler with the updated environment variable
      const routeModule = await import('./route');
      POST_handler = routeModule.POST;
    });

    it('should successfully generate a roast', async () => {
      const mockRequestBody = {
        image: 'data:image/png;base64,testimage',
        model: 'gpt-4.1',
        intensity: '7',
      };
      const mockOpenRouterResponse = {
        choices: [{ message: { content: 'This is a test roast.' } }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpenRouterResponse,
        status: 200,
      });

      const request = mockRequest(mockRequestBody);
      const response = await POST_handler(request); // Use the dynamically imported handler
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.roast).toBe('This is a test roast.');
      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': `Bearer test-key`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4.1',
            messages: [
              {
                role: 'system',
                content: 'You are a playful AI roastmaster. Always keep it fun and never mean-spirited.',
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: `Roast this person based on their appearance in the image. Be witty, creative, and funny. Intensity: 7/10. Keep it lighthearted and not mean-spirited.` },
                  { type: 'image_url', image_url: { url: 'data:image/png;base64,testimage' } },
                ],
              },
            ],
            max_tokens: 200,
          }),
        })
      );
    });

    it('should return 400 if an unsupported model is provided', async () => {
      const request = mockRequest({ image: 'test-image', model: 'unsupported-model', intensity: '5' });
      const response = await POST_handler(request); // Use the dynamically imported handler
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.error).toBe('Unsupported model.');
    });

    it('should return "No roast generated." if OpenRouter returns no content', async () => {
      const mockRequestBody = {
        image: 'data:image/png;base64,testimage',
        model: 'gpt-4.1',
        intensity: '7',
      };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: null } }] }),
        status: 200,
      });

      const request = mockRequest(mockRequestBody);
      const response = await POST_handler(request); // Use the dynamically imported handler
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.roast).toBe('No roast generated.');
    });

    it('should return "No roast generated." if OpenRouter returns empty choices', async () => {
      const mockRequestBody = {
        image: 'data:image/png;base64,testimage',
        model: 'gpt-4.1',
        intensity: '7',
      };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [] }), // Empty choices array
        status: 200,
      });

      const request = mockRequest(mockRequestBody);
      const response = await POST_handler(request);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.roast).toBe('No roast generated.');
    });

    it('should return 500 if OpenRouter API call fails', async () => {
      const mockRequestBody = {
        image: 'data:image/png;base64,testimage',
        model: 'gpt-4.1',
        intensity: '7',
      };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'OpenRouter API Error (from json)' }), // Mock for .json()
        text: async () => ('OpenRouter API Error (from text)'), // Mock for .text()
        status: 500,
      });

      const request = mockRequest(mockRequestBody);
      const response = await POST_handler(request); // Use the dynamically imported handler
      const responseBody = await response.json();

      expect(response.status).toBe(500);
      expect(responseBody.error).toBe('Internal server error.');
    });
  });

  describe('when OPENROUTER_API_KEY is NOT set', () => {
    beforeEach(async () => {
      delete process.env.OPENROUTER_API_KEY; // Ensure key is not set
      // Dynamically import the route to get the POST handler with the updated environment variable
      const routeModule = await import('./route');
      POST_handler = routeModule.POST;
    });

    it('should return 500 if OPENROUTER_API_KEY is not configured', async () => {
      const request = mockRequest({ image: 'test-image', model: 'gpt-4.1', intensity: '5' });
      const response = await POST_handler(request); // Use the dynamically imported handler
      const responseBody = await response.json();

      expect(response.status).toBe(500);
      expect(responseBody.error).toBe('OpenRouter API key not configured.');
    });
  });

  // Tests that do not depend on OPENROUTER_API_KEY (or where its absence is part of the test)
  // These can also dynamically import if they were affected by module-level constants,
  // but OPENROUTER_API_KEY is the primary concern here.
  // For simplicity, if these tests pass without dynamic import after key is set/unset,
  // they might not need it, but for consistency, it's safer.
  // Let's assume these are fine for now as they test for missing body fields,
  // which occurs before the API key check. If they fail, they'll need the dynamic import too.

  it('should return 400 if image is missing', async () => {
    // This test doesn't strictly need OPENROUTER_API_KEY to be set or unset
    // as it should fail before the key check.
    // However, to be safe and consistent with module reloading:
    const routeModule = await import('./route');
    POST_handler = routeModule.POST;
    const request = mockRequest({ model: 'gpt-4.1', intensity: '5' });
    const response = await POST_handler(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('Missing required fields.');
  });

  it('should return 400 if model is missing', async () => {
    const routeModule = await import('./route');
    POST_handler = routeModule.POST;
    const request = mockRequest({ image: 'test-image', intensity: '5' });
    const response = await POST_handler(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('Missing required fields.');
  });

  it('should return 400 if intensity is missing', async () => {
    const routeModule = await import('./route');
    POST_handler = routeModule.POST;
    const request = mockRequest({ image: 'test-image', model: 'gpt-4.1' });
    const response = await POST_handler(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('Missing required fields.');
  });
});
