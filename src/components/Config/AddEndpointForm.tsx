import React, { useState, useActionState } from "react";
import { Credentials, AuthType } from "../../context/EndpointContext";
import { addEndpointAction, FormState } from "../../utils/formUtils";

interface AddEndpointFormProps {
  onAddEndpoint: (url: string, description: string, credentials: Credentials | null) => void;
}

export function AddEndpointForm({ onAddEndpoint }: AddEndpointFormProps): React.ReactElement {
  const [showCredentials, setShowCredentials] = useState(false);
  const [authType, setAuthType] = useState<AuthType>("none");

  // React 19: useActionState for form handling with built-in pending state
  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState, formData: FormData): Promise<FormState> => {
      const result = await addEndpointAction(prevState, formData);

      if (result.success && result.data) {
        // Call the parent callback with the validated data
        onAddEndpoint(result.data.url, result.data.description, result.data.credentials);

        // Reset form state
        setShowCredentials(false);
        setAuthType("none");

        return { error: null, success: true, shouldReset: true };
      }

      return result;
    },
    { error: null, success: false }
  );

  return (
    <section className="section-card">
      <h2 className="m-0 mb-3 text-xl font-title tracking-[2px] text-accent-primary">
        Add New Endpoint
      </h2>
      <p className="text-text-secondary mb-5 leading-relaxed">
        Add endpoints to monitor. Each endpoint will be represented by a
        clownfish with a unique color. The fish will float to the top if the
        endpoint returns an error.
      </p>
      {/* React 19: Native form action instead of onSubmit with preventDefault */}
      <form action={formAction} className="flex flex-col gap-3" key={state.shouldReset ? Date.now() : "form"}>
        <input
          type="text"
          name="url"
          placeholder="https://api.example.com/health"
          aria-label="Endpoint URL"
          className="input-base"
          disabled={isPending}
        />
        <input
          type="text"
          name="description"
          placeholder="Description (optional)"
          aria-label="Endpoint description"
          className="input-base"
          disabled={isPending}
        />

        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-dashed border-border-secondary rounded-md text-text-secondary text-sm cursor-pointer transition-all duration-200 hover:border-accent-primary hover:text-accent-primary"
          onClick={() => setShowCredentials(!showCredentials)}
          disabled={isPending}
          aria-expanded={showCredentials}
          aria-controls="auth-section"
        >
          {showCredentials ? "▼" : "▶"} Authentication (optional)
        </button>

        {/* Hidden input to pass authType to form action */}
        <input type="hidden" name="authType" value={authType} />

        {showCredentials && (
          <div id="auth-section" className="flex flex-col gap-3 p-4 bg-surface-secondary rounded-lg border border-border-secondary">
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as AuthType)}
              className="px-4 py-2.5 border border-border-secondary rounded-md bg-surface-tertiary text-text-primary text-sm cursor-pointer focus:outline-none focus:border-accent-primary"
              disabled={isPending}
              aria-label="Authentication type"
            >
              <option value="none">No Authentication</option>
              <option value="basic">Basic Auth</option>
              <option value="bearer">Bearer Token</option>
              <option value="apikey">API Key</option>
            </select>

            {authType === "basic" && (
              <div className="flex flex-col gap-2.5">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  aria-label="Username for basic authentication"
                  className="input-base !py-2.5"
                  disabled={isPending}
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  aria-label="Password for basic authentication"
                  className="input-base !py-2.5"
                  disabled={isPending}
                />
              </div>
            )}

            {authType === "bearer" && (
              <div className="flex flex-col gap-2.5">
                <input
                  type="password"
                  name="bearerToken"
                  placeholder="Bearer Token"
                  aria-label="Bearer token"
                  className="input-base !py-2.5"
                  disabled={isPending}
                />
              </div>
            )}

            {authType === "apikey" && (
              <div className="flex flex-col gap-2.5">
                <input
                  type="text"
                  name="apiKeyName"
                  placeholder="Header Name (e.g., X-API-Key)"
                  aria-label="API key header name"
                  className="input-base !py-2.5"
                  disabled={isPending}
                />
                <input
                  type="password"
                  name="apiKeyValue"
                  placeholder="API Key Value"
                  aria-label="API key value"
                  className="input-base !py-2.5"
                  disabled={isPending}
                />
              </div>
            )}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Adding..." : "Add Endpoint"}
        </button>
      </form>

      {state.error && <p className="text-error-light mt-3 text-sm">{state.error}</p>}
    </section>
  );
}
