export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, target } = req.body;

  if (!text || !target) {
    return res.status(400).json({ error: "Brak danych" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `Przetłumacz poniższy tekst na ${target === "pl" ? "język polski" : "język angielski"}.
Zachowaj styl prompta AI (np. Midjourney / Veo / ChatGPT).
Nie skracaj, nie dodawaj komentarzy.

TEKST:
${text}`
      })
    });

    const data = await response.json();

    const translated =
      data.output?.[0]?.content?.[0]?.text ||
      null;

    if (!translated) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ error: "Błąd tłumaczenia" });
    }

    return res.status(200).json({ text: translated });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Błąd serwera" });
  }
}
