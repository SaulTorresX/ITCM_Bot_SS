-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 29-01-2024 a las 02:57:50
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `proyectodb`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `documentos`
--

CREATE TABLE `documentos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `parametros` varchar(255),
  `ruta` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `documentos`
--

INSERT INTO `documentos` (`id`, `nombre`, `parametros`, `ruta`) VALUES
(1, 'prueba', 'NOMBRE, CIUDAD', './../archivos/res_reporte1.docx'),
(2, 'prueba2', 'LUGAR', './../archivos/plantilla.docx'),
(3, 'prueba3', 'NOMBRE, LUGAR, FECHA', './../archivos/plantilla.docx'),
(4, 'prueba4', 'FECHA', './../archivos/plantilla.docx'),
(5, 'prueba5', 'NOMBRE', './../archivos/plantilla.docx'),
(6, 'prueba6', 'LUGAR, FECHA', './../archivos/plantilla.docx'),
(21, 'MCI-2023 Liberacion Academica.docx', 'DIA, MES, AÑO, PROFESOR, PERIODO', './../archivos/MCI-2023 Liberacion Academica.docx'),
(28, '23-20-37.552751.docx', 'PRUEBA', './../archivos/23-20-37.552751.docx'),
(29, '21-29-01.837634.docx', 'UNO, DOS, TRES', './../archivos/21-29-01.837634.docx'),
(30, 'Tutorias CADC 3 Semestre.docx', 'C1, C2, C3, C4', './../archivos/Tutorias CADC 3 Semestre.docx'),
(31, 'prueba tablas.docx', 'NOMBRE, APELLIDO', './../archivos/prueba tablas.docx');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estipo`
--

CREATE TABLE `estipo` (
  `id_documento` int(11) DEFAULT NULL,
  `id_tipo` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estipo`
--

INSERT INTO `estipo` (`id_documento`, `id_tipo`) VALUES
(1, 1),
(2, 1),
(28, 1),
(29, 1),
(30, 1),
(31, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos`
--

CREATE TABLE `tipos` (
  `id` int(11) NOT NULL,
  `tipo` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipos`
--

INSERT INTO `tipos` (`id`, `tipo`) VALUES
(1, 'word'),
(2, 'excel'),
(3, 'pdf');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `documentos`
--
ALTER TABLE `documentos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `estipo`
--
ALTER TABLE `estipo`
  ADD KEY `id_documento` (`id_documento`),
  ADD KEY `id_tipo` (`id_tipo`);

--
-- Indices de la tabla `tipos`
--
ALTER TABLE `tipos`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `documentos`
--
ALTER TABLE `documentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de la tabla `tipos`
--
ALTER TABLE `tipos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `estipo`
--
ALTER TABLE `estipo`
  ADD CONSTRAINT `estipo_ibfk_1` FOREIGN KEY (`id_documento`) REFERENCES `documentos` (`id`),
  ADD CONSTRAINT `estipo_ibfk_2` FOREIGN KEY (`id_tipo`) REFERENCES `tipos` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
