const { useState, useEffect, useRef } = React;

/**
 * ✅ React-safe Lucide wrapper
 */
function Icon({ name, className = "" }) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && lucide.icons[name]) {
            ref.current.innerHTML = lucide.icons[name].toSvg({
                class: className
            });
        }
    }, [name, className]);

    return <span ref={ref}></span>;
}

/**
 * Backend call
 */
async function callGemini(prompt, schema) {
    if (!prompt || !schema) return [];

    try {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, schema })
        });

        if (!response.ok) {
            let msg = `Serverfel (${response.status})`;
            try {
                const err = await response.json();
                if (err.error) msg = err.error;
            } catch (_) {}
            throw new Error(msg);
        }

        return await response.json();

    } catch (err) {
        console.error("Backend error:", err.message);
        return [];
    }
}

/**
 * App
 */
function App() {
    const [view, setView] = useState('home');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [answers, setAnswers] = useState({
        industry: '',
        size: '',
        risks: []
    });

    /**
     * Toggle risk
     */
    const toggleRisk = (risk) => {
        setAnswers(prev => ({
            ...prev,
            risks: prev.risks.includes(risk)
                ? prev.risks.filter(r => r !== risk)
                : [...prev.risks, risk]
        }));
    };

    /**
     * Start AI analysis
     */
    const startAnalysis = async () => {
        if (!answers.industry || !answers.size) {
            alert("Fyll i bransch och storlek.");
            return;
        }

        setLoading(true);

        const prompt = `
Du är en expert på svensk compliance.
Analysera lagkrav för:
Bransch: ${answers.industry}
Storlek: ${answers.size}
Risker: ${answers.risks.join(', ')}

Returnera topp 10 lagar/föreskrifter.
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
        setResults(data);

        setLoading(false);
        setView('results');
    };

    return (
        <div className="min-h-screen pb-20">

            {/* NAV */}
            <nav className="bg-white border-b px-6 py-4 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Icon name="shield-check" className="w-5 h-5 text-white"/>
                    </div>
                    <span className="font-bold text-xl text-slate-800">CompliancePro</span>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto mt-8 px-4">

                {/* HOME */}
                {view === 'home' && (
                    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">

                        <div className="bg-blue-600 px-8 py-10 text-white">
                            <h2 className="text-3xl font-bold mb-2">Verksamhetsanalys</h2>
                            <p className="opacity-90">Hitta relevanta lagkrav för er verksamhet</p>
                        </div>

                        <div className="p-8 space-y-6">

                            {/* Industry */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">Bransch</label>
                                <input
                                    type="text"
                                    value={answers.industry}
                                    onChange={e => setAnswers({...answers, industry: e.target.value})}
                                    className="w-full p-3 border rounded-xl"
                                    placeholder="T.ex. Bygg, IT..."
                                />
                            </div>

                            {/* Size */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">Antal anställda</label>
                                <select
                                    value={answers.size}
                                    onChange={e => setAnswers({...answers, size: e.target.value})}
                                    className="w-full p-3 border rounded-xl"
                                >
                                    <option value="">Välj storlek</option>
                                    <option value="1-9">1–9</option>
                                    <option value="10-49">10–49</option>
                                    <option value="50+">50+</option>
                                </select>
                            </div>

                            {/* Risks */}
                            <div>
                                <label className="block text-sm font-semibold mb-3">
                                    Risker (valfritt)
                                </label>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        'Tunga lyft',
                                        'Kemikalier',
                                        'Buller',
                                        'Ensamarbete',
                                        'Nattarbete',
                                        'Heta arbeten'
                                    ].map(risk => (
                                        <button
                                            key={risk}
                                            onClick={() => toggleRisk(risk)}
                                            className={`p-3 rounded-xl border flex justify-between ${
                                                answers.risks.includes(risk)
                                                    ? "bg-blue-100 border-blue-500"
                                                    : ""
                                            }`}
                                        >
                                            {risk}
                                            {answers.risks.includes(risk) &&
                                                <Icon name="check" className="w-4 h-4"/>
                                            }
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Button */}
                            <button
                                onClick={startAnalysis}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl flex justify-center gap-2"
                            >
                                {loading ? (
                                    "Analyserar..."
                                ) : (
                                    <>
                                        <Icon name="brain-circuit" className="w-5 h-5"/>
                                        Starta AI-analys
                                    </>
                                )}
                            </button>

                        </div>
                    </div>
                )}

                {/* RESULTS */}
                {view === 'results' && (
                    <div className="space-y-6">

                        <button
                            onClick={() => setView('home')}
                            className="flex items-center gap-2 text-slate-600"
                        >
                            <Icon name="arrow-left" className="w-4 h-4"/>
                            Tillbaka
                        </button>

                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Lagkrav</h2>
                            <span className="text-sm bg-green-100 px-2 py-1 rounded">
                                {results.length} resultat
                            </span>
                        </div>

                        {results.map(item => (
                            <div
                                key={item.id}
                                className="bg-white p-6 rounded-xl border flex justify-between"
                            >
                                <div>
                                    <h3 className="font-bold">{item.title}</h3>
                                    <p className="text-slate-600">{item.summary}</p>
                                </div>

                                <Icon name="plus-circle" className="w-5 h-5"/>
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
