//Paquete para crear un servidor.
var express = require('express');
const myConnection = require('express-myconnection')
const mysql = require('mysql')
const path = require('path')

const fs = require('fs')

const PythonSpawner = require('./pythonSpawner')
const Connection = require('./mySQLConnection')

const { parse } = require('csv-parse')

//Crear bot con el token
const TelegramBot = require('node-telegram-bot-api');
const { basename } = require('path');
//const token = '6478162497:AAHstRMBI5iSt6Zjc2HHD5FyDTQszI1rBlM';
const token = '7883219093:AAEE0j1vSpIxWwhaCAO3LAx0tYVPg3f235Y';

const bot = new TelegramBot(token, { polling: { params: { limit: 1, timeout: 100 } }, filepath: true });

//Se inicia el servidor. Puerto 3000.
var app = express();
app.use(express.json());

app.listen(3000, () => {
  console.log('Esperando mensajes...')
});

//Variable para controlar el flujo de la interaccion con el bot
let step = 0

//Configuracion de la base de datos (host, usuario, contrasena, nombre de la DB y puerto)
const dbConfig = new Connection(
  '127.0.0.1',
  'root',
  '12345678',
  'proyectodb',
  '3306'
);

app.use(myConnection(mysql, dbConfig.pool, 'pool'))

//Variables para almacenar varios mensajes antes de procesarlos
let count = 0;
let mensajes = []
let csvContent = []
let contrasena = ""
let confirmacion = ""
let firmaUsuario = ""
let handlingCallbackQuery = true;

//Indices para moverse en la lista de documentos
let listaInicio = 0
let listaFin = 5

//Variable que toma nombre cuando el usuario elije un documento de la lista (RECORDATORIO: CAMBIAR A ID EN LUGAR DE NOMBRE)
let documentName = ''

//Funcion que detiene el flujo del sistema hasta obtener respuesta de la consulta a la base de datos (parametros y ruta del documento seleccionado)
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

//Funcion asincrona que se ejecuta al recibir un mensaje
bot.on("message", async (msg) => {

  if (msg.document) {
    return;
  }

  const chatId = msg.chat.id;

  //Step 2: Espera a recibir n mensajes para n parametros y pasarle los mensajes al script de python para insertarlos en el documento
  if (step === 2) {
    mensajes.push(msg.text)
    count = count + 1
    
    const documentData = await getDocumentData(documentName)
    
    paramsNum = documentData[0].split(', ').length
    // await bot.sendMessage(chatId,'Ingrese una contrasena valida')
    if (count < paramsNum) {
 

    } else {
      const pySpawner = new PythonSpawner(bot, msg.chat.id)
      try {
        //Pasar los mensajes al script de python para que cree un nuevo documento con ellos
        bot.sendMessage(chatId,'Preparando documento espere un momento')
        firmaUsuario = await dbConfig.getRutaFirma(contrasena)
        await pySpawner.executeScriptAndSend(mensajes, documentData[0], documentData[1], firmaUsuario);
      } catch (err) {
        // CAMBIALO POR ESTO PARA VER EL DETALLE:
        console.error('EL ERROR REAL ES:', err.message);
        if (err.response) {
          console.error('Detalles del servidor Python:', err.response.data);
        }
      }
      count = 0
      }
    //STEP 5: Se está en el proceso de insercion de un nuevo documento a la base de datos
  } else if (step === 5) {
    //Se agregan los parametros del documento a la base de datos
    await dbConfig.updateParametros(msg.text.toUpperCase())

    bot.sendMessage(chatId, 'Documento agregado correctamente, parametros: ' + msg.text.toUpperCase())
    step = 1

  }
  else {
    if (msg.text == '/start') {
      mensajes = []
      contrasena = ""
      confirmacion =""
      step = 1

      //Se obtiene la lista de documento de la base de datos
      nombres = await dbConfig.getDocumentos()


      listaInicio = 0
      listaFin = 5
      lista = nombres.slice(listaInicio, listaFin)
      lista = lista.map(doc => doc.nombre)

      //Se crea un botón por cada elemento de la lista
      struc = lista.map(doc => [{ text: doc, callback_data: doc }])
      //Se agrega el boton para avanzar en la lista ya que al inicio solo se nos muestran los primeros 5
      struc.push([{ text: 'Siguiente ▶', callback_data: 'sig' }])

      const replyMarkup = {
        inline_keyboard: struc
      }

      bot.sendMessage(chatId, 'Documentos:', { reply_markup: replyMarkup })

    } else {
      if (step === 0)
        bot.sendMessage(chatId, 'Para iniciar escriba el comando /start');
      else (step != 5 && handlingCallbackQuery) ? bot.sendMessage(chatId, 'Por favor selecciona un documento de la lista o use el comando /start para volver a ver la lista') : console.log('Esperando parametros');
       
    }

  }

});

