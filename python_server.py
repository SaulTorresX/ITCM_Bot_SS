import sys
import os
from flask import Flask, request, jsonify

# --- Configuración de Rutas ---
# Añade la carpeta 'python' a las rutas para que podamos importarla
script_dir = os.path.dirname(__file__)
python_scripts_path = os.path.join(script_dir, 'python')
sys.path.append(python_scripts_path)

# Define la carpeta de salida para los documentos
ARCHIVOS_PATH = os.path.join(script_dir, 'archivos')

# Asegúrate de que la carpeta 'archivos' exista
if not os.path.exists(ARCHIVOS_PATH):
    os.makedirs(ARCHIVOS_PATH)

# Ahora importa tu lógica de 'fordocx'
from fordocx import ForDocx

# --- Creación del Servidor ---
app = Flask(__name__)

# --- Definición del Endpoint ---
@app.route("/generate-doc", methods=["POST"])
def generate_document():
    try:
        # 1. Recibe los datos (JSON)
        data = request.get_json()

        msgs = data.get("msgs")
        params = data.get("params")
        ruta_raw = data.get("ruta") # <--- Le cambié el nombre aquí para que coincida abajo

        # 2. Arregla la ruta (Limpieza)
        if ruta_raw and ruta_raw.startswith(".."):
            ruta_limpia = ruta_raw.replace("..", ".", 1) 
        else:
            ruta_limpia = ruta_raw

        # Convertimos a ruta absoluta
        ruta_final_plantilla = os.path.abspath(ruta_limpia)

        # 3. Ejecuta el script ForDocx
        doc_processor = ForDocx(msgs, params, ruta_final_plantilla, ARCHIVOS_PATH)
        
        # 4. Obtiene el nombre del archivo generado (¡ESTO FALTABA!)
        generated_filename = doc_processor.getRutaOut()

        # 5. Devuelve la respuesta
        return jsonify({
            "success": True,
            "filename": generated_filename
        }), 200

    except Exception as e:
        print(f"Error en Flask: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# --- Inicia el Servidor ---
if __name__ == '__main__':
    print(f"Iniciando servidor Flask en http://localhost:5000")
    print(f"Los archivos se guardarán en: {ARCHIVOS_PATH}")
    app.run(port=5000, debug=True)