import { NextRequest, NextResponse } from 'next/server';

// Mock the global fetch function
global.fetch = jest.fn();

describe('POST /api/tts', () => {
  const originalEnv = { ...process.env }; // Deep copy original env

  const mockRequest = (body: any) => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  let POST_handler: any; // To hold the dynamically imported POST handler

  beforeEach(() => {
    jest.resetModules(); // Reset modules before each test
    process.env = { ...originalEnv }; // Restore original environment variables
    (fetch as jest.Mock).mockClear(); // Clear fetch mock calls and history
  });

  afterAll(() => {
    process.env = { ...originalEnv }; // Ensure original env is restored
    jest.restoreAllMocks(); // Restore all mocks
  });

  describe('when ELEVENLABS_API_KEY is set', () => {
    beforeEach(async () => {
      process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-key';
      const routeModule = await import('./route');
      POST_handler = routeModule.POST;
    });

    it('should successfully generate speech and return audio data', async () => {
      const mockText = 'Hello, world!';
      const mockAudioArrayBuffer = new ArrayBuffer(8); // Dummy ArrayBuffer
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockAudioArrayBuffer, // ElevenLabs returns audio data
        headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
      });

      const request = mockRequest({ text: mockText });
      const response = await POST_handler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
      const responseData = await response.arrayBuffer();
      expect(responseData).toEqual(mockAudioArrayBuffer);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.elevenlabs.io/v1/text-to-speech/'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': 'test-elevenlabs-key',
          },
          body: JSON.stringify({
            text: mockText,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        })
      );
    });

    it('should return error if ElevenLabs API call fails (e.g., bad request)', async () => {
      const mockErrorDetail = { detail: 'Invalid request or something from API' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorDetail, // ElevenLabs API error format
      });

      const request = mockRequest({ text: 'Test text' });
      const response = await POST_handler(request);
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.error).toBe(mockErrorDetail.detail);
    });
    
    it('should return error if ElevenLabs API call fails without specific detail', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 502, // Some other error
        json: async () => ({}), // No 'detail' field
      });

      const request = mockRequest({ text: 'Test text' });
      const response = await POST_handler(request);
      const responseBody = await response.json();

      expect(response.status).toBe(502);
      expect(responseBody.error).toBe('Failed to generate speech');
    });
  });

  describe('when ELEVENLABS_API_KEY is NOT set', () => {
    beforeEach(async () => {
      delete process.env.ELEVENLABS_API_KEY;
      const routeModule = await import('./route');
      POST_handler = routeModule.POST;
    });

    it('should return 500 if ELEVENLABS_API_KEY is not configured', async () => {
      const request = mockRequest({ text: 'Test text' });
      const response = await POST_handler(request);
      const responseBody = await response.json();

      expect(response.status).toBe(500);
      expect(responseBody.error).toBe('ElevenLabs API key not configured');
    });
  });

  it('should return 400 if text is not provided', async () => {
    // API key presence doesn't matter for this validation, but load module for POST_handler
    const routeModule = await import('./route');
    POST_handler = routeModule.POST;

    const request = mockRequest({}); // No text field
    const response = await POST_handler(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('No text provided');
  });

  it('should return 500 for unexpected errors during API call', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-key';
    const routeModule = await import('./route');
    POST_handler = routeModule.POST;

    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network connection error'));

    const request = mockRequest({ text: 'Test text' });
    const response = await POST_handler(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody.error).toBe('Internal server error');
  });
});
