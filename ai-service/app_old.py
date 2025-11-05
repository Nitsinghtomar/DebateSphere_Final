# app.py
# Cosmetic formatting only — logic unchanged.

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# 🌿 Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# arth was here 💡
# Placeholder for AI model (planned implementation: Week 6)
# from transformers import pipeline
#
# # Load fallacy detection model
# classifier = pipeline(
#     "text-classification",
#     model="MidhunKanadan/roberta-large-fallacy-classification",
#     device=-1  # CPU inference
# )

# -------------------- Health Check --------------------
@app.route('/health', methods=['GET'])
def health_check():
    """Basic service health endpoint"""
    return jsonify({
        'status': 'OK',
        'service': 'DebateSphere AI Service',
        'version': '1.0.0',
        'model_loaded': False  # Will be True once model is integrated
    })

# -------------------- Analyze Argument --------------------
@app.route('/analyze-argument', methods=['POST'])
def analyze_argument():
    """
    Analyze argument for logical fallacies.
    (Week 1 placeholder — AI implementation planned for Week 6)
    """
    try:
        data = request.get_json()

        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text field'}), 400

        argument_text = data['text']

        # Mock placeholder response
        mock_response = {
            'fallacies': [
                {
                    'type': 'placeholder',
                    'confidence': 0.0,
                    'explanation': 'AI model will be implemented in Week 6'
                }
            ],
            'strength_score': 0.5,
            'suggestions': [
                'AI analysis coming in Week 6 - Sprint 2'
            ],
            'word_count': len(argument_text.split()),
            'analysis_timestamp': '2025-09-09T00:00:00Z'
        }

        return jsonify(mock_response)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# -------------------- Fallacy Types --------------------
@app.route('/fallacy-types', methods=['GET'])
def get_fallacy_types():
    """Return list of supported fallacy types"""
    fallacy_types = [
        'Ad Hominem',
        'Strawman',
        'Appeal to Ignorance',
        'Hasty Generalization',
        'False Dilemma',
        'Slippery Slope',
        'Circular Reasoning',
        'Appeal to Authority',
        'Red Herring',
        'Tu Quoque',
        'Bandwagon',
        'No True Scotsman',
        'Equivocation'
    ]

    return jsonify({
        'fallacy_types': fallacy_types,
        'total_types': len(fallacy_types)
    })

# -------------------- Main Entry --------------------
if __name__ == '__main__':
    port = int(os.getenv('AI_SERVICE_PORT', 5001))
    debug_mode = os.getenv('FLASK_ENV') == 'development'

    print(f"🤖 Starting DebateSphere AI Service on port {port}")
    print(f"🔧 Debug mode: {debug_mode}")
    print("📋 Note: AI model integration planned for Week 6")

    app.run(host='0.0.0.0', port=port, debug=debug_mode)
