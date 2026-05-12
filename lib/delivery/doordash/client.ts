import { getDoorDashCredentials, signDoorDashJwt } from './jwt'

// DoorDash Drive v2 — Delivery resource
// https://developer.doordash.com/en-US/api/drive

const DOORDASH_BASE_URL =
  process.env.DOORDASH_BASE_URL ?? 'https://openapi.doordash.com/drive/v2'

export interface DoorDashAddress {
  street: string
  city: string
  state: string
  zip_code: string
  country?: string
  unit?: string
}

export interface CreateDeliveryParams {
  external_delivery_id: string
  pickup_address: string
  pickup_business_name: string
  pickup_phone_number: string
  pickup_instructions?: string
  dropoff_address: string
  dropoff_business_name?: string
  dropoff_phone_number: string
  dropoff_instructions?: string
  dropoff_contact_given_name?: string
  dropoff_contact_family_name?: string
  order_value: number // cents — DoorDash requirement
  currency?: string
  tip?: number
  contactless_dropoff?: boolean
}

export interface DoorDashDelivery {
  external_delivery_id: string
  delivery_status: string
  tracking_url?: string
  fee?: number
  currency?: string
  pickup_time_estimated?: string
  dropoff_time_estimated?: string
  support_reference?: string
  // DoorDash error envelope
  code?: string
  message?: string
  field_errors?: Array<{ field: string; error: string }>
}

export class DoorDashApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly responseBody?: unknown
  ) {
    super(message)
    this.name = 'DoorDashApiError'
  }
}

async function doorDashFetch<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown
): Promise<{ data: T; statusCode: number; raw: unknown }> {
  const jwt = signDoorDashJwt(getDoorDashCredentials())

  const res = await fetch(`${DOORDASH_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const raw: unknown = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = raw as { code?: string; message?: string }
    throw new DoorDashApiError(
      err.message ?? `DoorDash request failed (${res.status})`,
      res.status,
      err.code,
      raw
    )
  }

  return { data: raw as T, statusCode: res.status, raw }
}

export async function createDelivery(params: CreateDeliveryParams) {
  return doorDashFetch<DoorDashDelivery>('POST', '/deliveries', {
    currency: 'USD',
    ...params,
  })
}

export async function getDelivery(externalDeliveryId: string) {
  return doorDashFetch<DoorDashDelivery>(
    'GET',
    `/deliveries/${encodeURIComponent(externalDeliveryId)}`
  )
}

// Maps DoorDash status values onto our internal enum.
const DOORDASH_STATUS_MAP: Record<string, string> = {
  created: 'created',
  quote: 'quoted',
  quoted: 'quoted',
  confirmed: 'confirmed',
  enroute_to_pickup: 'enroute_to_pickup',
  arrived_at_pickup: 'arrived_at_pickup',
  picked_up: 'picked_up',
  dasher_picked_up: 'picked_up',
  enroute_to_dropoff: 'enroute_to_dropoff',
  arrived_at_dropoff: 'arrived_at_dropoff',
  delivered: 'delivered',
  dropoff_complete: 'delivered',
  canceled: 'canceled',
  cancelled: 'canceled',
  returned: 'returned',
  failed: 'failed',
}

export function normalizeDeliveryStatus(raw: string | undefined | null): string | null {
  if (!raw) return null
  const key = raw.toLowerCase()
  return DOORDASH_STATUS_MAP[key] ?? key
}
