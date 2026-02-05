const fs = require('fs');
const path = require('path');
const axios = require('axios'); // ¡Usamos axios en lugar de spawn!

// Esta es la URL de tu nuevo servidor Flask
const PYTHON_API_URL = 'http://localhost:5001/generate-doc';

class PythonSpawner {

    constructor(bot, chatId) {
        this.bot = bot;
        this.chatId = chatId;
    }

    /**
     * El método principal AHORA llama a la API de Flask
     */
    async executeScriptAndSend(msgs, params, ruta, image_path) {
        
        console.log(`---> Contactando al servidor de Python en: ${PYTHON_API_URL}`);

        // 1. Prepara el "cuerpo" de la petición en formato JSON
        const payload = {
            msgs: msgs,
            params: params,
            ruta: ruta,
            image_path: image_path // Lo mandamos por si acaso
        };

        try {
            // 2. Llama a la API de Python y espera la respuesta
            //    Esto reemplaza todo el código de spawn, stdout, stderr, etc.
            const response = await axios.post(PYTHON_API_URL, payload);

            const { filename, error } = response.data;

            if (error) {
                // Si Flask nos devolvió un error, lo mostramos
                throw new Error(error);
            }

            // 3. Llama a la lógica de envío (esto no cambia)
            this.handleScriptOutput(filename);

        } catch (error) {
            // Este catch ahora atrapa errores de red O errores de Python
            console.error(`Error al contactar la API de Python: ${error.message}`);
            this.bot.sendMessage(this.chatId, `Error al generar el documento: ${error.message}`);
        }
    }

    /**
     * Esta función es la MISMA que ya tenías.
     * Recibe el nombre del archivo y lo envía.
     */
    handleScriptOutput(fileName) {
        // La lógica es idéntica, solo cambié 'response' por 'fileName'
        // para que sea más claro
        console.log('Respuesta recibida de la API:', JSON.stringify(fileName));

        if (!fileName) {
            console.error("Error: La API de Python no devolvió un nombre de archivo.");
            this.bot.sendMessage(this.chatId, 'El script no devolvió un nombre de archivo.');
            return;
        }

        const pathToArchivos = path.resolve(__dirname, '..', 'archivos');
        const finalFilePath = path.join(pathToArchivos, fileName);

        console.log(`Intentando enviar archivo desde la ruta: "${finalFilePath}"`);

        if (!fs.existsSync(finalFilePath)) {
            console.error(`Error: El archivo no existe en la ruta: "${finalFilePath}"`);
            this.bot.sendMessage(this.chatId, 'Error: No se pudo encontrar el archivo generado.');
            return;
        }

        this.bot.sendDocument(this.chatId, finalFilePath)
            .then(() => {
                console.log("Éxito: Documento enviado.");
            })
            .catch(error => {
                console.error('Error al enviar el documento:', error.message);
                this.bot.sendMessage(this.chatId, 'Hubo un error al enviar el documento.');
            });
    }
}
module.exports = PythonSpawner;