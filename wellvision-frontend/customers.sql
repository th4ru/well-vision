-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 28, 2025 at 12:25 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `well_vision`
--

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `givenName` varchar(100) NOT NULL,
  `familyName` varchar(100) NOT NULL,
  `ageYears` int(11) DEFAULT NULL,
  `birthDate` date DEFAULT NULL,
  `nicPassport` varchar(50) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `phoneNo` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `givenName`, `familyName`, `ageYears`, `birthDate`, `nicPassport`, `gender`, `nationality`, `phoneNo`, `address`, `email`) VALUES
(1, 'Warnakulasuriya', 'Fernando', 11, NULL, '11wef', 'Male', 'wef', '0775235617', 'sdv', 'sdv@gamil.com'),
(2, 'dfv', 'dfv', 12, '2025-06-28', '11wef', 'Female', 'wef', '0773235617', 'sdfvfv', 'sdv100@gamil.com'),
(3, 'ercd', 'sdc', 12, '2025-06-28', '133edxs', 'Male', 'dcxc', '1234567890', 'sdcdsc', 'sdcdsc@gmail.com'),
(4, 'Warnakulasuriya', 'Fernando', 12, '0000-00-00', '1wef34859f', 'Male', 'wef', '0775235617', 'Kurunduwaththa,\nHoagolla,', 'sdv@gamil.com');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
