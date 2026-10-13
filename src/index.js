const json = (data, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});

async function get_items(request, env, parts) {
	if (parts[0] != "items") {
		return json({ error: "Not found" }, 404);
	}
	const id = parts[1];

	try {
		switch (request.method) {
			case "GET": {
				if (id) {
					const row = await env.DB.prepare("SELECT * FROM items WHERE id = ?").bind(id).first();
					return row ? json(row) : json({ error: "Not found" }, 404);
				}
				const { results } = await env.DB.prepare("SELECT * FROM items").all();
				return json(results);
			}

			case "POST": {
				const body = await request.json();
				if (!body.name) return json({ error: "name is required!" }, 400);
				const result = await env.DB
					.prepare("INSERT INTO items (name, value) VALUES (?, ?)")
					.bind(body.name, body.value ?? null)
					.run();
				return json({ id: result.meta.last_row_id, ...body }, 201);
			}

			case "PUT": {
				if (!id) return json({ error: "id required" }, 400);
				const body = await request.json();
				const result = await env.DB
					.prepare("UPDATE items SET name = ?, value = ? WHERE id = ?")
					.bind(body.name, body.value ?? null, id)
					.run();
				return result.meta.changes
					? json({ id: Number(id), ...body })
					: json({ error: "Not found" }, 404);
			}

			case "DELETE": {
				if (!id) return json({ error: "id required" }, 400);
				const result = await env.DB
					.prepare("DELETE FROM items WHERE id = ?")
					.bind(id).run();
				return result.meta.changes
				? json({ deleted: Number(id) })
				: json({ error: "Not found" }, 404);
			}

			default:
				return json({ error: "Method not allowed" }, 405);
		}
	} catch (err) {
		return json({ error: err.message }, 500);
	}
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const parts = url.pathname.split("/").filter(Boolean);

		// Dynamic from server
		if (parts[0] === "/items") {
			return get_items(request, env, parts);
		}

		// Static from site
		const response = await env.ASSETS.fetch(request);

		// Only inject into HTML pages, not CSS/JS/images or the partials themselves
		const type = response.headers.get("content-type") || "";
		if (!type.includes("text/html") || url.pathname.startsWith("/partials/")) {
			return response;
		}

		const [header, footer] = await Promise.all([
			env.ASSETS.fetch(new URL("/partials/header.html", url)).then((r) => r.text()),
			env.ASSETS.fetch(new URL("/partials/footer.html", url)).then((r) => r.text()),
		]);

		return new HTMLRewriter()
			.on("#site-header", { element(el) { el.setInnerContent(header, { html: true }); } })
			.on("#site-footer", { element(el) { el.setInnerContent(footer, { html: true }); } })
			.transform(response);
	},
};