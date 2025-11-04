from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np
from typing import Dict, Any
import warnings
import os
import sys
from catboost import CatBoostRegressor, CatBoostClassifier
import xgboost as xgb
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings('ignore')

# Fix for pickle loading XGBoost models saved with different module paths
sys.modules['XGBClassifier'] = XGBClassifier
sys.modules['xgboost.sklearn'] = xgb.sklearn

# Custom unpickler to handle module path issues
class CustomUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        # Handle XGBoost class name issues
        if name == 'XGBClassifier':
            from xgboost import XGBClassifier
            return XGBClassifier
        # Default behavior
        return super().find_class(module, name)

app = Flask(__name__)
CORS(app)

# Model paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')

# Load models
print("Loading models...")
try:
    with open(os.path.join(MODELS_DIR, 'clusterdev_gmm_model.pkl'), 'rb') as f:
        clusterdev_model = pickle.load(f)
    print("✓ ClusterDev GMM model loaded")
    print(f"   Type: {type(clusterdev_model)}")
    if isinstance(clusterdev_model, dict):
        print(f"   Keys: {list(clusterdev_model.keys())}")
except Exception as e:
    print(f"✗ Error loading ClusterDev GMM model: {e}")
    clusterdev_model = None

try:
    with open(os.path.join(MODELS_DIR, 'menstrual_risk_user_model.pkl'), 'rb') as f:
        risk_model = pickle.load(f)
    print("✓ Menstrual Risk User model loaded")
    print(f"   Type: {type(risk_model)}")
    if isinstance(risk_model, dict):
        print(f"   Keys: {list(risk_model.keys())}")
except Exception as e:
    print(f"✗ Error loading Menstrual Risk User model: {e}")
    risk_model = None

try:
    with open(os.path.join(MODELS_DIR, 'catboost_model.pkl'), 'rb') as f:
        prwi_model = pickle.load(f)
    print("✓ CatBoost model loaded")
    print(f"   Type: {type(prwi_model)}")
    if isinstance(prwi_model, dict):
        print(f"   Keys: {list(prwi_model.keys())}")
except Exception as e:
    print(f"✗ Error loading CatBoost model: {e}")
    prwi_model = None

# Feature definitions
RISK_FEATURES = [
    'AvgCycleLength', 'IrregularCyclesPercent', 'StdCycleLength',
    'AvgLutealPhase', 'ShortLutealPercent',
    'AvgBleedingIntensity', 'UnusualBleedingPercent', 'AvgMensesLength',
    'AvgOvulationDay', 'OvulationVariability',
    'Age', 'BMI', 'TotalCycles'
]

PRWI_FEATURES = [
    'AvgCycleLength', 'StdCycleLength', 'IrregularCyclesPercent',
    'AvgLutealPhase', 'ShortLutealPercent', 'AvgMensesLength',
    'UnusualBleedingPercent', 'AvgOvulationDay', 'OvulationVariability',
    'AvgBleedingIntensity', 'Age', 'BMI', 'Numberpreg', 'Abortions',
    'AgeM', 'Breastfeeding'
]

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'models': {
            'clusterdev': clusterdev_model is not None,
            'risk_assessment': risk_model is not None,
            'prwi_score': prwi_model is not None
        }
    })

def predict_cluster_deviation(features: Dict[str, float]) -> Dict[str, Any]:
    if clusterdev_model is None:
        return {'error': 'ClusterDev model not loaded'}
    try:
        df = pd.DataFrame([features])
        
        if isinstance(clusterdev_model, dict):
            model = clusterdev_model.get('model')
            scaler = clusterdev_model.get('scaler', StandardScaler())
            feature_columns = clusterdev_model.get('feature_columns')
            
            if model is None:
                return {'error': 'Model not found in saved file'}
            
            # Use the saved feature columns order
            if feature_columns:
                for col in feature_columns:
                    if col not in df.columns:
                        df[col] = 0
                df = df[feature_columns]
            
            # Scale the features
            df_scaled = pd.DataFrame(scaler.transform(df), columns=df.columns)
            
            # Use CatBoost for prediction
            prediction = model.predict(df_scaled)
            score = model.predict_proba(df_scaled)[0]  # Get probability scores
            
            return {
                'cluster': int(prediction[0]),
                'deviation_score': float(max(score) * 100),  # Convert probability to percentage
                'interpretation': get_deviation_interpretation(float(max(score) * 100))
            }
        else:
            return {'error': 'Unknown model format'}
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {'error': f'ClusterDev prediction failed: {str(e)}'}

