-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 23, 2025 at 07:30 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hafalan_santri`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id_admin` int(11) NOT NULL,
  `nama_admin` varchar(100) NOT NULL,
  `nip` varchar(20) NOT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') NOT NULL,
  `jabatan` varchar(100) NOT NULL DEFAULT 'Staff',
  `password` varchar(255) NOT NULL,
  `telepon` varchar(15) NOT NULL,
  `email` varchar(100) NOT NULL,
  `alamat` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id_admin`, `nama_admin`, `nip`, `jenis_kelamin`, `jabatan`, `password`, `telepon`, `email`, `alamat`, `created_at`) VALUES
(1, 'Pratama', '001', 'Laki-laki', 'Admin Utama', '$2b$10$6ADBVExKUTmYKbqDTzDDgugNIJglUD/4b3.egzbDtL/9.RcYQvF1e', '081234567880', 'admin@gmail.com', 'Jl. Barokah No.19', '2025-02-11 05:53:03');

-- --------------------------------------------------------

--
-- Table structure for table `hafalan`
--

CREATE TABLE `hafalan` (
  `id_hafalan` int(11) NOT NULL,
  `id_ks` int(11) NOT NULL,
  `tanggal_setoran` date NOT NULL,
  `surah` varchar(100) NOT NULL,
  `ayat_awal` int(11) NOT NULL,
  `ayat_akhir` int(11) NOT NULL,
  `catatan` text DEFAULT NULL,
  `nilai` int(11) DEFAULT NULL CHECK (`nilai` >= 0 and `nilai` <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hafalan`
--

INSERT INTO `hafalan` (`id_hafalan`, `id_ks`, `tanggal_setoran`, `surah`, `ayat_awal`, `ayat_akhir`, `catatan`, `nilai`) VALUES
(1, 3, '2025-02-25', 'Ali \'Imran', 1, 15, 'Perlu memperhatikan tajwid', 90),
(2, 1, '2025-01-30', 'Al-Ikhlas', 1, 3, 'lancar', 90),
(3, 2, '2025-01-19', 'Al-Fatihah', 1, 5, 'Perlu di perhatikan tajwidnya', 80),
(4, 4, '2025-02-14', 'Al-Baqarah', 1, 10, 'Perlu di perhatikan lagi tajwidnya', 90),
(5, 12, '2025-02-17', 'Al-Fatihah', 1, 7, 'Lancar', 90),
(6, 13, '2025-02-18', 'Al-Isra\'', 1, 30, 'Lancar', 90),
(7, 14, '2025-02-19', 'Al-Kafirun', 1, 8, 'Lancar', 90),
(8, 13, '2025-02-24', 'Fussilat', 1, 20, 'Lancar', 90),
(9, 14, '2025-02-26', 'At-Taubah', 1, 10, 'Lancar', 90),
(10, 13, '2025-02-25', 'Ali \'Imran', 1, 16, 'Lancar', 90),
(11, 12, '2025-02-26', 'Maryam', 1, 3, 'Lancar', 100),
(16, 14, '2025-02-20', 'Gafir', 1, 5, 'Baik', 10),
(17, 14, '2025-02-25', 'Yunus', 1, 5, 'Baik', 10),
(19, 14, '2025-02-26', 'Luqman', 1, 10, 'Lancar', 90),
(20, 12, '2025-03-02', 'Ali \'Imran', 1, 2, 'Lancar', 90),
(21, 15, '2025-03-02', 'Al-Ma\'idah', 1, 10, 'Lancar', 90),
(22, 13, '2025-03-03', 'Hud', 1, 5, 'Lancar', 90),
(23, 15, '2025-02-20', 'Yunus', 1, 10, 'Lancar', 40),
(24, 12, '2025-03-06', 'Al-Jinn', 1, 10, 'Lancar', 10);

-- --------------------------------------------------------

--
-- Table structure for table `kelas`
--

