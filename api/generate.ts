
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // AI functionality has been disabled for the static deployment version.
  return new Response(JSON.stringify({ 
    text: "AI Caption generation is currently disabled in this static version." 
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