def predict_risk(features: Dict[str, float]) -> Dict[str, Any]:
    if risk_model is None:
        return {'error': 'Risk Assessment model not loaded'}
    try:
        df = pd.DataFrame([features])
        for feat in RISK_FEATURES:
            if feat not in df.columns:
                df[feat] = 0
        df = df[RISK_FEATURES]

        model = risk_model.get('model') if isinstance(risk_model, dict) else risk_model
        scaler = risk_model.get('scaler', StandardScaler()) if isinstance(risk_model, dict) else StandardScaler()

        # Scale the features
        df_scaled = pd.DataFrame(scaler.transform(df), columns=df.columns)

        # Get predictions and probabilities using XGBoost
        prediction = model.predict(df_scaled)
        probabilities = model.predict_proba(df_scaled)

        risk_categories = ['Low', 'Medium', 'High']
        # Fix: handle prediction array shape and empty predictions
        if prediction is None or len(prediction) == 0:
            return {'error': 'Risk prediction failed: empty prediction array'}
        if isinstance(prediction, np.ndarray) and prediction.shape == (1,):
            pred_value = int(prediction[0])
        elif isinstance(prediction, np.ndarray) and prediction.shape[0] == 1:
            pred_value = int(prediction.ravel()[0])
        else:
            # fallback: try to convert first element
            try:
                pred_value = int(prediction[0])
            except Exception:
                return {'error': 'Risk prediction failed: invalid prediction format'}

        risk_level = risk_categories[pred_value] if pred_value < len(risk_categories) else 'Unknown'

        return {
            'risk_level': risk_level,
            'probabilities': {
                'low': float(probabilities[0][0]) if probabilities is not None and len(probabilities[0]) > 0 else 0,
                'medium': float(probabilities[0][1]) if probabilities is not None and len(probabilities[0]) > 1 else 0,
                'high': float(probabilities[0][2]) if probabilities is not None and len(probabilities[0]) > 2 else 0
            },
            'interpretation': get_risk_interpretation(risk_level)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {'error': f'Risk prediction failed: {str(e)}'}
    try:
        df = pd.DataFrame([features])

        if isinstance(prwi_model, dict):
            model = prwi_model.get('model')
            scaler = prwi_model.get('scaler', StandardScaler())
            feature_names = prwi_model.get('feature_names', PRWI_FEATURES)

            if model is None:
                return {'error': 'PRWI model not found in saved file'}

            # Use the feature names order
            for feat in feature_names:
                if feat not in df.columns:
                    df[feat] = 0
            df = df[feature_names]

            # Scale the features
            df_scaled = pd.DataFrame(scaler.transform(df), columns=df.columns)

            # Use CatBoost for prediction
            score = model.predict(df_scaled)

            return {
                'prwi_score': float(score[0]),
                'interpretation': get_prwi_interpretation(float(score[0]))
            }
        else:
            return {'error': 'Unknown model format'}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {'error': f'PRWI prediction failed: {str(e)}'}

def get_deviation_interpretation(score: float) -> str:
    if score < 25:
        return "Excellent - Very close to healthy patterns"
    elif score < 50:
        return "Good - Minor deviations from healthy patterns"
    elif score < 75:
        return "Fair - Moderate deviations, monitoring recommended"
    else:
        return "Poor - Significant deviations, consultation advised"

def get_risk_interpretation(risk_level: str) -> str:
    interpretations = {
        'Low': 'Healthy menstrual patterns detected. Continue regular monitoring.',
        'Medium': 'Some irregularities detected. Consider lifestyle adjustments and monitoring.',
        'High': 'Significant concerns detected. Medical consultation recommended.'
    }
    return interpretations.get(risk_level, 'Unable to interpret risk level')

def get_prwi_interpretation(score: float) -> str:
    if score <= 30:
        return "Low Risk - Healthy menstrual patterns"
    elif score <= 60:
        return "Medium Risk - Some irregularities, monitoring recommended"
    else:
        return "High Risk - Significant concerns, medical consultation advised"

# Store for multi-page form data (in production, use a database or session)
form_data_store = {}

@app.route('/api/cycle-data', methods=['POST'])
def save_cycle_data():
    """Save cycle statistics, luteal phase, ovulation, and total cycles data"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        
        if session_id not in form_data_store:
            form_data_store[session_id] = {}
        
        form_data_store[session_id]['cycle_data'] = data.get('data', {})
        
        return jsonify({
            'success': True,
            'message': 'Cycle data saved successfully',
            'session_id': session_id
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/user-data', methods=['POST'])
def save_user_data():
    """Save demographic and reproductive history data"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        
        if session_id not in form_data_store:
            form_data_store[session_id] = {}
        
        form_data_store[session_id]['user_data'] = data.get('data', {})
        
        return jsonify({
            'success': True,
            'message': 'User data saved successfully',
            'session_id': session_id
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/symptoms-data', methods=['POST'])
def save_symptoms_data():
    """Save bleeding patterns data"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        
        if session_id not in form_data_store:
            form_data_store[session_id] = {}
        
        form_data_store[session_id]['symptoms_data'] = data.get('data', {})
        
        return jsonify({
            'success': True,
            'message': 'Symptoms data saved successfully',
            'session_id': session_id
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/predict', methods=['POST'])
def predict():
    """Run predictions using all collected data"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        
        print("\n" + "="*60)
        print("RECEIVED PREDICTION REQUEST")
        print("="*60)
        print(f"Session ID: {session_id}")
        
        # Combine all data from the session
        features = {}
        if session_id in form_data_store:
            cycle_data = form_data_store[session_id].get('cycle_data', {})
            user_data = form_data_store[session_id].get('user_data', {})
            symptoms_data = form_data_store[session_id].get('symptoms_data', {})
            
            features.update(cycle_data)
            features.update(user_data)
            features.update(symptoms_data)
        
        # Also accept direct features if provided
        if 'features' in data:
            features.update(data['features'])
        
        models_to_run = data.get('models', ['all'])
        
        print(f"Features received: {len(features)} features")
        print(f"Models to run: {models_to_run}")
        print(f"Sample features: {list(features.keys())[:5] if features else 'None'}")
        
        results = {}
        # Only include results for models that are loaded
        if (('all' in models_to_run or 'clusterdev' in models_to_run) and clusterdev_model is not None):
            print("Running ClusterDev prediction...")
            results['clusterdev'] = predict_cluster_deviation(features)
            print(f"ClusterDev result: {results['clusterdev']}")

        if (('all' in models_to_run or 'risk' in models_to_run) and risk_model is not None):
            print("Running Risk Assessment prediction...")
            results['risk_assessment'] = predict_risk(features)
            print(f"Risk Assessment result: {results['risk_assessment']}")

        if (('all' in models_to_run or 'prwi' in models_to_run) and prwi_model is not None):
            print("Running PRWI prediction...")
            results['prwi_score'] = predict_prwi(features)
            print(f"PRWI result: {results['prwi_score']}")

        response = {'success': True, 'results': results}
        print("\nFINAL RESPONSE:")
        print(f"Success: {response['success']}")
        print(f"Results keys: {list(response['results'].keys())}")
        print("="*60 + "\n")

        return jsonify(response)
    except Exception as e:
        print(f"\nERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    print("\n" + "="*60)
    print("   AI Menstrual Wellness Assistant - Backend API")
    print("="*60)
    print("\n🚀 Server: http://localhost:5002")
    print("\n📡 Endpoints:")
    print("   GET  /api/health  - Health check")
    print("   POST /api/predict - Predictions")
    print("\n" + "="*60 + "\n")
    app.run(debug=True, port=5002, host='0.0.0.0')