-- MySQL dump 10.13  Distrib 9.5.0, for macos14.8 (arm64)
--
-- Host: localhost    Database: mobile_app_developer
-- ------------------------------------------------------
-- Server version	9.5.0

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
-- Table structure for table `user_masters`
--

DROP TABLE IF EXISTS `user_masters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_masters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `country_code` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `login_type` enum('manual','twilio','google','facebook','apple') DEFAULT NULL,
  `role` enum('user') DEFAULT NULL,
  `otp` varchar(255) DEFAULT NULL,
  `verified` tinyint(1) DEFAULT '0',
  `is_deleted` enum('0','1') DEFAULT '0',
  `jwt_login_token` varchar(255) DEFAULT NULL,
  `social_unique_login_id` varchar(255) DEFAULT NULL,
  `is_login` enum('0','1') DEFAULT '0',
  `profile_pic` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_masters`
--

LOCK TABLES `user_masters` WRITE;
/*!40000 ALTER TABLE `user_masters` DISABLE KEYS */;
INSERT INTO `user_masters` VALUES (1,'sachin','ds','sachindeep.redsky@gmail.com','+1','1234567890','manual','user',NULL,1,'0','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoxLCJpYXQiOjE3ODIxOTE4NjUsImV4cCI6MTc4MjE5NTQ2NX0.fBG4mxeKhs6l19D7zyVUUJ44WQOf6_KcUpjfuPSICFk',NULL,'0',NULL,'inactive','2026-06-02 07:57:54','2026-06-23 05:18:02'),(3,'madan','gopal','madangopal.redskyatech@gmail.com','+1','1234567891','manual','user',NULL,1,'0',NULL,NULL,'0',NULL,'active','2026-06-08 07:06:52','2026-06-19 08:23:18');
/*!40000 ALTER TABLE `user_masters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_deleted` enum('0','1') DEFAULT '0',
  `profile_picture` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (2,'Sachindeep','sachindeep.redsky@gmail.com','e10adc3949ba59abbe56e057f20f883e','0','/dist/img/8522.jpg','2026-06-02 15:07:42','2026-06-02 10:54:17');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Drop the table if it exists
DROP TABLE IF EXISTS cms;

-- Create the cms table
CREATE TABLE cms (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `cms` WRITE;
INSERT INTO cms (title, description, type, created_at, updated_at)
VALUES
(
    'About Us',
    'Welcome to our platform. We provide an easy and secure way to manage campaigns, brands, bags, coupons, and users. Our goal is to simplify campaign management and coupon distribution while ensuring a smooth experience for administrators and users.',
    'about_us',
    NOW(),
    NOW()
),
(
    'Terms of Use',
    'By using this platform, you agree to use it only for lawful purposes. Users are responsible for maintaining the confidentiality of their accounts. Coupons and campaigns are subject to their respective validity periods. Misuse of the platform may result in account suspension or termination.',
    'terms_of_use',
    NOW(),
    NOW()
),
(
    'Privacy Policy',
    'We respect your privacy and are committed to protecting your personal information. We collect only the information required to provide our services, improve user experience, and manage campaigns. Your information will not be shared with third parties except as required by law or to provide our services.',
    'privacy_policy',
    NOW(),
    NOW()
),
(
    'FAQ',
    'Q: How do I redeem a coupon?\nA: Present the coupon QR code or coupon code before it expires.\n\nQ: Can I use a coupon more than once?\nA: No. A coupon can only be used once unless otherwise specified.\n\nQ: How can I contact support?\nA: Please contact the administrator through the support section of the application.',
    'faq',
    NOW(),
    NOW()
);
UNLOCK TABLES;

-- Table structure for table `campaign_masters`

DROP TABLE IF EXISTS `campaign_masters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaign_masters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaign_id` varchar(255) NOT NULL,
  `campaign_name` varchar(255) NOT NULL,
  `bags` int DEFAULT NULL,
  `coupons` int DEFAULT NULL,
  `status` enum('published','unpublished','draft') NOT NULL DEFAULT 'unpublished',
  `description` text,
  `expiry_date` varchar(255) DEFAULT NULL,
  `starting_date` varchar(255) DEFAULT NULL,
  `qr_code` varchar(255) NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `campaign_id` (`campaign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- Table structure for table `brand_masters`

DROP TABLE IF EXISTS `brand_masters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brand_masters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `brand_name` varchar(255) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `brand_logo` varchar(255) DEFAULT NULL,
  `campaign_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `campaign_id` (`campaign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- Table structure for table `coupons`

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `coupon_code` varchar(255) NOT NULL,
  `user_name` varchar(255) NOT NULL DEFAULT '',
  `title` varchar(255) NOT NULL DEFAULT '',
  `description` text NOT NULL,
  `status` enum('used','unused') NOT NULL DEFAULT 'unused',
  `expiry_date` varchar(255) DEFAULT NULL,
  `starting_date` varchar(255) DEFAULT NULL,
  `is_expired` tinyint(1) DEFAULT '0',
  `assign_status` enum('assigned','unassigned') NOT NULL DEFAULT 'unassigned',
  `coupon_image` text,
  `user_id` int DEFAULT NULL,
  `brand_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `brand_id` (`brand_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- Table structure for table `campaign_brand_histories`

DROP TABLE IF EXISTS `campaign_brand_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaign_brand_histories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `status` enum('active','inactive') DEFAULT 'active',
  `campaign_id` int DEFAULT NULL,
  `brand_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `campaign_id` (`campaign_id`),
  KEY `brand_id` (`brand_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- Table structure for table `bags_masters`

DROP TABLE IF EXISTS `bags_masters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bags_masters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` varchar(255) NOT NULL,
  `bag_name` varchar(255) NOT NULL,
  `expiry_date` varchar(255) NOT NULL,
  `starting_date` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT '0',
  `is_expired` tinyint(1) DEFAULT '0',
  `qr_code` varchar(255) DEFAULT '',
  `campaign_id` int DEFAULT NULL,
  `brand_id` int DEFAULT NULL,
  `coupon_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `campaign_id` (`campaign_id`),
  KEY `brand_id` (`brand_id`),
  KEY `coupon_id` (`coupon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- Table structure for table `coupon_records`

DROP TABLE IF EXISTS `coupon_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_Id` varchar(255) NOT NULL,
  `coupon_id` int NOT NULL,
  `friend_id` int DEFAULT NULL,
  `status` enum('active','used','expired','assigned') DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `coupon_id` (`coupon_id`),
  KEY `friend_id` (`friend_id`),
  UNIQUE KEY `unique_user_coupon_product` (`user_id`,`coupon_id`,`product_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE IF NOT EXISTS `coupon_shares` (
  `id` int NOT NULL AUTO_INCREMENT,
  `coupon_id` int NOT NULL,
  `product_id` varchar(255) NOT NULL,
  `sharer_user_id` int NOT NULL,
  `share_token` varchar(128) NOT NULL,
  `share_url` varchar(512) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `share_token` (`share_token`),
  KEY `coupon_id` (`coupon_id`),
  KEY `sharer_user_id` (`sharer_user_id`),
  KEY `product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dump completed on 2026-07-07 13:35:11
