import { Credentials, AuthType } from "../context/EndpointContext";

export interface FormState {
  error: string | null;
  success: boolean;
  shouldReset?: boolean;
  data?: {
    url: string;
    description: string;
    credentials: Credentials | null;
  };
}

export async function addEndpointAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const url = formData.get("url")?.toString().trim() || "";
  const description = formData.get("description")?.toString().trim() || "";
  const authType = (formData.get("authType")?.toString() || "none") as AuthType;

  if (!url) {
    return { error: "Please enter a URL", success: false };
  }

  try {
    new URL(url);
  } catch {
    return { error: "Please enter a valid URL (including http:// or https://)", success: false };
  }

  const getField = (name: string, fallback = "") => formData.get(name)?.toString() || fallback;

  const credentials: Credentials | null = authType === "none" ? null : {
    type: authType,
    ...(authType === "basic" && { username: getField("username"), password: getField("password") }),
    ...(authType === "bearer" && { token: getField("bearerToken") }),
    ...(authType === "apikey" && { headerName: getField("apiKeyName", "X-API-Key"), headerValue: getField("apiKeyValue") }),
  };

  return {
    success: true,
    data: { url, description, credentials },
    error: null,
  };
}