CREATE TABLE `kelas` (
  `id_kelas` int(11) NOT NULL,
  `nama_kelas` varchar(50) NOT NULL,
  `id_ustadz` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kelas`
--

INSERT INTO `kelas` (`id_kelas`, `nama_kelas`, `id_ustadz`) VALUES
(1, 'Kelas 7A', 1),
(2, 'Kelas 8A', 2),
(3, 'Kelas 9A', 3),
(4, 'Kelas 9B', 4),
(5, 'Kelas 9C', 7),
(6, 'Kelas 10A', 7);

-- --------------------------------------------------------

--
-- Table structure for table `kelas_santri`
--

CREATE TABLE `kelas_santri` (
  `id_ks` int(11) NOT NULL,
  `id_kelas` int(11) NOT NULL,
  `id_santri` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kelas_santri`
--

INSERT INTO `kelas_santri` (`id_ks`, `id_kelas`, `id_santri`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 3),
(4, 2, 4),
(5, 3, 5),
(6, 3, 6),
(7, 4, 7),
(8, 4, 8),
(9, 4, 9),
(10, 4, 10),
(12, 5, 14),
(13, 5, 15),
(14, 6, 16),
(15, 6, 17),
(16, 6, 18),
(17, 6, 19);

-- --------------------------------------------------------

--
-- Table structure for table `santri`
--

CREATE TABLE `santri` (
  `id_santri` int(11) NOT NULL,
  `nama_santri` varchar(100) NOT NULL,
  `nis` varchar(20) NOT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') NOT NULL,
  `password` varchar(255) NOT NULL,
  `wali_santri` varchar(100) DEFAULT NULL,
  `telepon_wali` varchar(15) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `santri`
--

INSERT INTO `santri` (`id_santri`, `nama_santri`, `nis`, `jenis_kelamin`, `password`, `wali_santri`, `telepon_wali`, `alamat`, `created_at`) VALUES
(1, 'Ahmad', '001', 'Laki-laki', '$2b$10$4EAwfGap7/J5A895hM53C.izuvpDxCS.cCymaE0ZUIhmdwfU3/53m', 'Bapak Rahmat', '081234567899', 'Jl. Merdeka No.1', '2025-02-11 05:52:21'),
(2, 'Fauzan', '002', 'Laki-laki', '$2b$10$8miFRcLEiCPgIdiBg0EM.eaTMGHmGnUqrdx7/HOjGoG.zJ2OSOgTm', 'Ibu Siti', '082345678901', 'Jl. Kebangsaan No.23', '2025-02-11 05:52:21'),
(3, 'Zainab', '003', 'Perempuan', '$2b$10$N/6B/iXeVkCJYNH84a806u/67iGb4KxfLmeKrZjmxaSq.rCIA.4uC', 'Bapak Zaki', '083456789012', 'Jl. Sejahtera No.45', '2025-02-11 05:52:21'),
(4, 'Aliyah', '004', 'Perempuan', '$2b$10$BISEswu2V9NOyqRegTWMde4ZBChYZULuLefHVmsM9sKqnQCO18KbC', 'Ibu Fauziyah', '084567890123', 'Jl. Harmoni No.67', '2025-02-11 05:52:21'),
(5, 'Agasta', '005', 'Laki-laki', '$2b$10$r/VUcWmmB.togxS9tlgMU.X21QmTPo8E19WCrfo9Lo4XazE5qV1de', 'Ibu Lies', '084567890098', 'Jl. Indah No.02', '2025-02-11 05:52:21'),
(6, 'Rizky', '006', 'Laki-laki', '$2b$10$09q1GE3pSH4r0daAOldrQ.WVCu4piDBMbmZpgDfatAbq101nP.ETy', 'Bapak Hendra', '085678901234', 'Jl. Damai No.78', '2025-02-11 05:52:21'),
(7, 'Nadia', '007', 'Perempuan', '$2b$10$quSl6/AguQj56iL8.sMhPuP5OwgbB6wAnJpCeZLDUXHIAG5f.tl6S', 'Ibu Fitri', '086789012345', 'Jl. Mawar No.10', '2025-02-11 05:52:21'),
(8, 'Salma', '008', 'Perempuan', '$2b$10$S81rRvJbGJDPr0JSqn53WeZfel6SKXS6A3PAf5aFRuUSU7iM8Z3zS', 'Bapak Abdullah', '087890123456', 'Jl. Melati No.88', '2025-02-11 05:52:21'),
(9, 'Jafar', '009', 'Laki-laki', '$2b$10$Srm9pTA2whMM0X7Ik2sQwuGnX1yYYwbFPZkQGDxgkfr3BIeQuAXmy', 'Ibu Hanifah', '088901234567', 'Jl. Kenanga No.21', '2025-02-11 05:52:21'),
(10, 'Hafidz', '010', 'Laki-laki', '$2b$10$q2sZpU.gmffZ.Mzvxa9I8e9FLQhbDQDcGwCr9hpajwoSyvYdUI0NS', 'Bapak Wahyu', '089012345678', 'Jl. Anggrek No.33', '2025-02-11 05:52:21'),
(14, 'Dava', '011', 'Laki-laki', '$2b$10$AJHhyghn/3rm7JabMDg4xeB3tXECF8uUHRJYPAUNO8fU7Z20lifVe', 'Bapak Udin', '0123456789', 'Banjarnegara', '2025-02-15 15:58:51'),
(15, 'Wizard', '012', 'Laki-laki', '$2b$10$v1m1RXWhIXQJA.S1MC6DgekNKMdmswMkhBrkCrHaVB6Kn1o4JgPwK', 'Wahyu', '0123456789', 'Embuh', '2025-02-18 10:09:29'),
(16, 'Balmond', '013', 'Laki-laki', '$2b$10$nGV6gP4JADpntB8LWu3UJu/AWAo6z7QM9SyQn6mZiEgzz2H098iSK', 'Bapak ilham', '09183256527217', 'Lan of down', '2025-02-18 11:02:36'),
(17, 'Rizal', '014', 'Laki-laki', '$2b$10$ofKHMeZxl/3iBAUlZSjjfO3OcyMhHwp4DLCJC1kAObmS4HniA/RKe', 'Ibu Wahyu', '0123456789', 'Dukuwaluh', '2025-02-28 15:10:16'),
(18, 'Kevin', '015', 'Laki-laki', '$2b$10$wTzvN5UuKAQPxJX5I3zrduoNvYIqW3G7wmy1ZKN6Ak1WxizAM5nzK', 'Bapak Indra', '08123456789', 'Banjarnegara', '2025-03-07 15:34:17'),
(19, 'Rafi', '017', 'Laki-laki', '$2b$10$oQ1xvJKQbe05CtbJ7WMkI.6cIuDicrZdGlyaU6sl7M9haJ1T0JLpO', 'Bapak Udin', '02134567891', 'Banyumas', '2025-03-21 09:53:21');

-- --------------------------------------------------------

--
-- Table structure for table `ustadz`
--

CREATE TABLE `ustadz` (
  `id_ustadz` int(11) NOT NULL,
  `nama_ustadz` varchar(100) NOT NULL,
  `nip` varchar(20) NOT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') NOT NULL,
  `jabatan` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `telepon` varchar(15) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `alamat` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ustadz`
--

INSERT INTO `ustadz` (`id_ustadz`, `nama_ustadz`, `nip`, `jenis_kelamin`, `jabatan`, `password`, `telepon`, `email`, `alamat`, `created_at`) VALUES
(1, 'Hasan', '001', 'Laki-laki', 'Ustadz Asrama Putra', '$2b$10$q50lcdh/kMCV63Vy3kiZKO.W2wKT9T87/yx2HK5HEUvgOGNRYpesG', '081345678901', 'ustadz@gmail.com', 'Jl. Islami No.10', '2025-02-11 05:52:42'),
(2, 'Fatimah', '002', 'Perempuan', 'Ustadz Asrama Putri', '$2b$10$4PoiXriuuDj7DmK23tEZteseBFR8AzpMUT5bz8GrBmBsKnDTSCk1q', '082456789012', 'ustadz@gmail.com', 'Jl. Madani No.12', '2025-02-11 05:52:42'),
(3, 'Ali', '003', 'Laki-laki', 'Ustadz Asrama Putra', '$2b$10$ITG3qIyaZjElC52.d7Dfqul6n9LO5vkAKRp2bbvDckHUtzL5sUqbS', '083567890123', 'ustadz@gmail.com', 'Jl. Hidayah No.15', '2025-02-11 05:52:42'),
(4, 'Aisyah', '004', 'Perempuan', 'Ustadzah Asrama Putri', '$2b$10$5YlFvMDnETKAi5Fnqk6C6uLd76ndf9HrQpMuqZOyWUFx7VPfnXIy2', '084678901234', 'aisyah@gmail.com', 'Jl. Barokah No.18', '2025-02-11 05:52:42'),
(7, 'Bayu', '005', 'Laki-laki', 'Ustadz Asrama Putra', '$2b$10$mPAh9Cq.pxVuKI9JMsPewOIfVxLnVyvV0dEmrhhiyjw3LBrdtUYy.', '09886767123', 'bayu@gmail.com', 'Desa pingit, Kecamatan Rakit', '2025-02-15 06:57:57'),
(10, 'Hanan', '006', 'Laki-laki', 'Ustadz Asrama Putra', '$2b$10$qYMijzzUMTWBC09xhAgKVuqp2m./qQZeeRx0rRxFBu2WigjJwayri', '0123456789', 'hanan@gmai.com', 'Dukuwaluh', '2025-02-28 15:18:37'),
(11, 'Afanin', '007', 'Perempuan', 'Ustadz Asrama Putri', '$2b$10$bCwKzzTHVORy.bQc74d83u9TmGAloqDduD9atcsyDlLWavc3EVMQO', '08123456798', 'afanin@gmail.com', 'Banyumas', '2025-03-07 15:10:03'),
(12, 'Roni', '009', 'Laki-laki', 'Ustadz Asrama Putra', '$2b$10$F3AzLKqV2513N54MgL7uPuHEo1ezZ.GwG9yN8Saybcj6oNYFBX3HG', '02134567891', 'roni@gmail.com', 'Banjarnegara', '2025-03-21 10:07:27');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id_admin`),
  ADD UNIQUE KEY `NIP` (`nip`);

--
-- Indexes for table `hafalan`
--
ALTER TABLE `hafalan`
  ADD PRIMARY KEY (`id_hafalan`),
  ADD KEY `id_ks` (`id_ks`);

--
-- Indexes for table `kelas`
--
ALTER TABLE `kelas`
  ADD PRIMARY KEY (`id_kelas`),
  ADD KEY `id_ustadz` (`id_ustadz`);

--
-- Indexes for table `kelas_santri`
--
ALTER TABLE `kelas_santri`
  ADD PRIMARY KEY (`id_ks`),
  ADD KEY `id_kelas` (`id_kelas`),
  ADD KEY `id_santri` (`id_santri`);

--
-- Indexes for table `santri`
--
ALTER TABLE `santri`
  ADD PRIMARY KEY (`id_santri`),
  ADD UNIQUE KEY `NIS` (`nis`);

--
-- Indexes for table `ustadz`
--
ALTER TABLE `ustadz`
  ADD PRIMARY KEY (`id_ustadz`),
  ADD UNIQUE KEY `NIP` (`nip`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id_admin` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `hafalan`
--
ALTER TABLE `hafalan`
  MODIFY `id_hafalan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `kelas`
--
ALTER TABLE `kelas`
  MODIFY `id_kelas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `kelas_santri`
--
ALTER TABLE `kelas_santri`
  MODIFY `id_ks` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `santri`
--
ALTER TABLE `santri`
  MODIFY `id_santri` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `ustadz`
--
ALTER TABLE `ustadz`
  MODIFY `id_ustadz` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `hafalan`
--
ALTER TABLE `hafalan`
  ADD CONSTRAINT `hafalan_ibfk_1` FOREIGN KEY (`id_ks`) REFERENCES `kelas_santri` (`id_ks`) ON DELETE CASCADE;

--
-- Constraints for table `kelas`
--
ALTER TABLE `kelas`
  ADD CONSTRAINT `kelas_ibfk_1` FOREIGN KEY (`id_ustadz`) REFERENCES `ustadz` (`id_ustadz`) ON DELETE CASCADE;

--
-- Constraints for table `kelas_santri`
--
ALTER TABLE `kelas_santri`
  ADD CONSTRAINT `kelas_santri_ibfk_1` FOREIGN KEY (`id_kelas`) REFERENCES `kelas` (`id_kelas`) ON DELETE CASCADE,
  ADD CONSTRAINT `kelas_santri_ibfk_2` FOREIGN KEY (`id_santri`) REFERENCES `santri` (`id_santri`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
