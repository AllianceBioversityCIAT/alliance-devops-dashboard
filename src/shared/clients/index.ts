/**
 * Placeholder HTTP client for external API integrations.
 * Real implementations will be added per integration spec.
 */

export interface HttpClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface HttpResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeoutMs: number;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.headers = options.headers ?? {};
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  async get<T = unknown>(path: string): Promise<HttpResponse<T>> {
    return this.request<T>('GET', path);
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<HttpResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<HttpResponse<T>> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const data = (await response.json()) as T;

      return {
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Placeholder Jenkins client — implement per specs/integrations/jenkins.md
 */
export class JenkinsClient extends HttpClient {
  constructor(baseUrl: string, apiToken: string) {
    super({
      baseUrl,
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });
  }

  async getBuildStatus(_jobName: string, _buildNumber: number): Promise<never> {
    throw new Error('JenkinsClient.getBuildStatus is not implemented — see specs/integrations/jenkins.md');
  }
}

/**
 * Placeholder Updown client — implement per specs/integrations/updown.md
 */
export class UpdownClient extends HttpClient {
  constructor(apiKey: string) {
    super({
      baseUrl: 'https://updown.io/api',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async listChecks(): Promise<never> {
    throw new Error('UpdownClient.listChecks is not implemented — see specs/integrations/updown.md');
  }
}
