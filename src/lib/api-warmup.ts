// API route warmup utility to prevent cold starts during uploads

export async function warmupUploadRoutes() {
  if (typeof window === 'undefined') return; // Client-side only
  
  const routes = [
    '/api/upload-url',
    '/api/upload',
    '/api/multipart/initiate',
    '/api/multipart/parts',
    '/api/multipart/complete'
  ];

  console.log('🔥 Warming up upload API routes...');
  
  // Fire off warming requests in parallel (they'll fail but will compile the routes)
  const warmupPromises = routes.map(async (route) => {
    try {
      const response = await fetch(route, { 
        method: 'POST', 
        body: JSON.stringify({ warmup: true }), // Add warmup flag
        headers: { 'Content-Type': 'application/json' }
      });
      // Consume the response to complete the request
      await response.text();
    } catch (e) {
      // Expected to fail, we just want to trigger compilation
    }
  });

  await Promise.allSettled(warmupPromises);
  console.log('✅ Upload API routes warmed up and ready');
}