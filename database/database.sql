create database proyectodb;

use proyectodb;

create table documentos (
    id int primary key auto_increment,
    nombre varchar(255) not null,
    parametros varchar(255) not null,
    ruta varchar(255) not null
);

create table tipos (
    id int primary key auto_increment,
    tipo varchar(255) not null
);

create table esTipo (
    id_documento int,
    id_tipo int,
    foreign key (id_documento) references documentos(id),
    foreign key (id_tipo) references tipos(id)
);

create table firmas (
	contraseña varchar(8) primary key,
    ruta_firma varchar(255) not null
);

insert into firmas (contraseña, ruta_firma) values ('12345678', './../firmas/firmadiego.png');

insert into tipos (tipo) values ('word'), ('excel'), ('pdf');

insert into documentos (nombre, parametros, ruta) values ('prueba', 'NOMBRE', './../archivos/res_reporte1.docx');

SET @id_documento = LAST_INSERT_ID();
SET @id_tipo1 = LAST_INSERT_ID();

insert into esTipo (id_documento, id_tipo) values (@id_documento, @id_tipo1);

insert into documentos (nombre, parametros, ruta) values ('prueba2', 'LUGAR', './../archivos/plantilla.docx');

insert into documentos (nombre, parametros, ruta) 
values 
('prueba3', 'NOMBRE, LUGAR, FECHA', './../archivos/plantilla.docx'),
('prueba4', 'FECHA', './../archivos/plantilla.docx'),
('prueba5', 'NOMBRE', './../archivos/plantilla.docx'),
('prueba6', 'LUGAR, FECHA', './../archivos/plantilla.docx');

SELECT * FROM documentos ;
SELECT * FROM tipos ;
SELECT * FROM esTipo ;
SELECT * FROM firmas ;

ALTER TABLE documentos MODIFY parametros varchar(255) NULL;