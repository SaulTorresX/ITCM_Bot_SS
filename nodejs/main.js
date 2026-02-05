//CREACION DEL SERVIDOR
var express = require('express');  //Para el servidor 
const myConnection = require('express-myconnection')  //Para la conexion con la base de datos
const fs = require('fs')  // Sistema de archivos
const PythonSpawner = require('./pythonSpawner');

//PROCESAMIENTO DE LA BASE DE DATOS
const Connection = require('./mySQLConnection')  //Define la conexion activa
const mysql = require('mysql')

///(PROCESAMIENTO DEL BOT)Crear bot con el token
const TelegramBot = require('node-telegram-bot-api');
const { basename } = require('path');
const token = '7883219093:AAEE0j1vSpIxWwhaCAO3LAx0tYVPg3f235Y';
const bot = new TelegramBot(token, { polling: { params: { limit: 1, timeout: 100 } }, filepath: true });

//Configuracion de la base de datos (host, usuario, contraseña, nombre de la DB y puerto)
const dbConfig = new Connection(
    '127.0.0.1',
    'root',
    '12345678',
    'proyectodb',
    '3306'
);

//Se inicia el servidor. Puerto 3000.
var app = express();
app.use(express.json());

//MIDDLEWARE: https://expressjs.com/en/guide/using-middleware.html
app.use(myConnection(mysql, dbConfig.pool, 'pool'))

app.listen(3000, () => {
    console.log('Esperando mensajes...')
});

//(Metodo auxiliar) Funcion que detiene el flujo del sistema hasta obtener respuesta de la consulta a la base de datos (parametros y ruta del documento seleccionado)
function getDocumentData(name) {
    return new Promise(async (resolve, reject) => {

        try {
            const paramsResult = await dbConfig.getParams(name)
            const routeResult = await dbConfig.getRuta(name)
            resolve([paramsResult, routeResult])

        } catch (err) {
            reject(err)
        }
    })
}

// --- VARIABLES GLOBALES NECESARIAS PARA LA LÓGICA DE FLUJO ---
let step = 0
let nombres = []
let listaInicio = 0
let count = 0;
let mensajes = []
let listaFin = 5
let documentName = ''
let params; // Declaración de 'params' para que funcione en el alcance global


// Manejador principal: Se activa con cualquier mensaje de texto o comando que el usuario envía.
bot.on('message', async (msg) => {
    if (msg.document) {
        return;
    }
    const chatId = msg.chat.id;
    console.log("Mensaje [" + msg.text + " ]")
     if (step === 0) {
        if (msg.text == '/start') {
            step = 1
            //Se obtiene la lista de documento de la base de datos
            nombres = await dbConfig.getDocumentos()
            listaInicio = 0
            listaFin = 5
            let lista = nombres.slice(listaInicio, listaFin)
            lista = lista.map(doc => doc.nombre)
            //Se crea un botón por cada elemento de la lista
            let struc = lista.map(doc => [{ text: doc, callback_data: doc }])
            //Se agrega el boton para avanzar en la lista ya que al inicio solo se nos muestran los primeros 5
            struc.push([{ text: 'Siguiente ▶', callback_data: 'sig' }])
            const replyMarkup = {
                inline_keyboard: struc
            }
            bot.sendMessage(chatId, 'Documentos:', { reply_markup: replyMarkup })
        } else {
            bot.sendMessage(chatId, 'Para iniciar escriba el comando /start');
        }
    } else if (step === 1) {
        bot.sendMessage(chatId, "Por favor selecciona un documento de la lista o use el comando /start para volver a ver la lista ")
        console.log(" Esperando parametros");
    } 
    //Step 2: Espera a recibir n mensajes para n parametros y pasarle los mensajes al script de python para insertarlos en el documento
    else if (step === 2) {
        mensajes.push(msg.text)
        count = count + 1

        const documentData = await getDocumentData(documentName)

        paramsNum = documentData[0].split(', ').length
        if (count < paramsNum) {


        } else {
            const pySpawner = new PythonSpawner(bot, msg.chat.id)
            try {
                //Pasar los mensajes al script de python para que cree un nuevo documento con ellos
                bot.sendMessage(chatId, 'Preparando documento espere un momento')
                firmaUsuario = await dbConfig.getRutaFirma(contraseña)
                pySpawner.pythonInput(mensajes, documentData[0], documentData[1], firmaUsuario)
                step = 1
            } catch (err) {
                console.log('Error al esperar resultados')
            }
            count = 0

        }
        //STEP 5: Se está en el proceso de insercion de un nuevo documento a la base de datos
    }
});

