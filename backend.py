from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import tempfile
from pdf_processor import split_pdf
from database_manager import create_database, get_individuals, get_pay_statements, update_individual_info
import sqlite3
import base64

app = Flask(__name__)
CORS(app)

# Create output folder for PDFs and database
OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'output')
if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

# Initialize database
DB_PATH = create_database(OUTPUT_FOLDER)

@app.route('/api/individuals', methods=['GET'])
def get_all_individuals():
    try:
        individuals = get_individuals(DB_PATH)
        result = []
        
        for ind in individuals:
            # Get paystub count and total earnings for each individual
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("""
                SELECT COUNT(*) as count, SUM(amount) as total 
                FROM pay_statements 
                WHERE individual_id = ?
            """, (ind[0],))
            stats = c.fetchone()
            conn.close()
            
            result.append({
                'id': ind[0],
                'name': ind[1],
                'address': ind[2],
                'phone_number': ind[3],
                'email': ind[4],
                'paystubCount': stats[0] or 0,
                'totalEarnings': float(stats[1] or 0)
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/individuals/<name>', methods=['PUT'])
def update_individual(name):
    try:
        data = request.json
        update_individual_info(
            DB_PATH,
            name,
            address=data.get('address'),
            phone_number=data.get('phone_number'),
            email=data.get('email')
        )
        return jsonify({'message': 'Individual updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pay-statements', methods=['GET'])
def get_all_paystubs():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        c.execute("""
            SELECT ps.id, i.name, ps.date, ps.filename, ps.amount, ps.company
            FROM pay_statements ps
            JOIN individuals i ON ps.individual_id = i.id
            ORDER BY ps.date DESC
        """)
        
        paystubs = []
        for row in c.fetchall():
            # Read PDF file and convert to base64
            try:
                pdf_path = os.path.join(OUTPUT_FOLDER, row[3])
                with open(pdf_path, 'rb') as pdf_file:
                    pdf_data = base64.b64encode(pdf_file.read()).decode('utf-8')
            except:
                pdf_data = None
            
            paystubs.append({
                'id': row[0],
                'name': row[1],
                'date': row[2],
                'filename': row[3],
                'amount': float(row[4]) if row[4] else 0.0,
                'company': row[5],
                'fileData': pdf_data
            })
        
        conn.close()
        return jsonify(paystubs)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pay-statements/<int:individual_id>', methods=['GET'])
def get_individual_paystubs(individual_id):
    try:
        paystubs = get_pay_statements(DB_PATH, individual_id)
        result = []
        
        for ps in paystubs:
            # Read PDF file and convert to base64
            try:
                pdf_path = os.path.join(OUTPUT_FOLDER, ps[3])
                with open(pdf_path, 'rb') as pdf_file:
                    pdf_data = base64.b64encode(pdf_file.read()).decode('utf-8')
            except:
                pdf_data = None
            
            result.append({
                'id': ps[0],
                'date': ps[2],
                'filename': ps[3],
                'fileData': pdf_data
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pay-statements/<int:paystub_id>', methods=['DELETE'])
def delete_paystub(paystub_id):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Get filename before deletion
        c.execute("SELECT filename FROM pay_statements WHERE id = ?", (paystub_id,))
        result = c.fetchone()
        if result:
            filename = result[0]
            pdf_path = os.path.join(OUTPUT_FOLDER, filename)
            
            # Delete from database
            c.execute("DELETE FROM pay_statements WHERE id = ?", (paystub_id,))
            conn.commit()
            
            # Delete PDF file
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
            
            return jsonify({'message': 'Paystub deleted successfully'})
        else:
            return jsonify({'error': 'Paystub not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/process-pdf', methods=['POST'])
def process_pdf():
    try:
        if 'pdf' not in request.files:
            return jsonify({'error': 'No PDF file provided'}), 400
        
        pdf_file = request.files['pdf']
        if pdf_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save uploaded file to temporary location
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, secure_filename(pdf_file.filename))
        pdf_file.save(temp_path)
        
        # Process PDF using existing function
        split_pdf(temp_path, OUTPUT_FOLDER)
        
        # Clean up
        os.remove(temp_path)
        os.rmdir(temp_dir)
        
        return jsonify({'message': 'PDF processed successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 