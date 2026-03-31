/**
 * script.js - Kärnlogik för Compliance-verktyget
 * Använder Vercel serverless backend för Gemini API.
 */

const { useState, useEffect } = React;

/**
 * Funktion som anropar backend och returnerar AI-data
 */
async function callGemini(prompt, schema) {
    if (!prompt || !schema) {
        console.error("Prompt eller schema saknas!");
        return null;
    }

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

        const data = await response.json();
        console.log("Data mottagen från backend:", data);
        return data;

    } catch (error) {
        console.error("Fel vid anrop till Vercel-backend:", error.message);
        return null;
    }
}

/**
 * React-komponent för appen
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
            alert("Vänligen fyll i både bransch och antal anställda.");
            return;
        }

        setLoading(true);

        const prompt = `
            Du är en expert på svensk compliance.
            Analysera lagkrav för en organisation i branschen "${answers.industry}" med ${answers.size} anställda.
            Identifierade risker: ${answers.risks.join(', ')}.
            Returnera en lista med de 10 viktigaste lagarna/föreskrifterna.
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

        setTimeout(() => lucide.createIcons(), 100);
    };

    useEffect(() => { lucide.createIcons(); }, [view]);

    return (
        <div className="min-h-screen pb-20">
            <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <i data-lucide="shield-check" className="text-white w-5 h-5"></i>
                        </div>
                        <span className="font-bold text-xl text-slate-800 tracking-tight">CompliancePro</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto mt-8 px-4">
                {view === 'home' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-blue-600 px-8 py-10 text-white">
                            <h2 className="text-3xl font-bold mb-2">Verksamhetsanalys</h2>
                            <p className="opacity-90">Hitta de lagar och föreskrifter som gäller just er verksamhet.</p>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Bransch</label>
                                    <input 
                                        type="text"
                                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                                        placeholder="T.ex. Bygg, IT, Vård..." 
                                        value={answers.industry}
                                        onChange={e => setAnswers({...answers, industry: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Antal anställda</label>
                                    <select 
                                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={answers.size}
                                        onChange={e => setAnswers({...answers, size: e.target.value})}
                                    >
                                        <option value="">Välj storlek...</option>
                                        <option value="1-9">1-9 anställda</option>
                                        <option value="10-49">10-49 anställda</option>
                                        <option value="50+">50+ anställda</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3">Vilka risker förekommer? (Välj alla som passar)</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {['Tunga lyft', 'Kemikalier', 'Buller', 'Ensamarbete', 'Nattarbete', 'Heta arbeten'].map(risk => (
                                        <button 
                                            key={risk}
                                            onClick={() => toggleRisk(risk)}
                                            className={`p-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center justify-between ${
                                                answers.risks.includes(risk) 
                                                ? "border-blue-600 bg-blue-50 text-blue-700" 
                                                : "border-slate-200 text-slate-600 hover:border-slate-300"
                                            }`}
                                        >
                                            {risk}
                                            {answers.risks.includes(risk) && <i data-lucide="check" className="w-4 h-4"></i>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={startAnalysis}
                                disabled={loading || !answers.industry || !answers.size}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex justify-center items-center gap-3"
                            >
                                {loading ? (
                                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Analyserar...</>
                                ) : (
                                    <><i data-lucide="brain-circuit" className="w-6 h-6"></i> Starta AI-analys</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {view === 'results' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button 
                            onClick={() => setView('home')} 
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition-colors"
                        >
                            <i data-lucide="arrow-left" className="w-4 h-4"></i> Tillbaka till analys
                        </button>
                        
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-800">Identifierade Lagkrav</h2>
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                                {results.length} krav hittade
                            </span>
                        </div>

                        <div className="grid gap-4">
                            {results.map(item => (
                                <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all shadow-sm group">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                                                item.type === 'Lag' ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                                            }`}>
                                                {item.type}
                                            </span>
                                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                            <p className="text-slate-600 leading-relaxed">{item.summary}</p>
                                        </div>
                                        <button className="text-slate-300 hover:text-blue-600 p-2">
                                            <i data-lucide="plus-circle" className="w-6 h-6"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// Rendera appen
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Initiera Lucide-ikoner
setTimeout(() => lucide.createIcons(), 500);
