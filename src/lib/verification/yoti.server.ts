import { createSign, randomUUID } from "crypto";

const YOTI_BASE = "https://api.yoti.com/idverify/v1";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      "Identity verification is being moved to a new provider and isn't available right now. Please check back shortly.",
    );
  }
  return value;
};

/**
 * Yoti authenticates requests with an RSA-SHA256 signature over
 * `METHOD&path?query[&base64(body)]`, sent as the X-Yoti-Auth-Digest header.
 */
function signedRequestHeaders(method: string, pathWithQuery: string, body?: string) {
  const pem = getEnv("YOTI_PEM_KEY");
  const messageParts = [method, pathWithQuery];
  if (body) messageParts.push(Buffer.from(body).toString("base64"));

  const signer = createSign("RSA-SHA256");
  signer.update(messageParts.join("&"));
  const digest = signer.sign(pem, "base64");

  return {
    "X-Yoti-Auth-Digest": digest,
    "X-Yoti-SDK": "Node",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function queryString(): string {
  const sdkId = getEnv("YOTI_SDK_ID");
  return `sdkId=${encodeURIComponent(sdkId)}&nonce=${randomUUID()}&timestamp=${Date.now()}`;
}

export type YotiSession = { url: string; sessionId: string };

/**
 * Creates a Yoti IDV session requiring a photo ID plus a liveness selfie, and
 * returns the hosted URL the member completes the checks on.
 */
export async function createYotiSession(options: {
  userId: string;
  returnUrl: string;
  notificationUrl: string;
}): Promise<YotiSession> {
  const query = queryString();
  const path = `/sessions?${query}`;

  const body = JSON.stringify({
    client_session_token_ttl: 60 * 60 * 24,
    resources_ttl: 60 * 60 * 24 * 7,
    user_tracking_id: options.userId,
    notifications: {
      endpoint: options.notificationUrl,
      topics: ["session_completion", "check_completion"],
      auth_type: "BASIC",
    },
    requested_checks: [
      { type: "ID_DOCUMENT_AUTHENTICITY", config: {} },
      { type: "ID_DOCUMENT_FACE_MATCH", config: { manual_check: "FALLBACK" } },
      { type: "LIVENESS", config: { liveness_type: "ZOOM", max_retries: 1 } },
    ],
    sdk_config: {
      allowed_capture_methods: "CAMERA_AND_UPLOAD",
      success_url: options.returnUrl,
      error_url: options.returnUrl,
      privacy_policy_url: "https://sendaclub.live/privacy",
    },
    required_documents: [
      {
        type: "ID_DOCUMENT",
        filter: {
          type: "DOCUMENT_RESTRICTIONS",
          inclusion: "WHITELIST",
          documents: [{ document_types: ["PASSPORT", "DRIVING_LICENCE", "NATIONAL_ID"] }],
        },
      },
    ],
  });

  const response = await fetch(`${YOTI_BASE}${path}`, {
    method: "POST",
    headers: signedRequestHeaders("POST", path, body),
    body,
  });

  if (!response.ok) {
    console.error("Yoti session creation failed", response.status, await response.text());
    throw new Error("Could not start verification. Please try again in a moment.");
  }

  const json = (await response.json()) as { session_id: string; client_session_token: string };
  const url = `${YOTI_BASE}/web/index.html?sessionID=${encodeURIComponent(json.session_id)}&sessionToken=${encodeURIComponent(json.client_session_token)}`;
  return { url, sessionId: json.session_id };
}

export type YotiSessionResult = {
  state: string;
  approved: boolean;
  dateOfBirth?: string;
  userTrackingId?: string;
};

/** Fetches a session so a webhook can decide whether the member passed. */
export async function fetchYotiSession(sessionId: string): Promise<YotiSessionResult> {
  const query = queryString();
  const path = `/sessions/${encodeURIComponent(sessionId)}?${query}`;

  const response = await fetch(`${YOTI_BASE}${path}`, {
    method: "GET",
    headers: signedRequestHeaders("GET", path),
  });
  if (!response.ok) {
    throw new Error(`Yoti session fetch failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    state: string;
    user_tracking_id?: string;
    checks?: Array<{ report?: { recommendation?: { value?: string } } }>;
    resources?: {
      id_documents?: Array<{
        document_fields?: { value?: { date_of_birth?: string } };
      }>;
    };
  };

  const checks = json.checks ?? [];
  const approved =
    json.state === "COMPLETED" &&
    checks.length > 0 &&
    checks.every((check) => check.report?.recommendation?.value === "APPROVE");

  return {
    state: json.state,
    approved,
    dateOfBirth: json.resources?.id_documents?.[0]?.document_fields?.value?.date_of_birth,
    userTrackingId: json.user_tracking_id,
  };
}
