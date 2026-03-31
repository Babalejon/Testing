// api/ai.js - Vercel Serverless Function
// Denna fil körs på Vercels servrar, inte i användarens webbläsare.

export default async function handler(req, res) {
  // 1. Tillåt endast POST-anrop
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Endast POST-anrop är tillåtna' });
  }

  // 2. Hämta data från frontenden
  const { prompt, schema } = req.body;

  // 3. Kontrollera att API-nyckeln finns i Vercels miljövariabler
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("FEL: Miljövariabeln GEMINI_API_KEY saknas i Vercel-inställningarna.");
    return res.status(500).json({ error: 'Serverkonfigurationsfel: API-nyckel saknas' });
  }

  // 4. Konfigurera anropet till Google Gemini API
  const model = "gemini-1.5-flash"; // Snabb och kostnadseffektiv modell
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ 
      parts: [{ text: prompt }] 
    }],
    generationConfig: {
      response_mime_type: "application/json",
      response_schema: schema,
      temperature: 0.1 // Låg temperatur för mer exakta svar
    }
  };

  try {
    // 5. Skicka förfrågan till Google
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API svarade med fel: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // 6. Extrahera texten (som är en JSON-sträng) och parsa den
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      const aiResponseText = data.candidates[0].content.parts[0].text;
      
      // Vi parsar texten till ett riktigt JSON-objekt innan vi skickar det till frontenden
      const jsonResult = JSON.parse(aiResponseText);
      
      // 7. Skicka tillbaka det färdiga resultatet till din script.js
      return res.status(200).json(jsonResult);
    } else {
      throw new Error("Oväntat svar från Google AI");
    }

  } catch (error) {
    console.error("Backend-fel:", error.message);
    return res.status(500).json({ 
      error: 'Kunde inte generera svar från AI:n',
      details: error.message 
    });
  }
}
