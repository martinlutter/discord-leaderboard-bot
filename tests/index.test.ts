import { handler } from '../src/index';
import { InteractionResponseType, verifyKey } from 'discord-interactions';
import { InteractionType, MessageFlags } from 'discord-api-types/v10';
import { LambdaClient } from '@aws-sdk/client-lambda';
import type { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('discord-interactions', () => ({
  verifyKey: jest.fn(),
  InteractionResponseType: {
    PONG: 1,
    DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  },
}));

jest.mock('@aws-sdk/client-lambda', () => {
  const mockSend = jest.fn().mockResolvedValue({});
  return {
    LambdaClient: jest.fn(() => ({ send: mockSend })),
    InvokeCommand: jest.fn(),
    InvocationType: { Event: 'Event' },
  };
});

const mockVerifyKey = verifyKey as jest.MockedFunction<typeof verifyKey>;

function createEvent(body: object, headers: Record<string, string> = {}): APIGatewayProxyEvent {
  return {
    body: JSON.stringify(body),
    headers: {
      'x-signature-ed25519': 'sig123',
      'x-signature-timestamp': 'ts123',
      ...headers,
    },
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    multiValueHeaders: {},
  };
}

describe('index handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for invalid signature', async () => {
    mockVerifyKey.mockReturnValue(false as any);

    const event = createEvent({ type: InteractionType.Ping });
    const result = await handler(event);

    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body).message).toBe('Invalid request signature');
  });

  it('responds with PONG for ping interactions', async () => {
    mockVerifyKey.mockReturnValue(true as any);

    const event = createEvent({ type: InteractionType.Ping });
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).type).toBe(InteractionResponseType.PONG);
  });

  it('returns deferred response for valid application commands', async () => {
    mockVerifyKey.mockReturnValue(true as any);

    const event = createEvent({
      type: InteractionType.ApplicationCommand,
      data: { name: 'vote' },
    });
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.type).toBe(
      InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    );
    expect(body.data.flags).toBe(MessageFlags.Ephemeral);
  });

  it('returns 400 for unknown command', async () => {
    mockVerifyKey.mockReturnValue(true as any);

    const event = createEvent({
      type: InteractionType.ApplicationCommand,
      data: { name: 'nonexistent' },
    });
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Command not found');
  });

  it('returns 400 for unsupported interaction type', async () => {
    mockVerifyKey.mockReturnValue(true as any);

    const event = createEvent({ type: 99 });
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Not supported');
  });

  it('normalizes header keys to lowercase', async () => {
    mockVerifyKey.mockReturnValue(true as any);

    const event = createEvent({ type: InteractionType.Ping }, {
      'X-Signature-Ed25519': 'sig123',
      'X-Signature-Timestamp': 'ts123',
    });
    // Remove lowercase headers set by createEvent
    delete event.headers['x-signature-ed25519'];
    delete event.headers['x-signature-timestamp'];

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
  });
});
