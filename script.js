/**
 * script.js - Frontend-logik för Vercel-integration
 * Denna kod anropar din Serverless Function på Vercel (/api/ai).
 */

/**
 * callGemini - Skickar prompt och schema till din Vercel-backend.
 * @param {string} prompt - Instruktionen till AI:n.
 * @param {object} schema - JSON-schemat för svaret.
 */
// callGemini.js - Anropar Vercel-backend för Gemini API
async function callGemini(prompt, schema) {
    // 1. Kontrollera att prompt och schema finns
    if (!prompt || !schema) {
        console.error("Prompt eller schema saknas!");
        return null;
    }

    try {
        // 2. Anropa Vercel-serverless backend (relativ URL)
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, schema })
        });

        // 3. Kontrollera att servern svarar OK
        if (!response.ok) {
            let errorMessage = `Serverfel: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error) errorMessage = errorData.error;
            } catch (_) {}
            throw new Error(errorMessage);
        }

        // 4. Läs JSON-svaret från backend
        const data = await response.json();
        console.log("Data mottagen från backend:", data);

        return data;

    } catch (error) {
        console.error("Fel vid anrop till Vercel-backend:", error.message);
        // Här kan du lägga till logik för att visa ett felmeddelande i UI:t
        return null;
    }
}

/**
 * analyzeOrganization - Exempel på hur man använder callGemini
 */
async function analyzeOrganization(answers) {
    const prompt = `Du är en expert på svensk compliance. Analysera lagkrav för en organisation i branschen "${answers.industry}" med ${answers.size} anställda. De har identifierat följande risker: ${answers.risks.join(', ')}. Returnera en lista med de 10 viktigaste lagarna/föreskrifterna.`;
    
    const schema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                id: { type: "string" },
                title: { type: "string" },
                summary: { type: "string" },
                type: { type: "string", enum: ["Lag", "Föreskrift", "ISO-standard"] }
            },
            required: ["id", "title", "summary", "type"]
        }
    };

    return await callGemini(prompt, schema);
}

/**
 * generateComplianceChecklist - Skapar en checklista för en specifik lag
 */
async function generateComplianceChecklist(lawTitle, lawSummary) {
    const prompt = `Skapa en praktisk checklista med konkreta åtgärder för att uppfylla kraven i: ${lawTitle}. Sammanfattning: ${lawSummary}.`;
    
    const schema = {
        type: "array",
        items: {
            type: "object",
            properties: {
                id: { type: "string" },
                task: { type: "string" },
                description: { type: "string" }
            },
            required: ["id", "task", "description"]
        }
    };

    return await callGemini(prompt, schema);
}
