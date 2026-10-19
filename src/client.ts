import type { SevkFetch, SevkOptions } from "./client-options"
import { fromResponse, SevkError } from "./errors"
import { VERSION } from "./version"

export class Client {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeout: number
  private readonly fetch: SevkFetch

  constructor(apiKey: string, options: SevkOptions = {}) {
    this.apiKey = apiKey
    this.baseUrl = (options.baseUrl || "https://api.sevk.io").replace(/\/+$/, "")
    this.timeout = options.timeout ?? 30000
    this.fetch = options.fetch ?? globalThis.fetch
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": `sevk-node/${VERSION}`,
      ...options.headers
    }

    const controller = new AbortController()
    let timedOut = false
    const timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, this.timeout)

    try {
      const response = await this.fetch(url, {
        ...options,
        redirect: "manual",
        headers,
        signal: controller.signal
      })

      if (!response.ok) {
        const text = await response.text()
        let body: unknown = text
        try {
          body = JSON.parse(text)
        } catch {
          body = text
        }
        throw fromResponse(response.status, response.headers, body)
      }

      if (response.status === 204) {
        return {} as T
      }

      const text = await response.text()
      if (!text.trim()) {
        throw new SevkError(
          "Expected a JSON response body but received an empty response",
          response.status,
          "INVALID_RESPONSE",
          text
        )
      }
      try {
        const data: unknown = JSON.parse(text)
        if (data === null || typeof data !== "object" || Array.isArray(data)) {
          throw new Error("JSON root is not an object")
        }
        return data as T
      } catch {
        throw new SevkError(
          "Expected a JSON response body but received malformed JSON",
          response.status,
          "INVALID_RESPONSE",
          text
        )
      }
    } catch (error: unknown) {
      if (error instanceof SevkError) {
        throw error
      }
      if (timedOut && error instanceof Error && error.name === "AbortError") {
        throw new SevkError(
          `Request timeout after ${this.timeout}ms`,
          0,
          "TIMEOUT",
          undefined,
          undefined,
          undefined,
          { cause: error }
        )
      }
      throw new SevkError(
        error instanceof Error ? error.message : "Request failed",
        0,
        error instanceof Error && error.name === "AbortError" ? "REQUEST_CANCELLED" : "NETWORK_ERROR",
        undefined,
        undefined,
        undefined,
        { cause: error }
      )
    } finally {
      clearTimeout(timeoutId)
    }
  }
  private encodeBody(data: unknown): string | undefined {
    try {
      return JSON.stringify(data)
    } catch (cause: unknown) {
      throw new SevkError(
        cause instanceof Error ? cause.message : "Request body cannot be encoded as JSON",
        0,
        "SERIALIZATION_ERROR",
        undefined,
        undefined,
        undefined,
        { cause }
      )
    }
  }

  async get<T>(path: string, params?: object): Promise<T> {
    const entries = params
      ? Object.entries(params).filter(
          ([, value]) => value !== undefined && value !== null
        )
      : []
    const queryString = entries.length
      ? "?" +
        new URLSearchParams(
          entries.map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(",") : String(value)
          ])
        ).toString()
      : ""
    return this.request<T>(`${path}${queryString}`, { method: "GET" })
  }
  async post<T>(
    path: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: this.encodeBody(data),
      headers
    })
  }
  async put<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: this.encodeBody(data)
    })
  }
  async patch<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: this.encodeBody(data)
    })
  }
  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" })
  }
}
