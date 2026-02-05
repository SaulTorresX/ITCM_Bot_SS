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

        # 2. Construcción de Ruta Absoluta (Versión Mac)
        # A. Limpiamos la basura: tomamos solo el nombre del archivo (ej: "res_reporte1.docx")
        nombre_archivo = os.path.basename(ruta_raw)
        
        # B. Construimos la RUTA ABSOLUTA uniendo tu carpeta fija con el nombre del archivo
        # Esto generará algo como: /Users/eddie/Downloads/ITCM_Bot_SS-main/archivos/res_reporte1.docx
        ruta_final_plantilla = os.path.join(ARCHIVOS_PATH, nombre_archivo)

        print(f"--> Usando ruta absoluta final: {ruta_final_plantilla}")

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
    print(f"Iniciando servidor Flask en http://localhost:5001")
    print(f"Los archivos se guardarán en: {ARCHIVOS_PATH}")
    app.run(port=5001, debug=True)