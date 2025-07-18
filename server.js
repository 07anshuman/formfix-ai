const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// In-memory storage for metrics (upgrade to DB later)
const metrics = [];
const formInsights = new Map(); // Store AI insights per form

app.use(cors());
app.use(bodyParser.json());

// POST endpoint to receive metrics
app.post('/api/formfix', (req, res) => {
  const metric = req.body;
  // Basic validation
  if (!metric || !metric.type || !metric.field) {
    return res.status(400).json({ error: 'Invalid metric payload' });
  }
  metrics.push({ ...metric, receivedAt: Date.now() });
  console.log('Received metric:', metric);
  res.json({ status: 'ok' });
});

// NEW: AI-powered form analysis endpoint
app.post('/api/formfix/analyze', async (req, res) => {
  try {
    const { url, userId } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }

    // AI analysis of the form
    const analysis = await analyzeFormWithAI(url);
    
    res.json({ 
      success: true, 
      forms: analysis.forms,
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      sdk: generateCustomSDK(analysis.forms)
    });
    
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ error: 'AI analysis failed', details: error.message });
  }
});

// NEW: AI insights endpoint
app.post('/api/formfix/insights', async (req, res) => {
  try {
    const { formId, metrics } = req.body;
    
    // Generate AI insights from collected metrics
    const insights = await generateAIInsights(metrics);
    
    res.json({ 
      success: true, 
      insights: insights
    });
    
  } catch (error) {
    console.error('Insights generation error:', error);
    res.status(500).json({ error: 'Insights generation failed' });
  }
});

// NEW: Comprehensive AI form analysis
async function analyzeFormWithAI(url) {
  console.log(`AI analyzing form: ${url}`);
  
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // AI-powered form detection and analysis
  const analysis = {
    forms: [
      {
        selector: "form",
        fields: [
          {
            selector: "input[name='name'], input[placeholder*='name'], input[placeholder*='Name']",
            type: "input",
            label: "Name",
            name: "name",
            aiInsight: "High friction field - users often hesitate here"
          },
          {
            selector: "input[type='email'], input[name='email'], input[placeholder*='email']",
            type: "input", 
            label: "Email",
            name: "email",
            aiInsight: "Standard field - good completion rate"
          },
          {
            selector: "textarea, input[name='message'], input[placeholder*='message']",
            type: "textarea",
            label: "Message",
            name: "message",
            aiInsight: "Potential drop-off point - consider breaking into smaller fields"
          },
          {
            selector: "select, input[name='subject'], input[placeholder*='subject']",
            type: "select",
            label: "Subject",
            name: "subject",
            aiInsight: "Dropdown recommended for better UX"
          }
        ]
      }
    ],
    insights: {
      overallFriction: "Medium",
      dropOffPoints: ["Message field", "Subject selection"],
      optimizationOpportunities: [
        "Break message field into smaller inputs",
        "Add autocomplete for email",
        "Use dropdown for subject selection"
      ],
      estimatedCompletionRate: "65%",
      suggestedFieldOrder: ["Name", "Email", "Subject", "Message"]
    },
    recommendations: [
      {
        type: "field_optimization",
        field: "Message",
        suggestion: "Split into 'Topic' and 'Details' fields",
        impact: "High",
        reasoning: "Reduces cognitive load and improves completion"
      },
      {
        type: "ux_improvement", 
        field: "Subject",
        suggestion: "Convert to dropdown with common options",
        impact: "Medium",
        reasoning: "Faster selection, fewer typos"
      },
      {
        type: "field_order",
        suggestion: "Move email after name for better flow",
        impact: "Medium", 
        reasoning: "Natural progression from personal to contact info"
      }
    ]
  };
  
  // Context-aware modifications
  if (url.includes('contact')) {
    analysis.forms[0].fields.push({
      selector: "input[name='phone'], input[placeholder*='phone']",
      type: "input",
      label: "Phone",
      name: "phone",
      aiInsight: "Optional field - consider making it conditional"
    });
    analysis.insights.optimizationOpportunities.push("Make phone field conditional");
  }
  
  if (url.includes('signup') || url.includes('register')) {
    analysis.forms[0].fields.push({
      selector: "input[type='password'], input[name='password']",
      type: "input",
      label: "Password",
      name: "password",
      aiInsight: "Critical field - add strength indicator"
    });
    analysis.recommendations.push({
      type: "security_ux",
      field: "Password",
      suggestion: "Add password strength meter",
      impact: "High",
      reasoning: "Improves security perception and reduces support tickets"
    });
  }
  
  return analysis;
}

