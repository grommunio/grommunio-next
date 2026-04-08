// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Client, GraphError, PageIterator, PageCollection } from "@microsoft/microsoft-graph-client";
import { graphClient } from "./utils";

// Typed helpers over the Graph SDK: paging, query options, error mapping.
// Plain OData only, so it works against any Graph-compatible backend.

export type QueryOptions = {
  select?: string[] | string;
  expand?: string[] | string;
  filter?: string;
  orderby?: string[] | string;
  search?: string;
  top?: number;
  skip?: number;
  count?: boolean;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function client(): Client {
  if (!graphClient) {
    throw new ApiError("Graph client has not been initialised", 0, "NotInitialised");
  }
  return graphClient;
}

export function normalizeError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (err instanceof GraphError) {
    const body: any = err.body ? safeParse(err.body) : undefined;
    return new ApiError(body?.error?.message || err.message || "Request failed", err.statusCode, body?.error?.code || err.code || undefined);
  }
  if (err instanceof Error) return new ApiError(err.message, 0);
  return new ApiError(String(err), 0);
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return undefined; }
}

const joinList = (v?: string[] | string) => Array.isArray(v) ? v.join(",") : v;

// Inner quotes and backslashes get a backslash
export const quoteSearch = (text: string) => `"${text.replace(/[\\"]/g, "\\$&")}"`;

export function request(path: string, options: QueryOptions = {}) {
  let req = client().api(path);
  const select = joinList(options.select);
  const expand = joinList(options.expand);
  const orderby = joinList(options.orderby);
  if (select) req = req.select(select);
  if (expand) req = req.expand(expand);
  if (options.filter) req = req.filter(options.filter);
  if (orderby) req = req.orderby(orderby);
  // The SDK does not encode query values, so &, # or + would break the URL
  if (options.search) req = req.search(encodeURIComponent(options.search));
  if (options.top !== undefined) req = req.top(options.top);
  if (options.skip !== undefined) req = req.skip(options.skip);
  if (options.count) req = req.count(true);
  if (options.headers) req = req.headers(options.headers);
  return req;
}

export async function get<T>(path: string, options?: QueryOptions): Promise<T> {
  try {
    return await request(path, options).get();
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function post<T>(path: string, body?: unknown, options?: QueryOptions): Promise<T> {
  try {
    return await request(path, options).post(body ?? null);
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function patch<T>(path: string, body: unknown, options?: QueryOptions): Promise<T> {
  try {
    return await request(path, options).patch(body);
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function put<T>(path: string, body: unknown, options?: QueryOptions): Promise<T> {
  try {
    return await request(path, options).put(body);
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function del(path: string): Promise<void> {
  try {
    await client().api(path).delete();
  } catch (err) {
    throw normalizeError(err);
  }
}

export type Page<T> = {
  value: T[];
  nextLink?: string;
  deltaLink?: string;
  count?: number;
};

export async function getPage<T>(path: string, options?: QueryOptions): Promise<Page<T>> {
  const response: PageCollection = await get(path, options);
  return toPage<T>(response);
}

/** Follows a @odata.nextLink */
export async function getNextPage<T>(nextLink: string): Promise<Page<T>> {
  const response: PageCollection = await get(nextLink);
  return toPage<T>(response);
}

export function toPage<T>(response: PageCollection): Page<T> {
  return {
    value: (response.value || []) as T[],
    nextLink: response["@odata.nextLink"],
    deltaLink: response["@odata.deltaLink"],
    count: response["@odata.count"],
  };
}

// limit guards against runaway paging
export async function getAll<T>(path: string, options?: QueryOptions, limit = 5000): Promise<T[]> {
  const result: T[] = [];
  try {
    const response: PageCollection = await request(path, options).get();
    const iterator = new PageIterator(client(), response, (item: T) => {
      result.push(item);
      return result.length < limit;
    });
    await iterator.iterate();
  } catch (err) {
    throw normalizeError(err);
  }
  return result;
}

export type BatchRequest = {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  dependsOn?: string[];
};

export type BatchResponse<T = any> = {
  id: string;
  status: number;
  body?: T;
  headers?: Record<string, string>;
};

// 20 requests per $batch call, failures only show up in each item's status
export async function batch<T = any>(requests: BatchRequest[]): Promise<BatchResponse<T>[]> {
  const results: BatchResponse<T>[] = [];
  for (let i = 0; i < requests.length; i += 20) {
    const chunk = requests.slice(i, i + 20).map(r => ({
      ...r,
      headers: r.body ? { "Content-Type": "application/json", ...(r.headers || {}) } : r.headers,
    }));
    try {
      const response = await client().api("/$batch").post({ requests: chunk });
      const byId = new Map<string, BatchResponse<T>>();
      (response.responses || []).forEach((r: BatchResponse<T>) => byId.set(r.id, r));
      chunk.forEach(r => results.push(byId.get(r.id) || { id: r.id, status: 0 }));
    } catch (err) {
      throw normalizeError(err);
    }
  }
  return results;
}

export async function getBlobUrl(path: string): Promise<string | null> {
  try {
    const blob: Blob = await client().api(path).responseType("blob" as any).get();
    return URL.createObjectURL(blob);
  } catch (err) {
    const e = normalizeError(err);
    if (e.status === 404) return null;
    throw e;
  }
}

export function odataString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
