const { useState } = React;
const { 
    ShieldCheck, 
    BrainCircuit, 
    ArrowLeft, 
    PlusCircle, 
    Check 
} = lucideReact;

/**
 * Backend-anrop
 */
async function callGemini(prompt, schema) {
    if (!prompt || !schema) return null;

    try {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, schema })
        });

        if (!response.ok) {
            let errorMessage = `Serverfel: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error) errorMessage = errorData.error;
            } catch (_) {}
            throw new Error(errorMessage);
        }

        return await response.json();

    } catch (error) {
        console.error("Backend error:", error.message);
        return null;
    }
}

/**
 * App
 */
function App() {
    const [view, setView] = useState('home');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [answers, setAnswers] = useState({ industry: '', size: '', risks: [] });

    const toggleRisk = (risk) => {
        setAnswers(prev => ({
            ...prev,
            risks: prev.risks.includes(risk)
                ? prev.risks.filter(r => r !== risk)
                : [...prev.risks, risk]
        }));
    };

    const startAnalysis = async () => {
        if (!answers.industry || !answers.size) {
            alert("Fyll i alla fält.");
            return;
        }

        setLoading(true);

        const prompt = `
        Du är en expert på svensk compliance.
        Bransch: ${answers.industry}
        Storlek: ${answers.size}
        Risker: ${answers.risks.join(', ')}
        Returnera topp 10 lagkrav.
        `;

        const schema = {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    summary: { type: "string" },
                    type: { type: "string" }
                },
                required: ["id", "title", "summary", "type"]
            }
        };

        const data = await callGemini(prompt, schema);
        if (data) setResults(data);

        setLoading(false);
        setView('results');
    };

    return (
        <div className="min-h-screen pb-20">
            
            {/* NAV */}
            <nav className="bg-white border-b px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <ShieldCheck className="text-white w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl">CompliancePro</span>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto mt-8 px-4">

                {/* HOME */}
                {view === 'home' && (
                    <div className="bg-white rounded-2xl shadow border overflow-hidden">

                        <div className="bg-blue-600 p-8 text-white">
                            <h2 className="text-2xl font-bold">Verksamhetsanalys</h2>
                        </div>

                        <div className="p-8 space-y-6">

                            <input
                                placeholder="Bransch"
                                value={answers.industry}
                                onChange={e => setAnswers({...answers, industry: e.target.value})}
                                className="w-full p-3 border rounded-xl"
                            />

                            <select
                                value={answers.size}
                                onChange={e => setAnswers({...answers, size: e.target.value})}
                                className="w-full p-3 border rounded-xl"
                            >
                                <option value="">Storlek</option>
                                <option value="1-9">1-9</option>
                                <option value="10-49">10-49</option>
                                <option value="50+">50+</option>
                            </select>

                            <div className="grid grid-cols-2 gap-2">
                                {['Tunga lyft','Kemikalier','Buller'].map(risk => (
                                    <button
                                        key={risk}
                                        onClick={() => toggleRisk(risk)}
                                        className={`p-3 border rounded-xl flex justify-between ${
                                            answers.risks.includes(risk) ? "bg-blue-100" : ""
                                        }`}
                                    >
                                        {risk}
                                        {answers.risks.includes(risk) && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={startAnalysis}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white p-4 rounded-xl flex justify-center gap-2"
                            >
                                {loading ? "Laddar..." : (
                                    <>
                                        <BrainCircuit className="w-5 h-5" />
                                        Starta analys
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* RESULTS */}
                {view === 'results' && (
                    <div className="space-y-4">

                        <button onClick={() => setView('home')} className="flex gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Tillbaka
                        </button>

                        {results.map(item => (
                            <div key={item.id} className="p-4 border rounded-xl flex justify-between">
                                <div>
                                    <h3 className="font-bold">{item.title}</h3>
                                    <p>{item.summary}</p>
                                </div>
                                <PlusCircle className="w-5 h-5" />
                            </div>
                        ))}
                    </div>
                )}

            </main>
        </div>
    );
}

/**
 * Render
 */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