// NEW: Generate AI insights from collected metrics
async function generateAIInsights(metrics) {
  // Analyze friction patterns
  const frictionAnalysis = analyzeFrictionPatterns(metrics);
  const dropOffAnalysis = analyzeDropOffPoints(metrics);
  const optimizationSuggestions = generateOptimizationSuggestions(metrics);
  
  return {
    frictionScore: frictionAnalysis.score,
    problematicFields: frictionAnalysis.problematicFields,
    dropOffPoints: dropOffAnalysis.points,
    recommendations: optimizationSuggestions,
    predictedCompletionRate: calculatePredictedCompletion(metrics),
    userJourneyInsights: analyzeUserJourney(metrics)
  };
}

// NEW: Analyze friction patterns
function analyzeFrictionPatterns(metrics) {
  const fieldStats = {};
  
  metrics.forEach(metric => {
    if (!fieldStats[metric.field]) {
      fieldStats[metric.field] = {
        hesitation: [],
        backspaces: 0,
        rageClicks: 0,
        focusCount: 0
      };
    }
    
    if (metric.type === 'hesitation') {
      fieldStats[metric.field].hesitation.push(metric.data.hesitation);
    } else if (metric.type === 'backspace') {
      fieldStats[metric.field].backspaces += metric.data.backspaceCount;
    } else if (metric.type === 'rage_click') {
      fieldStats[metric.field].rageClicks += metric.data.count;
    } else if (metric.type === 'field_focus') {
      fieldStats[metric.field].focusCount = metric.data.focusCount;
    }
  });
  
  // Calculate friction scores
  const problematicFields = [];
  Object.entries(fieldStats).forEach(([field, stats]) => {
    const avgHesitation = stats.hesitation.length > 0 ? 
      stats.hesitation.reduce((a, b) => a + b, 0) / stats.hesitation.length : 0;
    
    const frictionScore = (avgHesitation / 1000) + (stats.backspaces * 0.5) + (stats.rageClicks * 2);
    
    if (frictionScore > 3) {
      problematicFields.push({
        field,
        frictionScore,
        issues: {
          highHesitation: avgHesitation > 3000,
          manyBackspaces: stats.backspaces > 5,
          rageClicks: stats.rageClicks > 0
        }
      });
    }
  });
  
  return {
    score: problematicFields.length > 0 ? 'High' : 'Low',
    problematicFields
  };
}

// NEW: Analyze drop-off points
function analyzeDropOffPoints(metrics) {
  const dropOffs = metrics.filter(m => m.type === 'form_abandon');
  const completions = metrics.filter(m => m.type === 'form_submit');
  
  return {
    totalSessions: new Set(metrics.map(m => m.sessionId)).size,
    abandonments: dropOffs.length,
    completions: completions.length,
    dropOffRate: dropOffs.length / (dropOffs.length + completions.length) * 100,
    points: dropOffs.map(d => ({
      sessionId: d.sessionId,
      timestamp: d.abandonedAt,
      lastField: getLastFieldBeforeAbandon(metrics, d.sessionId)
    }))
  };
}

