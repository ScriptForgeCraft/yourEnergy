import { handlePost, readJsonBody } from '../_lib/http.js';
import { submitLead } from '../_lib/lead.js';

export const deliverLead = async ({ request, env, fetchImpl }) => {
  const body = await readJsonBody(request);
  return submitLead(body, env, {
    fetchImpl,
    signal: request.signal,
    // This value is sent only to Cloudflare Turnstile when it is configured.
    remoteIp: request.headers.get('cf-connecting-ip') ?? undefined
  });
};

export const onRequest = (context) => handlePost(context, deliverLead);
