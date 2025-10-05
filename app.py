import os
from flask import Flask, request, jsonify, redirect, url_for
import pandas as pd
from werkzeug.utils import secure_filename
from flask_cors import CORS # Import CORS for cross-origin requests

# Configuration
UPLOAD_FOLDER = 'uploads' # Folder where uploaded files will be temporarily stored
ALLOWED_EXTENSIONS = {'csv', 'xlsx'}

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app) # Enable CORS for communication with the frontend

# Setup Upload Folder
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    """Checks if the file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def calculate_variance_percentage(actual, target):
    """Calculates the variance percentage and formats it as a string."""
    if target == 0:
        return "+0%" if actual == 0 else "N/A"
    
    variance = ((actual - target) / target) * 100
    
    # Format the output string: +5.2% or -1.5%
    if variance >= 0:
        return f"+{variance:.1f}%"
    else:
        return f"{variance:.1f}%" # Negative sign is already included

def simulate_data_analysis(pos_file, swiggy_file, zomato_file):
    """
    Simulates reading data, merging, and generating reports. 
    In a production app, you would use Pandas here to read the files 
    (pd.read_csv/pd.read_excel) and perform actual merging and calculations.
    """
    print("--- Starting Data Simulation with Variance Targets ---")

    # --- MOCK INPUT DATA (This is where your real data merging would go) ---
    # We define today's ACTUAL performance and our TARGETs
    
    # Actual Sales Data
    actual_pos_revenue = 25000 
    actual_swiggy_revenue = 12500
    actual_zomato_revenue = 7700
    
    # Daily Revenue TARGETS
    target_pos_revenue = 23000
    target_swiggy_revenue = 13000
    target_zomato_revenue = 7000
    
    total_revenue = actual_pos_revenue + actual_swiggy_revenue + actual_zomato_revenue
    total_orders = 312
    # --- END MOCK INPUT DATA ---

    # 1. Calculate Variances
    pos_variance = calculate_variance_percentage(actual_pos_revenue, target_pos_revenue)
    swiggy_variance = calculate_variance_percentage(actual_swiggy_revenue, target_swiggy_revenue)
    zomato_variance = calculate_variance_percentage(actual_zomato_revenue, target_zomato_revenue)


    # 2. Compile the Report Data Structure
    report_data = {
        "daily_report": {
            "revenue": total_revenue,
            "orders": total_orders,
            "aov": total_revenue / total_orders,
            "bestSeller": "Signature Cold Brew",
        },
        "variance_report": [
            {
                "platform": "POS (In-Store)", 
                "revenue": actual_pos_revenue, 
                "orders": 170, 
                "salesVariance": pos_variance
            },
            {
                "platform": "Swiggy", 
                "revenue": actual_swiggy_revenue, 
                "orders": 90, 
                "salesVariance": swiggy_variance
            },
            {
                "platform": "Zomato", 
                "revenue": actual_zomato_revenue, 
                "orders": 52, 
                "salesVariance": zomato_variance
            }
        ],
        "menu_analysis": [
            "Espresso Category Sales: +15% WoW",
            "Muffin (Blueberry) - Low Stock Warning: 5 units remaining",
            "Savory Sandwiches - Top Performing Category this Month",
        ]
    }
    
    print("--- Data Simulation Complete ---")
    return report_data


@app.route('/upload', methods=['POST'])
def upload_files():
    """Handles the file upload from the frontend and initiates simulation."""
    
    # Check if the POST request has the files part
    if 'pos-file' not in request.files or \
       'swiggy-file' not in request.files or \
       'zomato-file' not in request.files:
        return jsonify({"message": "Missing one or more platform files"}), 400

    files = {
        'pos': request.files['pos-file'],
        'swiggy': request.files['swiggy-file'],
        'zomato': request.files['zomato-file']
    }

    file_paths = {}

    for platform, file in files.items():
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({"message": f"Invalid or missing file for {platform}"}), 400
        
        # Save the file securely to the uploads folder
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        file_paths[platform] = filepath
        print(f"Saved file for {platform}: {filepath}")


    # After saving, run the simulation
    report_data = simulate_data_analysis(
        file_paths.get('pos'),
        file_paths.get('swiggy'),
        file_paths.get('zomato')
    )
    
    if report_data:
        # Return the generated report data as JSON
        return jsonify(report_data), 200
    else:
        return jsonify({"message": "Data simulation failed."}), 500

# Endpoint to serve the HTML files for testing (optional but helpful)
@app.route('/')
def home():
    # Serve upload.html from the current directory
    return app.send_static_file('upload.html')

if __name__ == '__main__':
    # To run: 'python app.py' in the terminal
    # This will host the server on http://127.0.0.1:5000/
    app.run(debug=True)
