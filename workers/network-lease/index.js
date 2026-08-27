export default {
  async fetch(request, env, ctx) {
    // CONCEPTUAL - NOT PRODUCTION AUTH
    // This demonstrates the reachability-requires-authority concept.
    
    const url = new URL(request.url);
    const authHeader = request.headers.get('Authorization');
    
    // In production, this would verify a CAPPO NetworkLease token
    if (!authHeader || !authHeader.startsWith('Bearer lease_')) {
      return new Response(JSON.stringify({
        error: 'DENY',
        reason: 'NO_ACTIVE_NETWORK_LEASE',
        message: 'Reachability requires authority. No valid lease found.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If lease is valid, route to the ephemeral machine / tunnel
    return new Response(JSON.stringify({
      status: 'ALLOW',
      message: 'Network lease active. Routing to backend.',
      lease: authHeader.replace('Bearer ', '')
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