//Este metodo recibe la informacion del boton que se pulsa en la lista de documentos
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  let bottom = [{ text: '◀ Anterior', callback_data: 'ant' }, { text: 'Siguiente ▶', callback_data: 'sig' }]

  if (step > 0) {
    switch (data) {
      //En caso de avanzar en la lista:
      case 'sig':
        listaInicio = listaFin

        if (listaFin * 2 > nombres.length - 1) {
          listaFin = nombres.length
          bottom = [{ text: '◀ Anterior', callback_data: 'ant' }]
        } else {
          listaFin = listaFin * 2
        }

        lista = nombres.slice(listaInicio, listaFin)
        console.log(lista)
        lista = lista.map(doc => doc.nombre)
        struc = lista.map(doc => [{ text: doc, callback_data: doc }])

        struc.push(bottom)

        replyMarkup = {
          inline_keyboard: struc
        }

        bot.editMessageReplyMarkup(replyMarkup, { chat_id: chatId, message_id: callbackQuery.message.message_id })
        break;
      //En caso de retroceder en la lista:
      case 'ant':

        listaInicio = listaInicio - 5

        if (listaInicio <= 0) {
          listaInicio = 0
          listaFin = 5
          bottom = [{ text: 'Siguiente ▶', callback_data: 'sig' }]
        } else {
          listaFin = listaInicio + 5
        }

        lista = nombres.slice(listaInicio, listaFin)
        console.log(lista)
        lista = lista.map(doc => doc.nombre)
        struc = lista.map(doc => [{ text: doc, callback_data: doc }])

        struc.push(bottom)

        replyMarkup = {
          inline_keyboard: struc
        }

        bot.editMessageReplyMarkup(replyMarkup, { chat_id: chatId, message_id: callbackQuery.message.message_id })
        break;
      //En caso de querer ver una vista previa del documento que se quiere editar:
      case 'preview':

        defRuta = await getDocumentData(documentName)
            //bot.sendDocument(chatId, defRuta[1])
            bot.sendDocument(chatId, "../archivos/res_reporte1.docx")

        break;
      //Por defecto se considera que el usuario seleccionó un documento de la lista:
      default: params = await getDocumentData(data)
        handlingCallbackQuery = false;
        documentName = data

        replyMarkup = {
          inline_keyboard: [
            [{ text: 'Vista previa del documento', callback_data: 'preview' }]
          ]
        }
        bot.sendMessage(chatId, '¿Desea firmar el documento responde Si o No?')
        bot.once('message', async(responseMsg) => {
            confirmacion = responseMsg.text.toUpperCase();
            if (confirmacion == 'SI') {
                await bot.sendMessage(chatId, 'Ingrese una contrasena válida o proporcione una firma');
                bot.once('photo', async (responseMsg2) => {
                  console.log('Entro aqui en la foto')
                  let photos = responseMsg2.photo
                  let highphoto = photos[photos.length-1]
                  let docId = highphoto.file_id 
                  await bot.sendMessage(chatId, 'Por favor ingrese una contrasena para poder acceder a la firma cuando se necesite')
                  bot.once('message', async (msg)=>{
                    console.log('Entro aqui en la firma')
                    contrasena = msg.text
                    const filePath = './../firmas/'
                    const filePath2 = await bot.downloadFile(docId, filePath)
                    let file_name = path.basename(filePath2);
                    res = await dbConfig.newFirma(contrasena,filePath + file_name)
                    console.log(res)
                    bot.sendMessage(chatId, 'Debe ingresar por mensajes separados los siguientes parametros en el siguiente orden: ' + params[0], { reply_markup: JSON.stringify(replyMarkup) });
                    step = 2;
                  });
                 });
    
                bot.once('message', async (responseMsg3)=>{
                  contrasena = responseMsg3.text
                  console.log('Entro en el final')
                  // bot.sendMessage(chatId, 'Debe ingresar por mensajes separados los siguientes parametros en el siguiente orden: ' + params[0], { reply_markup: JSON.stringify(replyMarkup) });
                  // step = 2;
                  bot.sendMessage(chatId, 'Debe ingresar por mensajes separados los siguientes parametros en el siguiente orden: ' + params[0], { reply_markup: JSON.stringify(replyMarkup) });
                  step = 2;
                });
          }
        });
      break;    
    }
  }

})

