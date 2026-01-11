-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: sirius_db
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Temporary view structure for view `active_orders_view`
--

DROP TABLE IF EXISTS `active_orders_view`;
/*!50001 DROP VIEW IF EXISTS `active_orders_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `active_orders_view` AS SELECT 
 1 AS `order_id`,
 1 AS `order_time`,
 1 AS `table_number`,
 1 AS `table_capacity`,
 1 AS `waiter_name`,
 1 AS `order_status`,
 1 AS `subtotal`,
 1 AS `tax_amount`,
 1 AS `total`,
 1 AS `order_notes`,
 1 AS `total_items`,
 1 AS `pending_items`,
 1 AS `cooking_items`,
 1 AS `ready_items`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_id` int DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_user_id` (`user_id`),
  KEY `idx_audit_logs_created_at` (`created_at`),
  KEY `idx_audit_logs_action` (`action`),
  KEY `idx_audit_logs_table_name` (`table_name`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categories_active` (`active`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Entradas','Aperitivos y entradas tradicionales',1,'2025-07-18 01:34:01'),(2,'Platos Principales','Platos fuertes de la casa',1,'2025-07-18 01:34:01'),(3,'Postres','Dulces y postres artesanales',1,'2025-07-18 01:34:01'),(4,'Bebidas','Bebidas frías y calientes',1,'2025-07-18 01:34:01'),(5,'Sopas','Sopas y caldos tradicionales',1,'2025-07-18 01:34:01'),(6,'Acompañamientos','Guarniciones y acompañamientos',1,'2025-07-18 01:34:01');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `daily_sales_view`
--

DROP TABLE IF EXISTS `daily_sales_view`;
/*!50001 DROP VIEW IF EXISTS `daily_sales_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `daily_sales_view` AS SELECT 
 1 AS `sale_date`,
 1 AS `total_orders`,
 1 AS `total_sales`,
 1 AS `average_ticket`,
 1 AS `cash_sales`,
 1 AS `card_sales`,
 1 AS `nequi_sales`,
 1 AS `transfer_sales`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `kitchen_items_view`
--

DROP TABLE IF EXISTS `kitchen_items_view`;
/*!50001 DROP VIEW IF EXISTS `kitchen_items_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `kitchen_items_view` AS SELECT 
 1 AS `item_id`,
 1 AS `order_id`,
 1 AS `order_time`,
 1 AS `table_number`,
 1 AS `item_name`,
 1 AS `item_description`,
 1 AS `quantity`,
 1 AS `item_status`,
 1 AS `item_notes`,
 1 AS `preparation_time`,
 1 AS `waiter_name`,
 1 AS `minutes_since_ordered`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `category_id` int DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `available` tinyint(1) DEFAULT '1',
  `preparation_time` int DEFAULT '15' COMMENT 'Tiempo en minutos',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_menu_items_category` (`category_id`),
  KEY `idx_menu_items_available` (`available`),
  KEY `idx_menu_items_price` (`price`),
  CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES (1,'Arepa de Chócolo','Arepa dulce de maíz tierno con queso campesino',8500.00,1,NULL,1,10,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(2,'Patacones','Plátano verde frito con hogao y queso',12000.00,1,NULL,1,8,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(3,'Empanadas de Pollo','Empanadas criollas rellenas de pollo desmechado',3500.00,1,NULL,1,12,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(4,'Chicharrón','Chicharrón de cerdo crocante con arepa',15000.00,1,NULL,1,15,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(5,'Mamona a la Llanera','Carne de res asada al carbón con yuca y plátano',35000.00,2,NULL,1,45,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(6,'Pescado a la Plancha','Pescado de río con arroz de coco y patacones',28000.00,2,NULL,1,25,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(7,'Pollo Campesino','Pollo guisado con papa criolla y yuca',22000.00,2,NULL,1,30,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(8,'Tamal Tolimense','Tamal tradicional con pollo, cerdo y huevo',18000.00,2,NULL,1,20,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(9,'Bandeja Paisa','Plato típico con frijoles, arroz, carne, chorizo',32000.00,2,NULL,1,35,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(10,'Sancocho de Gallina','Sancocho tradicional con gallina criolla',25000.00,5,NULL,1,40,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(11,'Sopa de Tortilla','Sopa caliente con tortilla de maíz',15000.00,5,NULL,1,20,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(12,'Changua','Sopa de leche con huevo y cilantro',12000.00,5,NULL,1,15,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(13,'Jugo de Lulo','Jugo natural de lulo amazónico',8000.00,4,NULL,1,5,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(14,'Chicha de Maíz','Bebida tradicional fermentada',6000.00,4,NULL,1,3,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(15,'Café de Olla','Café tradicional con panela',4000.00,4,NULL,1,8,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(16,'Agua de Panela','Bebida caliente con limón',3000.00,4,NULL,1,5,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(17,'Bocadillo con Queso','Dulce de guayaba con queso campesino',8000.00,3,NULL,1,5,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(18,'Tres Leches','Torta tres leches casera',12000.00,3,NULL,1,10,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(19,'Cocadas','Dulce de coco con panela',5000.00,3,NULL,1,8,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(20,'Arroz Blanco','Arroz blanco tradicional',4000.00,6,NULL,1,15,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(21,'Frijoles Rojos','Frijoles rojos guisados',6000.00,6,NULL,1,25,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(22,'Yuca Cocida','Yuca cocida con sal',5000.00,6,NULL,1,20,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(23,'Plátano Maduro','Plátano maduro frito',4500.00,6,NULL,1,10,'2025-07-18 01:34:01','2025-07-18 01:34:01'),(24,'hvcuodhveuhvbhdv','dkjnvkdvbdvdvc',12000.00,6,NULL,1,20,'2025-07-18 02:31:40','2025-07-18 02:31:40');
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `menu_item_id` int DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `status` enum('pendiente','preparacion','listo','entregado') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_status` (`status`),
  KEY `idx_order_items_menu_item` (`menu_item_id`),
  KEY `idx_order_items_order_status` (`order_id`,`status`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (8,4,20,1,4000.00,4000.00,'pendiente',NULL,'2025-07-18 04:37:24','2025-07-18 04:37:24'),(9,4,24,1,12000.00,12000.00,'pendiente',NULL,'2025-07-18 04:37:38','2025-07-18 04:37:38'),(10,4,23,1,4500.00,4500.00,'pendiente',NULL,'2025-07-18 04:37:41','2025-07-18 04:37:41'),(11,4,15,1,4000.00,4000.00,'pendiente',NULL,'2025-07-18 04:37:53','2025-07-18 04:37:53'),(12,4,6,1,28000.00,28000.00,'pendiente',NULL,'2025-07-18 04:38:09','2025-07-18 04:38:09'),(13,4,9,1,32000.00,32000.00,'pendiente',NULL,'2025-07-18 04:38:21','2025-07-18 04:38:21'),(67,52,20,1,4000.00,4000.00,'listo','sin cebolla','2025-07-18 20:08:42','2025-07-18 20:13:31'),(68,53,9,2,32000.00,64000.00,'listo',NULL,'2025-07-18 20:16:40','2025-07-18 20:19:18'),(69,53,5,1,35000.00,35000.00,'listo',NULL,'2025-07-18 20:16:41','2025-07-18 20:19:18'),(70,54,20,1,4000.00,4000.00,'pendiente',NULL,'2025-07-18 20:27:31','2025-07-18 20:27:31'),(71,54,24,1,12000.00,12000.00,'preparacion',NULL,'2025-07-18 20:27:33','2025-07-18 20:27:45'),(72,54,14,1,6000.00,6000.00,'preparacion',NULL,'2025-07-18 20:27:36','2025-07-18 20:27:45'),(73,54,13,1,8000.00,8000.00,'pendiente',NULL,'2025-07-18 20:27:37','2025-07-18 20:27:37'),(74,55,20,1,4000.00,4000.00,'listo',NULL,'2025-07-18 20:33:16','2025-07-18 20:35:29'),(75,55,24,1,12000.00,12000.00,'listo',NULL,'2025-07-18 20:33:21','2025-07-18 20:35:29'),(76,55,6,1,28000.00,28000.00,'listo',NULL,'2025-07-18 20:33:26','2025-07-18 20:35:29'),(77,55,7,2,22000.00,44000.00,'listo',NULL,'2025-07-18 20:33:31','2025-07-18 20:35:30'),(78,56,16,1,3000.00,3000.00,'listo',NULL,'2025-07-18 20:37:50','2025-07-18 20:39:00'),(79,56,9,1,32000.00,32000.00,'listo',NULL,'2025-07-18 20:38:44','2025-07-18 20:39:00'),(80,57,20,1,4000.00,4000.00,'listo',NULL,'2025-07-18 21:25:51','2025-07-18 21:32:12'),(81,57,9,1,32000.00,32000.00,'listo',NULL,'2025-07-18 21:26:33','2025-07-18 21:32:12'),(82,57,6,1,28000.00,28000.00,'listo',NULL,'2025-07-18 21:26:58','2025-07-18 21:32:12'),(83,57,23,1,4500.00,4500.00,'listo',NULL,'2025-07-18 21:27:51','2025-07-18 21:32:12'),(84,57,12,1,12000.00,12000.00,'listo',NULL,'2025-07-18 21:29:04','2025-07-18 21:32:12'),(85,58,20,1,4000.00,4000.00,'listo',NULL,'2025-07-18 21:37:19','2025-07-18 21:39:44'),(86,58,24,1,12000.00,12000.00,'listo',NULL,'2025-07-18 21:39:21','2025-07-18 21:39:44'),(87,59,16,2,3000.00,6000.00,'listo',NULL,'2025-07-18 21:39:58','2025-07-18 21:40:57'),(88,59,14,2,6000.00,12000.00,'listo',NULL,'2025-07-18 21:40:02','2025-07-18 21:40:57'),(89,60,20,1,4000.00,4000.00,'listo',NULL,'2025-07-18 21:55:19','2025-07-18 21:59:11'),(90,61,16,2,3000.00,6000.00,'listo',NULL,'2025-07-18 21:55:53','2025-07-18 21:59:13'),(91,60,16,1,3000.00,3000.00,'listo',NULL,'2025-07-18 21:56:29','2025-07-18 21:59:11'),(92,62,17,1,8000.00,8000.00,'listo',NULL,'2025-07-18 21:57:11','2025-07-18 21:59:22'),(93,63,12,1,12000.00,12000.00,'listo',NULL,'2025-07-18 21:58:20','2025-07-18 21:59:15'),(94,64,20,1,4000.00,4000.00,'listo',NULL,'2025-07-18 22:00:31','2025-07-18 22:11:09'),(95,65,16,1,3000.00,3000.00,'listo',NULL,'2025-07-18 22:00:58','2025-07-18 22:11:11'),(96,66,16,2,3000.00,6000.00,'listo',NULL,'2025-07-18 22:12:39','2025-07-18 22:27:46'),(97,67,20,1,4000.00,4000.00,'listo',NULL,'2025-07-18 22:13:31','2025-07-18 22:26:22'),(98,66,15,1,4000.00,4000.00,'listo',NULL,'2025-07-18 22:27:19','2025-07-18 22:27:46'),(99,66,14,1,6000.00,6000.00,'listo',NULL,'2025-07-18 22:27:21','2025-07-18 22:27:46'),(100,68,20,1,4000.00,4000.00,'listo',NULL,'2025-07-18 22:41:04','2025-07-18 22:41:21'),(101,69,20,1,4000.00,4000.00,'listo',NULL,'2025-07-18 22:42:40','2025-07-18 22:42:50'),(102,70,16,1,3000.00,3000.00,'listo',NULL,'2025-07-18 22:51:20','2025-07-18 23:01:54'),(103,71,20,1,4000.00,4000.00,'listo',NULL,'2025-07-18 23:02:42','2025-07-18 23:03:46'),(104,71,16,1,3000.00,3000.00,'listo',NULL,'2025-07-18 23:03:24','2025-07-18 23:03:47'),(106,72,24,1,12000.00,12000.00,'listo',NULL,'2025-07-22 23:47:17','2025-07-22 23:51:51'),(107,72,20,1,4000.00,4000.00,'listo',NULL,'2025-07-22 23:47:20','2025-07-22 23:51:51'),(108,72,9,1,32000.00,32000.00,'listo','sin frijoles','2025-07-22 23:48:17','2025-07-22 23:51:51'),(109,72,16,2,3000.00,6000.00,'listo',NULL,'2025-07-22 23:51:00','2025-07-22 23:51:51'),(115,77,20,4,4000.00,16000.00,'listo',NULL,'2025-07-23 03:20:16','2025-07-23 03:30:38'),(116,77,21,1,6000.00,6000.00,'listo',NULL,'2025-07-23 03:20:18','2025-07-23 03:30:38'),(117,78,16,2,3000.00,6000.00,'listo',NULL,'2025-07-23 03:22:11','2025-07-23 03:40:19'),(118,78,15,1,4000.00,4000.00,'listo',NULL,'2025-07-23 03:22:12','2025-07-23 03:40:19'),(119,77,9,1,32000.00,32000.00,'listo',NULL,'2025-07-23 03:25:25','2025-07-23 03:30:38'),(120,77,6,1,28000.00,28000.00,'listo',NULL,'2025-07-23 03:30:29','2025-07-23 03:30:38'),(121,78,1,1,8500.00,8500.00,'listo',NULL,'2025-07-23 03:33:30','2025-07-23 03:40:20'),(122,78,2,1,12000.00,12000.00,'listo',NULL,'2025-07-23 03:36:38','2025-07-23 03:40:20'),(123,78,13,1,8000.00,8000.00,'listo',NULL,'2025-07-23 03:39:36','2025-07-23 03:40:20');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_order_totals_after_insert` AFTER INSERT ON `order_items` FOR EACH ROW BEGIN
    UPDATE orders 
    SET 
        subtotal = (
            SELECT COALESCE(SUM(subtotal), 0) 
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        tax_amount = (
            SELECT COALESCE(SUM(subtotal), 0) * 0.19
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        total = (
            SELECT COALESCE(SUM(subtotal), 0) * 1.19
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.order_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_order_totals_after_update` AFTER UPDATE ON `order_items` FOR EACH ROW BEGIN
    UPDATE orders 
    SET 
        subtotal = (
            SELECT COALESCE(SUM(subtotal), 0) 
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        tax_amount = (
            SELECT COALESCE(SUM(subtotal), 0) * 0.19
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        total = (
            SELECT COALESCE(SUM(subtotal), 0) * 1.19
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.order_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_order_totals_after_delete` AFTER DELETE ON `order_items` FOR EACH ROW BEGIN
    UPDATE orders 
    SET 
        subtotal = (
            SELECT COALESCE(SUM(subtotal), 0) 
            FROM order_items 
            WHERE order_id = OLD.order_id
        ),
        tax_amount = (
            SELECT COALESCE(SUM(subtotal), 0) * 0.19
            FROM order_items 
            WHERE order_id = OLD.order_id
        ),
        total = (
            SELECT COALESCE(SUM(subtotal), 0) * 1.19
            FROM order_items 
            WHERE order_id = OLD.order_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.order_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `table_id` int DEFAULT NULL,
  `waiter_id` int DEFAULT NULL,
  `status` enum('activo','cerrado','cancelado') COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `closed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_orders_table_id` (`table_id`),
  KEY `idx_orders_waiter_id` (`waiter_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `idx_orders_table_status` (`table_id`,`status`),
  KEY `idx_orders_waiter_created` (`waiter_id`,`created_at`),
  KEY `idx_orders_created_status` (`created_at`,`status`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`waiter_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 02:24:13','2025-07-18 02:25:58',NULL),(2,2,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 02:26:26','2025-07-18 02:35:29',NULL),(3,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 02:45:43','2025-07-18 02:51:44',NULL),(4,1,2,'cerrado',84500.00,16055.00,84500.00,'Pedido creado por mesero','2025-07-18 04:37:24','2025-07-18 04:44:26','2025-07-18 09:44:26'),(5,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:21:40','2025-07-18 13:21:43',NULL),(6,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:22:08','2025-07-18 13:22:15',NULL),(7,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:30:16','2025-07-18 13:30:51',NULL),(8,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:31:37','2025-07-18 13:31:47',NULL),(9,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:36:42','2025-07-18 13:36:48',NULL),(10,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:37:10','2025-07-18 13:37:16',NULL),(11,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:39:15','2025-07-18 13:39:20',NULL),(12,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:40:52','2025-07-18 13:41:08',NULL),(13,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:41:41','2025-07-18 13:41:46',NULL),(14,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:42:12','2025-07-18 13:42:33',NULL),(15,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:42:54','2025-07-18 13:43:00',NULL),(16,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:46:55','2025-07-18 13:46:59',NULL),(17,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:47:39','2025-07-18 13:48:27',NULL),(18,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 13:48:45','2025-07-18 13:48:51',NULL),(19,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 14:21:12','2025-07-18 14:21:14',NULL),(20,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 14:21:48','2025-07-18 14:21:56',NULL),(21,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 14:22:27','2025-07-18 14:24:56',NULL),(22,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 14:25:41','2025-07-18 14:31:36',NULL),(23,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 15:01:01','2025-07-18 15:02:03',NULL),(24,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 15:02:16','2025-07-18 15:02:19',NULL),(25,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 15:26:34','2025-07-18 15:40:30',NULL),(26,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 16:06:58','2025-07-18 16:07:05',NULL),(27,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 16:08:46','2025-07-18 16:08:48',NULL),(28,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 16:14:09','2025-07-18 16:15:06',NULL),(29,1,1,'cerrado',0.00,0.00,0.00,'Pedido creado desde panel de administración','2025-07-18 16:16:15','2025-07-18 16:16:21',NULL),(30,1,1,'cerrado',0.00,0.00,0.00,'Pedido creado desde panel de administración','2025-07-18 16:16:53','2025-07-18 16:17:56',NULL),(31,1,1,'cerrado',0.00,0.00,0.00,'Pedido creado desde panel de administración','2025-07-18 16:42:53','2025-07-18 16:43:03',NULL),(32,1,1,'cerrado',0.00,0.00,0.00,'Pedido creado desde panel de administración','2025-07-18 16:43:22','2025-07-18 16:44:12',NULL),(33,1,1,'cerrado',0.00,0.00,0.00,'Pedido creado desde panel de administración','2025-07-18 18:56:16','2025-07-18 18:56:22',NULL),(34,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 18:56:45','2025-07-18 18:57:54',NULL),(35,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 18:58:56','2025-07-18 18:59:06',NULL),(36,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:00:14','2025-07-18 19:00:25',NULL),(37,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:01:00','2025-07-18 19:03:14',NULL),(38,1,1,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:07:02','2025-07-18 19:07:56',NULL),(39,1,1,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:08:00','2025-07-18 19:08:12',NULL),(40,1,1,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:08:21','2025-07-18 19:08:46',NULL),(41,1,1,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:22:40','2025-07-18 19:22:43',NULL),(42,1,1,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:23:27','2025-07-18 19:29:29',NULL),(43,1,1,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:29:52','2025-07-18 19:33:15',NULL),(44,1,1,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:33:23','2025-07-18 19:33:31',NULL),(45,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:44:07','2025-07-18 19:55:16',NULL),(46,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:57:23','2025-07-18 19:57:42',NULL),(47,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:57:52','2025-07-18 19:58:11',NULL),(48,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:58:33','2025-07-18 19:58:53',NULL),(49,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 19:59:32','2025-07-18 20:05:56',NULL),(50,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 20:06:09','2025-07-18 20:06:31',NULL),(51,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-18 20:07:23','2025-07-18 20:07:31',NULL),(52,1,2,'cerrado',4000.00,760.00,4760.00,'Pedido creado por mesero','2025-07-18 20:08:42','2025-07-18 20:26:40','2025-07-19 01:26:40'),(53,2,2,'cerrado',99000.00,18810.00,117810.00,'Pedido creado por mesero','2025-07-18 20:16:40','2025-07-18 20:26:36','2025-07-19 01:26:36'),(54,1,3,'cerrado',30000.00,5700.00,35700.00,'Pedido creado por mesero','2025-07-18 20:27:31','2025-07-18 20:33:01','2025-07-19 01:33:01'),(55,1,2,'cerrado',88000.00,16720.00,104720.00,'Pedido creado por mesero','2025-07-18 20:33:16','2025-07-18 21:21:08','2025-07-19 02:21:08'),(56,2,2,'cerrado',35000.00,6650.00,41650.00,'Pedido creado por mesero','2025-07-18 20:37:50','2025-07-18 21:21:04','2025-07-19 02:21:04'),(57,1,2,'cerrado',80500.00,15295.00,95795.00,'Pedido creado por mesero','2025-07-18 21:25:51','2025-07-18 21:32:24','2025-07-19 02:32:24'),(58,1,4,'cerrado',16000.00,3040.00,19040.00,'Pedido creado por mesero','2025-07-18 21:37:19','2025-07-18 21:54:30','2025-07-19 02:54:30'),(59,2,4,'cerrado',18000.00,3420.00,21420.00,'Pedido creado por mesero','2025-07-18 21:39:58','2025-07-18 21:54:26','2025-07-19 02:54:26'),(60,1,3,'cerrado',7000.00,1330.00,8330.00,'Pedido creado por mesero','2025-07-18 21:55:19','2025-07-18 21:59:48','2025-07-19 02:59:48'),(61,2,3,'cerrado',6000.00,1140.00,7140.00,'Pedido creado por mesero','2025-07-18 21:55:53','2025-07-18 21:59:44','2025-07-19 02:59:44'),(62,4,3,'cerrado',8000.00,1520.00,9520.00,'Pedido creado por mesero','2025-07-18 21:57:11','2025-07-18 21:59:41','2025-07-19 02:59:41'),(63,3,3,'cerrado',12000.00,2280.00,14280.00,'Pedido creado por mesero','2025-07-18 21:58:19','2025-07-18 21:59:36','2025-07-19 02:59:36'),(64,1,3,'cerrado',4000.00,760.00,4760.00,'Pedido creado por mesero','2025-07-18 22:00:31','2025-07-18 22:11:56','2025-07-19 03:11:55'),(65,2,3,'cerrado',3000.00,570.00,3570.00,'Pedido creado por mesero','2025-07-18 22:00:58','2025-07-18 22:11:51','2025-07-19 03:11:51'),(66,1,4,'cerrado',16000.00,3040.00,19040.00,'Pedido creado por mesero','2025-07-18 22:12:39','2025-07-18 22:36:04','2025-07-19 03:36:04'),(67,2,4,'cerrado',4000.00,760.00,4760.00,'Pedido creado por mesero','2025-07-18 22:13:31','2025-07-18 22:36:00','2025-07-19 03:36:00'),(68,1,2,'cerrado',4000.00,760.00,4760.00,'Pedido creado por mesero','2025-07-18 22:41:04','2025-07-18 23:01:39','2025-07-19 04:01:39'),(69,2,2,'cerrado',4000.00,760.00,4760.00,'Pedido creado por mesero','2025-07-18 22:42:40','2025-07-18 23:01:34','2025-07-19 04:01:34'),(70,3,2,'cerrado',3000.00,570.00,3570.00,'Pedido creado por mesero','2025-07-18 22:51:19','2025-07-18 23:01:54','2025-07-19 04:01:31'),(71,1,2,'cerrado',7000.00,1330.00,8330.00,'Pedido creado por mesero','2025-07-18 23:02:42','2025-07-18 23:04:13','2025-07-19 04:04:13'),(72,1,2,'cerrado',54000.00,10260.00,64260.00,'Pedido creado por mesero','2025-07-22 23:47:15','2025-07-22 23:52:09','2025-07-23 04:52:08'),(73,1,3,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-22 23:55:25','2025-07-22 23:55:39',NULL),(74,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-23 00:29:44','2025-07-23 00:50:52',NULL),(75,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-23 03:08:54','2025-07-23 03:10:49',NULL),(76,1,2,'cerrado',0.00,0.00,0.00,'Pedido creado por mesero','2025-07-23 03:14:22','2025-07-23 03:15:44',NULL),(77,1,2,'cerrado',82000.00,15580.00,97580.00,'Pedido creado por mesero','2025-07-23 03:20:16','2025-07-23 03:45:43','2025-07-23 08:45:43'),(78,2,2,'cerrado',38500.00,7315.00,45815.00,'Pedido creado por mesero','2025-07-23 03:22:10','2025-07-23 03:45:40','2025-07-23 08:45:40');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `cashier_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('efectivo','tarjeta','nequi','transferencia') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pendiente','completado','fallido','reembolsado') COLLATE utf8mb4_unicode_ci DEFAULT 'completado',
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cashier_id` (`cashier_id`),
  KEY `idx_payments_order_id` (`order_id`),
  KEY `idx_payments_method` (`method`),
  KEY `idx_payments_status` (`status`),
  KEY `idx_payments_created_at` (`created_at`),
  KEY `idx_payments_created_method` (`created_at`,`method`),
  KEY `idx_payments_created_status` (`created_at`,`status`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,4,3,84500.00,'tarjeta','completado','TXN-1752813866324-U6RSXW4U2','2025-07-18 04:44:26'),(2,53,3,117810.00,'nequi','completado','TXN-1752870396641-GO8GC2Z8Z','2025-07-18 20:26:36'),(3,52,3,4760.00,'nequi','completado','TXN-1752870400555-3I3OAE5CW','2025-07-18 20:26:40'),(4,54,2,35700.00,'nequi','completado','TXN-1752870781681-MGFDOU5DP','2025-07-18 20:33:01'),(5,56,4,41650.00,'tarjeta','completado','TXN-1752873664255-KIHA7LUQ6','2025-07-18 21:21:04'),(6,55,4,104720.00,'tarjeta','completado','TXN-1752873668315-5S1CDDRLL','2025-07-18 21:21:08'),(7,57,3,95795.00,'tarjeta','completado','TXN-1752874344277-V23JX81NV','2025-07-18 21:32:24'),(8,59,3,21420.00,'tarjeta','completado','TXN-1752875666502-NCGNIMRLF','2025-07-18 21:54:26'),(9,58,3,19040.00,'tarjeta','completado','TXN-1752875670381-XZ89JDRFZ','2025-07-18 21:54:30'),(10,63,3,14280.00,'tarjeta','completado','TXN-1752875976644-J7662UJP1','2025-07-18 21:59:36'),(11,62,3,9520.00,'tarjeta','completado','TXN-1752875981487-BKFVRA3D8','2025-07-18 21:59:41'),(12,61,3,7140.00,'tarjeta','completado','TXN-1752875984981-UO5BYR32E','2025-07-18 21:59:44'),(13,60,3,8330.00,'tarjeta','completado','TXN-1752875988133-786KGN7X5','2025-07-18 21:59:48'),(14,65,4,3570.00,'tarjeta','completado','TXN-1752876711689-9IFQA754F','2025-07-18 22:11:51'),(15,64,4,4760.00,'tarjeta','completado','TXN-1752876715999-YHA44BUWH','2025-07-18 22:11:55'),(16,67,3,4760.00,'tarjeta','completado','TXN-1752878160647-H6MDTEOZS','2025-07-18 22:36:00'),(17,66,3,19040.00,'tarjeta','completado','TXN-1752878164041-6G6JPPGBX','2025-07-18 22:36:04'),(18,70,3,3000.00,'nequi','completado','TXN-1752879691185-KW1Z93KZD','2025-07-18 23:01:31'),(19,69,3,4760.00,'tarjeta','completado','TXN-1752879694747-AWE15PHMS','2025-07-18 23:01:34'),(20,68,3,4760.00,'tarjeta','completado','TXN-1752879699528-E3R6Y4ZK8','2025-07-18 23:01:39'),(21,71,3,8330.00,'tarjeta','completado','TXN-1752879853028-CE51FA5AS','2025-07-18 23:04:13'),(22,72,3,64260.00,'nequi','completado','TXN-1753228328998-Y4NM22WU8','2025-07-22 23:52:08'),(23,78,3,45815.00,'nequi','completado','TXN-1753242340069-I0WE69ENM','2025-07-23 03:45:40'),(24,77,3,97580.00,'nequi','completado','TXN-1753242343845-Z23DCI59K','2025-07-23 03:45:43');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_settings_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'restaurant_name','Sirius Cocina Ancestral','Nombre del restaurante','2025-07-18 01:34:01'),(2,'tax_rate','0.19','Tasa de impuesto (19%)','2025-07-18 01:34:01'),(3,'currency','COP','Moneda del restaurante','2025-07-18 01:34:01'),(4,'timezone','America/Bogota','Zona horaria','2025-07-18 01:34:01'),(5,'max_tables','20','Número máximo de mesas','2025-07-18 01:34:01'),(6,'default_preparation_time','15','Tiempo de preparación por defecto (minutos)','2025-07-18 01:34:01'),(7,'service_charge','0.10','Propina de servicio (10%)','2025-07-18 01:34:01'),(8,'restaurant_phone','+57 123 456 7890','Teléfono del restaurante','2025-07-18 01:34:01'),(9,'restaurant_address','Calle Principal #123, Mocoa, Putumayo','Dirección del restaurante','2025-07-18 01:34:01');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tables`
--

DROP TABLE IF EXISTS `tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `number` int NOT NULL,
  `capacity` int DEFAULT '4',
  `status` enum('libre','ocupada','reservada','mantenimiento') COLLATE utf8mb4_unicode_ci DEFAULT 'libre',
  `current_waiter_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `number` (`number`),
  KEY `idx_tables_status` (`status`),
  KEY `idx_tables_waiter` (`current_waiter_id`),
  KEY `idx_tables_number` (`number`),
  CONSTRAINT `tables_ibfk_1` FOREIGN KEY (`current_waiter_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tables`
--

LOCK TABLES `tables` WRITE;
/*!40000 ALTER TABLE `tables` DISABLE KEYS */;
INSERT INTO `tables` VALUES (1,1,4,'libre',NULL,'2025-07-18 01:34:01'),(2,2,4,'libre',NULL,'2025-07-18 01:34:01'),(3,3,2,'libre',NULL,'2025-07-18 01:34:01'),(4,4,6,'libre',NULL,'2025-07-18 01:34:01'),(5,5,4,'libre',NULL,'2025-07-18 01:34:01'),(6,6,4,'libre',NULL,'2025-07-18 01:34:01'),(7,7,2,'libre',NULL,'2025-07-18 01:34:01'),(8,8,8,'libre',NULL,'2025-07-18 01:34:01'),(9,9,4,'libre',NULL,'2025-07-18 01:34:01'),(10,10,4,'libre',NULL,'2025-07-18 01:34:01'),(11,11,2,'libre',NULL,'2025-07-18 01:34:01'),(12,12,6,'libre',NULL,'2025-07-18 01:34:01'),(17,13,4,'libre',NULL,'2025-08-09 19:29:36');
/*!40000 ALTER TABLE `tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('administrador','mesero','cajero','cocinero') COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  `reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token_expiry` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_active` (`active`),
  KEY `idx_users_reset_token` (`reset_token`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Administrador Sistema','admin@sirius.com','$2b$10$IyPnrKFQLMuZmbbJXeq/aucxJhUoek2BZPuglBHcLyzWOKqYorm4S','administrador',1,'2025-07-18 01:34:01','2025-08-09 19:27:27','2025-08-09 19:27:27',NULL,NULL),(2,'María García','maria@sirius.com','$2b$10$wBs.sU9IEkvIcOrFCxBQ1eG/gVjOUczk37liXIyBuRjMikqIB/kH.','mesero',1,'2025-07-18 01:34:01','2025-08-09 16:47:44','2025-08-09 16:47:44',NULL,NULL),(3,'Carlos Rodríguez','carlos@sirius.com','$2b$10$S9FmPlRTdksrKI8jxq4uc.bvEQFAWxI8I5tIJSBUPUyp.HrOdfdwi','cajero',1,'2025-07-18 01:34:01','2025-07-23 03:45:32','2025-07-23 03:45:32',NULL,NULL),(4,'Ana Martínez','ana@sirius.com','$2b$10$HFvl2F6GtqpLWhdmHDtO8upswA4AI9i.kFelWKmPoybGDhgZaOLoy','cocinero',1,'2025-07-18 01:34:01','2025-07-23 03:39:07','2025-07-23 03:39:07',NULL,NULL),(5,'Luis Pérez','luis@sirius.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','mesero',1,'2025-07-18 01:34:01','2025-07-18 01:34:01',NULL,NULL,NULL),(6,'jhon esteban','jossajhon123454@gmail.com','$2a$10$xlaIWDak2iOmclkx/KqEnejR0cuEfIEloL89dQl2Fnrb9S.oCGxZm','administrador',1,'2025-07-18 01:39:27','2025-07-18 02:10:11','2025-07-18 02:10:11',NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `active_orders_view`
--

/*!50001 DROP VIEW IF EXISTS `active_orders_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `active_orders_view` AS select `o`.`id` AS `order_id`,`o`.`created_at` AS `order_time`,`t`.`number` AS `table_number`,`t`.`capacity` AS `table_capacity`,`u`.`name` AS `waiter_name`,`o`.`status` AS `order_status`,`o`.`subtotal` AS `subtotal`,`o`.`tax_amount` AS `tax_amount`,`o`.`total` AS `total`,`o`.`notes` AS `order_notes`,count(`oi`.`id`) AS `total_items`,sum((case when (`oi`.`status` = 'pendiente') then `oi`.`quantity` else 0 end)) AS `pending_items`,sum((case when (`oi`.`status` = 'preparacion') then `oi`.`quantity` else 0 end)) AS `cooking_items`,sum((case when (`oi`.`status` = 'listo') then `oi`.`quantity` else 0 end)) AS `ready_items` from (((`orders` `o` join `tables` `t` on((`o`.`table_id` = `t`.`id`))) left join `users` `u` on((`o`.`waiter_id` = `u`.`id`))) left join `order_items` `oi` on((`o`.`id` = `oi`.`order_id`))) where (`o`.`status` = 'activo') group by `o`.`id`,`o`.`created_at`,`t`.`number`,`t`.`capacity`,`u`.`name`,`o`.`status`,`o`.`subtotal`,`o`.`tax_amount`,`o`.`total`,`o`.`notes` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `daily_sales_view`
--

/*!50001 DROP VIEW IF EXISTS `daily_sales_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `daily_sales_view` AS select cast(`p`.`created_at` as date) AS `sale_date`,count(distinct `p`.`order_id`) AS `total_orders`,sum(`p`.`amount`) AS `total_sales`,avg(`p`.`amount`) AS `average_ticket`,sum((case when (`p`.`method` = 'efectivo') then `p`.`amount` else 0 end)) AS `cash_sales`,sum((case when (`p`.`method` = 'tarjeta') then `p`.`amount` else 0 end)) AS `card_sales`,sum((case when (`p`.`method` = 'nequi') then `p`.`amount` else 0 end)) AS `nequi_sales`,sum((case when (`p`.`method` = 'transferencia') then `p`.`amount` else 0 end)) AS `transfer_sales` from `payments` `p` where (`p`.`status` = 'completado') group by cast(`p`.`created_at` as date) order by `sale_date` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `kitchen_items_view`
--

/*!50001 DROP VIEW IF EXISTS `kitchen_items_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `kitchen_items_view` AS select `oi`.`id` AS `item_id`,`oi`.`order_id` AS `order_id`,`o`.`created_at` AS `order_time`,`t`.`number` AS `table_number`,`mi`.`name` AS `item_name`,`mi`.`description` AS `item_description`,`oi`.`quantity` AS `quantity`,`oi`.`status` AS `item_status`,`oi`.`notes` AS `item_notes`,`mi`.`preparation_time` AS `preparation_time`,`u`.`name` AS `waiter_name`,timestampdiff(MINUTE,`oi`.`created_at`,now()) AS `minutes_since_ordered` from ((((`order_items` `oi` join `orders` `o` on((`oi`.`order_id` = `o`.`id`))) join `tables` `t` on((`o`.`table_id` = `t`.`id`))) join `menu_items` `mi` on((`oi`.`menu_item_id` = `mi`.`id`))) left join `users` `u` on((`o`.`waiter_id` = `u`.`id`))) where ((`o`.`status` = 'activo') and (`oi`.`status` in ('pendiente','preparacion','listo'))) order by `oi`.`created_at` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-09 14:49:52
