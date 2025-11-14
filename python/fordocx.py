from docx import Document
from datetime import datetime
import os

class ForDocx:

    def __init__(self, data, params, ruta,output_directory):

        #El nombre del nuevo archivo generado se da por la hora actual
        now = datetime.now()
        # Genera solo el nombre del archivo
        self.output_filename = str(now.time()).replace(':', '-') + '.docx'
        # Construye la ruta completa usando la carpeta que nos pasó el servidor
        self.rutaOut = os.path.join(output_directory, self.output_filename)

        self.rutaIn = ruta.strip()

        #Guardar el documento antes de trabajar con el para asegurar la codificación adecuada (UTF-8)
        self.document = Document(self.rutaIn)

        self.document.save(self.rutaIn)

        self.document = Document(self.rutaIn)

        #paragraph = document.add_paragraph('KACIEL BENITEZ')

        #PARAMETROS QUE SE OBTENDRAN DE LA BASE DE DATOS DEPENDIENDO DE LA PLANTILLA SELECCIONADA
        #params = ['NOMBRE', 'TITULO', 'NUMCONTROL', 'COLONIA', 'CIUDAD', 'TELEFONO']

        #self.params = ['NOMBRE']

        self.params = []

        # ...

        # 1. Manejo de PARAMETROS (sigue siendo texto, así que se queda igual)
        # Verifica si es string antes de dividir, por si acaso.
        if isinstance(params, str):
             self.params = params.split(', ')
        else:
             self.params = params

        # 2. Manejo de DATOS/INPUTS (Aquí corregimos el error)
        # Como viene de JSON, 'data' ya es una lista. No hacemos .split()
        if isinstance(data, str):
            self.inputs = data.split(',') # Solo dividimos si por error llega como texto
        else:
            self.inputs = data # <--- ¡Lo tomamos directo!

        # ...


        text = self.document.paragraphs                   
        tables = self.document.tables


        if(text != [] and tables != []):
            self.readParagraphs(text)
            self.readTables(tables)
        elif(text != []):
            self.readParagraphs(text)
        elif(tables != []):
            self.readTables(tables)

        self.document.save(self.rutaOut)


    def readParagraphs(self, text):
        for para in text:
            for param, input in zip(self.params, self.inputs):
                #print(param)
                if('['+ param +']' in para.text):
                    
                    for run in para.runs:
                        if '[' + param + ']' in run.text:
                            #print('A: ' + run.text)
                            run.text = run.text.replace('['+ param +']', input)
                        #else:
                            #print('B: '+run.text)        
                    

                            

                        #print("remplazado: " + '[['+param+']]'+ " por: " + run.text)
                    #para.text = para.text.replace('['+ param +']', input)

    def readTables(self, tables):
        for table in tables:
            for row in table.rows:
                for cell in row.cells:
                    for para in cell.paragraphs:
                        for param, input in zip(self.params, self.inputs):
                            if('['+ param +']' in para.text):
                                for run in para.runs:
                                    if '[' + param + ']' in run.text:
                                        #print('A: ' + run.text)
                                        run.text = run.text.replace('['+ param +']', input)

    def getRutaOut(self):
        return self.output_filename
    