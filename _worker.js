export default {
  async fetch(request, env) {
    try {
      if (request.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      const url = new URL(request.url);
      const key = url.pathname.split('/')[1];

      if (!key) {
        return new Response("Not Found", { status: 404 });
      }

      const dest = await env.my_binding.get(key);

      if (!dest) {
        return new Response("Not Found", { status: 404 });
      }

      if (dest.startsWith("https://raw.githubusercontent.com/")) {
        
        if (!env.GITHUB_TOKEN) {
          return new Response("Internal Server Error", { status: 500 });
        }

        const githubResponse = await fetch(dest, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
            "User-Agent": "Cloudflare-Worker-Proxy",
            "Accept": "application/vnd.github.v3.raw"
          }
        });

        if (!githubResponse.ok) {
          return new Response("Error fetching resource", { status: githubResponse.status });
        }

        return new Response(githubResponse.body, {
          status: 200,
          headers: {
            "Content-Type": githubResponse.headers.get("Content-Type") || "text/plain; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      return Response.redirect(dest, 302);

    } catch (error) {
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