//Metodo que se ejecuta al recibir un documento, enfocado en insertarlo en la base de datos y guardar el archivo en una ruta especifica, conservando su nombre original 
bot.on("document", async (msg) => {
  const chatId = msg.chat.id
  const docId = msg.document.file_id
  const filePath = './../archivos/'

  //console.log(filePath2)
  const filePath2 = await bot.downloadFile(docId, filePath)

  fs.renameSync(filePath2, filePath + msg.document.file_name)
  //Despues de renombrar el documento identifica si es un archivo csv y si no lo es crea un registro en la BD del documento
  if (msg.document.mime_type === 'text/csv') {
    bot.sendMessage(chatId, '¡Recibiste un archivo CSV!')
    fs.readFileSync(filePath + msg.document.file_name, 'utf-8')
    // Crear un objeto Parser para analizar el CSV
    const parser = parse({ delimiter: ';' }); // Deshabilitar la detección automática de columnas
    const result = [];
    // Manejar el evento 'data' para obtener cada fila del CSV
    parser.on('data', (row) => {
      result.push(row);
    });
    fs.createReadStream(filePath + msg.document.file_name).pipe(parser);
    // Manejar el evento 'end' para realizar acciones después de que se haya analizado todo el CSV
    parser.on('end', async () => {
      const headerRow = result.shift(); // Extraer la primera fila como la cabecera
      csvContent = result.map((row) => {
        const obj = {};
        headerRow.forEach((key, index) => {
          obj[key] = row[index];
        });
        return obj;
      });
      console.log(headerRow);
      // Iterar sobre cada objeto en csvContent
      let values = []
      for (const obj of csvContent) {
        // Obtener los valores del objeto
        values = Object.values(obj);
        try {
          firmaUsuario = await dbConfig.getRutaFirma(contrasena)
          const documentData = await getDocumentData(documentName)//await dbConfig.getRutaFirma(contrasena)
          const pySpawner = new PythonSpawner(bot, msg.chat.id)
          //Pasar los mensajes al script de python para que cree un nuevo documento con ellos
          pySpawner.pythonInput(values, documentData[0], documentData[1], firmaUsuario)
        } catch (err) {
          // CAMBIALO POR ESTO PARA VER EL DETALLE:
          console.error('EL ERROR REAL ES:', err.message);
          if (err.response) {
            console.error('Detalles del servidor Python:', err.response.data);
          }
        }
        console.log(values)
      }
      values = []
      csvContent = []
    });
    step = 1;
  }
  else {
    res = await dbConfig.newDocument(msg.document.file_name, filePath + msg.document.file_name)
    bot.sendMessage(chatId, "Creando documento...\nPor favor escribe los parametros del documento.\nRecuerda separarlos por comas.")
    console.log(res)
    step = 5
  }
})