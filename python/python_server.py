import sys
import os
from flask import Flask, request, jsonify

# --- Configuración de Rutas ---
# Obtiene el directorio donde se encuentra python_server.py (que es /python)
script_dir = os.path.dirname(__file__)

# Agregamos la carpeta actual a la ruta para poder importar fordocx
sys.path.append(script_dir) 

# ARCHIVOS_PATH (RUTA DE SALIDA) ahora apunta a ITCM_SS_Bot/archivos
ARCHIVOS_PATH = os.path.abspath(os.path.join(script_dir, '..', 'archivos'))

# RUTA BASE DEL PROYECTO (ITCM_SS_Bot/)
PROJECT_ROOT = os.path.abspath(os.path.join(script_dir, '..'))

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
        ruta_raw = data.get("ruta")
        firma_path = data.get("image_path") 

        # --- CAMBIO CLAVE: CONSTRUIR RUTA ABSOLUTA DE LA PLANTILLA ---
        # 1. Quitar el '/' inicial de la ruta de la BD (si existe)
        if ruta_raw.startswith('/'):
            ruta_raw = ruta_raw[1:]
            
        # 2. Unir la ruta raíz del proyecto con la ruta relativa de la BD.
        ruta_plantilla_abs = os.path.join(PROJECT_ROOT, ruta_raw)
        
        # 3. Normalizar la ruta final
        ruta_plantilla_abs = os.path.normpath(ruta_plantilla_abs)

        # *** LÍNEA DE DEPURACIÓN CRÍTICA ***
        print(f"RUTA PLANTILLA (ABS): {ruta_plantilla_abs}")
        # -----------------------------------
        
        # 4. Ejecuta el script ForDocx
        # Pasamos la ruta absoluta de la plantilla.
        doc_processor = ForDocx(msgs, params, ruta_plantilla_abs, ARCHIVOS_PATH)
        
        # 5. Obtiene el nombre del archivo generado
        generated_filename = doc_processor.getRutaOut()

        # 6. Devuelve la respuesta
        return jsonify({
            "success": True,
            "filename": generated_filename
        }), 200

    except Exception as e:
        print(f"Error en Flask: {e}")
        # Devuelve el error para que Node.js lo muestre
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# --- Inicia el Servidor ---
if __name__ == '__main__':
    print(f"Iniciando servidor Flask en http://localhost:5000")
    print(f"Carpeta de salida: {ARCHIVOS_PATH}")
    app.run(port=5000, debug=False)