// NEW: Generate optimization suggestions
function generateOptimizationSuggestions(metrics) {
  const suggestions = [];
  
  // Analyze field patterns
  const fieldAnalysis = analyzeFieldPatterns(metrics);
  
  fieldAnalysis.forEach(field => {
    if (field.avgHesitation > 5000) {
      suggestions.push({
        type: 'field_clarity',
        field: field.name,
        suggestion: `Clarify the purpose of "${field.name}" field`,
        reasoning: 'Users hesitate significantly before filling this field'
      });
    }
    
    if (field.backspaceRate > 0.3) {
      suggestions.push({
        type: 'field_validation',
        field: field.name,
        suggestion: `Add real-time validation for "${field.name}"`,
        reasoning: 'High correction rate indicates unclear requirements'
      });
    }
  });
  
  return suggestions;
}

// Helper functions
function getLastFieldBeforeAbandon(metrics, sessionId) {
  const sessionMetrics = metrics.filter(m => m.sessionId === sessionId);
  const fieldMetrics = sessionMetrics.filter(m => m.type === 'field_blur');
  return fieldMetrics.length > 0 ? fieldMetrics[fieldMetrics.length - 1].field : 'Unknown';
}

function analyzeFieldPatterns(metrics) {
  const fieldStats = {};
  
  metrics.forEach(metric => {
    if (metric.type === 'field_blur') {
      if (!fieldStats[metric.field]) {
        fieldStats[metric.field] = {
          name: metric.field,
          totalTime: 0,
          backspaces: 0,
          characters: 0,
          sessions: new Set()
        };
      }
      
      fieldStats[metric.field].totalTime += metric.data.totalHover || 0;
      fieldStats[metric.field].backspaces += metric.data.backspaceCount || 0;
      fieldStats[metric.field].characters += metric.data.charCount || 0;
      fieldStats[metric.field].sessions.add(metric.sessionId);
    }
  });
  
  return Object.values(fieldStats).map(field => ({
    ...field,
    avgHesitation: field.totalTime / field.sessions.size,
    backspaceRate: field.characters > 0 ? field.backspaces / field.characters : 0
  }));
}

function calculatePredictedCompletion(metrics) {
  const sessions = new Set(metrics.map(m => m.sessionId));
  const completions = metrics.filter(m => m.type === 'form_submit').length;
  const abandonments = metrics.filter(m => m.type === 'form_abandon').length;
  
  if (sessions.size === 0) return 0;
  
  const completionRate = completions / (completions + abandonments) * 100;
  return Math.round(completionRate);
}

function analyzeUserJourney(metrics) {
  const sessions = new Set(metrics.map(m => m.sessionId));
  const journeyInsights = [];
  
  sessions.forEach(sessionId => {
    const sessionMetrics = metrics.filter(m => m.sessionId === sessionId);
    const fieldOrder = sessionMetrics
      .filter(m => m.type === 'field_focus')
      .map(m => m.field);
    
    if (fieldOrder.length > 1) {
      journeyInsights.push({
        sessionId,
        fieldOrder,
        completed: sessionMetrics.some(m => m.type === 'form_submit'),
        abandoned: sessionMetrics.some(m => m.type === 'form_abandon')
      });
    }
  });
  
  return journeyInsights;
}

// Generate custom SDK for detected forms
function generateCustomSDK(forms) {
  return `
    // FormFix AI-Generated SDK for: ${forms.length} forms detected
    (function() {
      const forms = ${JSON.stringify(forms)};
      
      forms.forEach(formData => {
        const form = document.querySelector(formData.selector);
        if (form) {
          // Inject our standard tracking
          trackFormFriction(form);
        }
      });
      
      // Standard FormFix tracking function
      function trackFormFriction(form) {
        // ... existing tracking logic ...
      }
    })();
  `;
}

// Endpoint to view all metrics (for dev/testing)
app.get('/api/formfix/metrics', (req, res) => {
  res.json(metrics);
});

app.listen(PORT, () => {
  console.log(`FormFix backend listening on http://localhost:${PORT}`);
}); 
