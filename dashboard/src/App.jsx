import { useEffect, useState } from "react";

function StatCard({ label, value, accent }) {
  return (
    <div className={`bg-white rounded-xl shadow p-6 min-w-[140px] lg:min-w-[160px] border-t-4 ${accent} text-center`}> 
      <div className="text-3xl lg:text-4xl font-bold text-gray-900">{value}</div>
      <div className="text-gray-500 mt-2 text-sm lg:text-base">{label}</div>
    </div>
  );
}

function AIInsightsPanel({ insights, recommendations }) {
  if (!insights) return null;
  
  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-8 lg:p-12 mb-8">
      <h2 className="text-xl lg:text-2xl font-semibold mb-6 lg:mb-8 text-blue-800 text-center">AI Insights & Recommendations</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Friction Analysis */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-900">Friction Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Overall Friction:</span>
              <span className={`font-bold ${insights.overallFriction === 'High' ? 'text-red-600' : 'text-green-600'}`}>
                {insights.overallFriction}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Completion:</span>
              <span className="font-bold text-blue-600">{insights.estimatedCompletionRate}</span>
            </div>
            <div className="flex justify-between">
              <span>Drop-off Points:</span>
              <span className="font-bold text-orange-600">{insights.dropOffPoints.length}</span>
            </div>
          </div>
        </div>
        
        {/* Optimization Opportunities */}
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-900">Optimization Opportunities</h3>
          <ul className="space-y-2 text-sm">
            {insights.optimizationOpportunities.map((opp, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>{opp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* AI Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">AI Recommendations</h3>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{rec.suggestion}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    rec.impact === 'High' ? 'bg-red-100 text-red-800' :
                    rec.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.impact} Impact
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{rec.reasoning}</p>
                <div className="text-xs text-gray-500">
                  Field: {rec.field} • Type: {rec.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DropOffHeatmap({ metrics }) {
  if (!metrics || metrics.length === 0) return null;
  
  // Analyze drop-off patterns
  const fieldStats = {};
  metrics.forEach(metric => {
    if (metric.type === 'field_blur') {
      if (!fieldStats[metric.field]) {
        fieldStats[metric.field] = { total: 0, abandonments: 0 };
      }
      fieldStats[metric.field].total++;
    }
  });
  
  // Find fields where users abandon
  const abandonments = metrics.filter(m => m.type === 'form_abandon');
  abandonments.forEach(abandon => {
    const sessionMetrics = metrics.filter(m => m.sessionId === abandon.sessionId);
    const lastField = sessionMetrics
      .filter(m => m.type === 'field_blur')
      .pop();
    if (lastField && fieldStats[lastField.field]) {
      fieldStats[lastField.field].abandonments++;
    }
  });
  
  const fields = Object.entries(fieldStats).map(([field, stats]) => ({
    name: field,
    dropOffRate: stats.total > 0 ? (stats.abandonments / stats.total) * 100 : 0
  }));
  
  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-8 lg:p-12">
      <h2 className="text-xl lg:text-2xl font-semibold mb-6 lg:mb-8 text-blue-800 text-center">Drop-off Heatmap</h2>
      
      {fields.length > 0 ? (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <span className="font-medium text-gray-900">{field.name}</span>
              <div className="flex items-center space-x-4">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      field.dropOffRate > 50 ? 'bg-red-500' :
                      field.dropOffRate > 25 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(field.dropOffRate, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {field.dropOffRate.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          No field interaction data available yet
        </div>
      )}
    </div>
  );
}

function AIFormAnalyzer() {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const analyzeForm = async (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3000/api/formfix/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          userId: 'demo-user'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Network error: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-8 lg:p-12 mb-8">
      <h2 className="text-xl lg:text-2xl font-semibold mb-6 lg:mb-8 text-blue-800 text-center">AI Form Analyzer</h2>
      
      <form onSubmit={analyzeForm} className="max-w-2xl mx-auto">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Website URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/contact-form"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-sm text-gray-500 mt-1">Enter any URL to get AI-powered form insights</p>
        </div>
        
        <button
          type="submit"
          disabled={analyzing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          {analyzing ? 'AI Analyzing...' : 'Analyze with AI'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {analysis && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <h3 className="font-bold mb-2">AI Analysis Complete!</h3>
          <p>Found {analysis.forms.length} form(s) with intelligent insights.</p>
          <details className="mt-2">
            <summary className="cursor-pointer font-semibold">View AI Analysis</summary>
            <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border">
              {JSON.stringify(analysis, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [stats, setStats] = useState({ sessions: 0, completions: 0, abandonments: 0 });
  const [metrics, setMetrics] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/formfix/metrics")
      .then((res) => res.json())
      .then((data) => {
        // Aggregate stats
        const sessions = new Set(data.map(m => m.sessionId)).size;
        const completions = data.filter(m => m.type === "form_submit").length;
        const abandonments = data.filter(m => m.type === "form_abandon").length;
        setStats({ sessions, completions, abandonments });
        setMetrics(data);
        
        // Generate AI insights if we have data
        if (data.length > 0) {
          generateInsights(data);
        }
      });
  }, []);

  const generateInsights = async (metricsData) => {
    try {
      const response = await fetch('http://localhost:3000/api/formfix/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: 'demo-form',
          metrics: metricsData
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setAiInsights(data.insights);
      }
    } catch (err) {
      console.error('Insights generation error:', err);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-50 to-blue-50 debug">
      <div className="w-full max-w-7xl mx-auto px-4 py-8 lg:py-16">
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-3xl lg:text-5xl font-extrabold mb-4 lg:mb-6 tracking-tight text-blue-900">FormFix AI Dashboard</h1>
          <p className="text-gray-600 text-base lg:text-xl">Intelligent form analytics with AI-powered insights</p>
        </div>
        
        <div className="flex flex-wrap gap-6 lg:gap-8 mb-12 lg:mb-16 justify-center">
          <StatCard label="Total Sessions" value={stats.sessions} accent="border-blue-400" />
          <StatCard label="Completions" value={stats.completions} accent="border-green-400" />
          <StatCard label="Abandonments" value={stats.abandonments} accent="border-red-400" />
        </div>
        
        <AIFormAnalyzer />
        
        {aiInsights && (
          <AIInsightsPanel 
            insights={aiInsights} 
            recommendations={aiInsights.recommendations}
          />
        )}
        
        <DropOffHeatmap metrics={metrics} />
        
        <div className="text-center mt-12 lg:mt-20">
          <div className="text-gray-500 text-sm">FormFix 2.0 AI &copy; {new Date().getFullYear()}</div>
        </div>
      </div>
    </div>
  );
}