// Manejador de interacciones: Recibe la información (callback_query).
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    if (step > 0) {
        let bottom = [{ text: '◀ Anterior', callback_data: 'ant' }, { text: 'Siguiente ▶', callback_data: 'sig' }];
        let struc;
        let replyMarkup;
        let lista;
        switch (data) {
            // En caso de avanzar en la lista:
            case 'sig':
                listaInicio = listaFin;
                if (listaFin * 2 > nombres.length - 1) {
                    listaFin = nombres.length;
                    bottom = [{ text: '◀ Anterior', callback_data: 'ant' }];
                } else {
                    listaFin = listaFin * 2;
                }
                lista = nombres.slice(listaInicio, listaFin);
                console.log(lista);
                lista = lista.map(doc => doc.nombre);
                struc = lista.map(doc => [{ text: doc, callback_data: doc }]);
                struc.push(bottom);
                replyMarkup = {
                    inline_keyboard: struc
                };
                bot.editMessageReplyMarkup(replyMarkup, { chat_id: chatId, message_id: callbackQuery.message.message_id });
                break;
            // En caso de retroceder en la lista:
            case 'ant':
                listaInicio = listaInicio - 5;
                if (listaInicio <= 0) {
                    listaInicio = 0;
                    listaFin = 5;
                    bottom = [{ text: 'Siguiente ▶', callback_data: 'sig' }];
                } else {
                    listaFin = listaInicio + 5;
                }
                lista = nombres.slice(listaInicio, listaFin);
                console.log(lista);
                lista = lista.map(doc => doc.nombre);
                struc = lista.map(doc => [{ text: doc, callback_data: doc }]);
                struc.push(bottom);
                replyMarkup = {
                    inline_keyboard: struc
                };
                bot.editMessageReplyMarkup(replyMarkup, { chat_id: chatId, message_id: callbackQuery.message.message_id });
                break;
            // En caso de querer ver una vista previa del documento que se quiere editar:
            case 'preview':
                let defRuta = await getDocumentData(documentName);
                bot.sendDocument(chatId,defRuta[1])
                break;
            // Por defecto se considera que el usuario seleccionó un documento de la lista:
            default:
                // 1. OBTENER DATOS Y ACTUALIZAR ESTADO
                params = await getDocumentData(data);
                documentName = data;
                // 2. CONSTRUIR NUEVO TECLADO (Vista previa)
                finalReplyMarkup = {
                    inline_keyboard: [
                        [{ text: 'Vista previa del documento', callback_data: 'preview' }]
                    ]
                };
                // 3. ENVIAR MENSAJE CON EL NUEVO TECLADO
                bot.sendMessage(chatId, 'Documento **' + documentName + '** seleccionado. Listo para procesamiento o vista previa.', {
                    reply_markup: finalReplyMarkup,
                    parse_mode: 'Markdown'
                });
                // 4. ACTUALIZAR ESTADO
                bot.sendMessage(chatId, 'Debe ingresar por mensajes separados los siguientes parametros en el siguiente orden: ' + params[0], { reply_markup: JSON.stringify(replyMarkup) });
                step = 2; // Pasa al siguiente estado (esperando parámetros)
                break;
        }
    }
});

// Manejador de documentos: Se ejecuta específicamente al recibir un archivo (documento, CSV, PDF, etc.) del usuario.
bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    console.log(msg.document)
});