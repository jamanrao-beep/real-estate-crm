-- ================================================================
-- RESTORE NEON MANUAL ASSIGNMENTS TO HOSTINGER MYSQL
-- Total Neon Leads: 399
-- Generated At: 2026-09-30T09:41:42.944Z
-- ================================================================

START TRANSACTION;

-- Pre-fetch User IDs into variables for high-speed execution
SET @sapna_id = (SELECT id FROM `User` WHERE email = 'sapna@bkdcrm.com' LIMIT 1);
SET @bharat_id = (SELECT id FROM `User` WHERE email = 'bharat@bkdcrm.com' LIMIT 1);
SET @manashvi_id = (SELECT id FROM `User` WHERE email = 'manashvi@bkdcrm.com' LIMIT 1);
SET @aarti_id = (SELECT id FROM `User` WHERE email = 'aarti@bkdcrm.com' LIMIT 1);
SET @kanishka_id = (SELECT id FROM `User` WHERE email = 'kanishka@bkdcrm.com' LIMIT 1);
SET @admin_id = (SELECT id FROM `User` WHERE email = 'prashant@bkdcrm.com' LIMIT 1);


-- Lead: Ranveer Singh Negi | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7902016892';
-- Lead: Sahastradhara Test Lead | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `name` = 'Sahastradhara Test Lead';
-- Lead: Brijendra | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9557953064';
-- Lead: Ranveer Singh Negi | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7902016892';
-- Lead: sher singh yadav | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%6206845488';
-- Lead: Sudhir Kumar | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%7568400850';
-- Lead: Devendra Singh | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9695374777';
-- Lead: Brijendra | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9557953064';
-- Lead: sher singh yadav | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%6206845488';
-- Lead: Devendra Singh | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9695374777';
-- Lead: Bp Nawani Nawani | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9084060652';
-- Lead: Deepak Kumar | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7668671604';
-- Lead: Jitesh Dudeja | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9758855855';
-- Lead: Bp Nawani Nawani | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9084060652';
-- Lead: Rani Pokhari Test Lead | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `name` = 'Rani Pokhari Test Lead';
-- Lead: Mahesh Singh Rawat | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%7983803905';
-- Lead: Johny Bhatia | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9599991999';
-- Lead: Thano Test Lead | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `name` = 'Thano Test Lead';
-- Lead: Johny Bhatia | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9599991999';
-- Lead: Monu Verma | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9872034500';
-- Lead: Sanjay Kumar | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9569469142';
-- Lead: Arun Singh | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9911399984';
-- Lead: Narendra Yadav | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9079258717';
-- Lead: Aditya Thapliyal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9634493698';
-- Lead: Bittu Kumar | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8192855099';
-- Lead: Nagendra Singh | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9760211277';
-- Lead: Pradeep Saini | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8077391270';
-- Lead: Joshi G | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7983574057';
-- Lead: Trilok Singh Belwal | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9528289625';
-- Lead: Satendra Sajwan | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9412973033';
-- Lead: Naresh Kumar Battan Barsana | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8398899000';
-- Lead: Suraj Bisht | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9797485405';
-- Lead: Arya Vikramaditya | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9997989211';
-- Lead: Skylab Sklb | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9917036649';
-- Lead: Anil Kumar | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9759806906';
-- Lead: Dinesh Bampal | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9365125638';
-- Lead: Anil Panwar | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9891579460';
-- Lead: Pardeep Singh | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8287061924';
-- Lead: Rahul Dutt Katyan | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9045162009';
-- Lead: Rakesh Jangid | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9713505797';
-- Lead: Vipul Sharma | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9837300815';
-- Lead: Rajkumar Rawat | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7579478088';
-- Lead: Kulbeer Singh | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9639622007';
-- Lead: Abhishek Kushwah | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8273846729';
-- Lead: Sudhanshu khanduri | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8077619428';
-- Lead: Tarun Pathak | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9897581928';
-- Lead: Madan Lal | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9897842400';
-- Lead: rajkumar08 | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9358868160';
-- Lead: Manoj Choudhery | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8899101111';
-- Lead: Rakesh Arora | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9897653780';
-- Lead: Ashish Nautiyal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9719113428';
-- Lead: Rakesh Singh | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9410592448';
-- Lead: Anil Singh | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9411355006';
-- Lead: Upendra Kumar | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8467845947';
-- Lead: brahm rishi Sharma | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8800170555';
-- Lead: Arun Nautiyal | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9871576814';
-- Lead: Shyam Sunder Sharma | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8171755565';
-- Lead: Ramesh Maurya daily life | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8755440587';
-- Lead: Manoj Negi | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8077844947';
-- Lead: abhi aaj tak | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9084868589';
-- Lead: Chaudhary | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9368805138';
-- Lead: Yatin Nagar | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9990307790';
-- Lead: Anand Shekhar | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9639836352';
-- Lead: Ramchander Poply Ramchander | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9810213416';
-- Lead: Narendra Rahi | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9898368413';
-- Lead: Laxmi Bhandari | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7657980138';
-- Lead: Devendra Pal | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9761143490';
-- Lead: Rinku Maalya Pal | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8954745048';
-- Lead: Mat Pic | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9599343382';
-- Lead: Ajay Dobhal | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9411329777';
-- Lead: Rajesh Kr | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9990793345';
-- Lead: Alok Choudhari | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9131482639';
-- Lead: Tilak Raj | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8630021898';
-- Lead: Ravindra kumar | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9718976593';
-- Lead: Sohan  Khandewal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8979973660';
-- Lead: Anuj Kumar Chandra | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8755400141';
-- Lead: Mukesh Bhardwaj | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9216423111';
-- Lead: Anand Kishore | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8874943499';
-- Lead: Amandeep Rana | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%6397591069';
-- Lead: R Sharma Atomy | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8005962452';
-- Lead: Himanshu Vashisth | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9953711957';
-- Lead: Sanjay Kumar | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9045380610';
-- Lead: Rakesh Kanojia | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9411107275';
-- Lead: Girish Gairola | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9967169180';
-- Lead: Rajneesh Jugran | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8433054110';
-- Lead: Ajay Singh Chauhan | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9897159131';
-- Lead: Parveen chanana | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9417112342';
-- Lead: Piyush Mishra | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9125713311';
-- Lead: Untracked Trails | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9760820826';
-- Lead: Ujjwal Verma | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9997036370';
-- Lead: Rajeev Garg | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9359932795';
-- Lead: Manu Bhatia | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9758298200';
-- Lead: Vikas Panchal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9999029248';
-- Lead: yuvi | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9315861266';
-- Lead: Prince Chadha | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9811883252';
-- Lead: Zeeshan | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7895557565';
-- Lead: Rajesh Paul | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9810742797';
-- Lead: Ravi Procha | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9466190880';
-- Lead: Anshuman Goyal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9719847747';
-- Lead: Anil Kumar namaste | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8090708690';
-- Lead: Prateek Grover | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8178337783';
-- Lead: Amit Singh Chuniyal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7055569189';
-- Lead: Manisa Rawat | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7456853336';
-- Lead: Yash Rajput | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9286279181';
-- Lead: Parkash Kumar | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9736724488';
-- Lead: Mridul Sharma | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9911624408';
-- Lead: Mridul Sharma | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9911624408';
-- Lead: Harshit Negi | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8377084459';
-- Lead: Harshit Negi | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8377084459';
-- Lead: Phool Babu | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%7979899138';
-- Lead: Phool Babu | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7979899138';
-- Lead: Moin | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9206111161';
-- Lead: Moin | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9206111161';
-- Lead: chatar Singh Negi | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7906419415';
-- Lead: chatar Singh Negi | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7906419415';
-- Lead: Pavan Gautam | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9971043558';
-- Lead: Pavan Gautam | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9971043558';
-- Lead: Mayank Law | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8287736252';
-- Lead: Mayank Law | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8287736252';
-- Lead: Dinesh Singh | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9871596016';
-- Lead: Dinesh Singh | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9871596016';
-- Lead: C.S..Sharma | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9873073359';
-- Lead: C.S..Sharma | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9873073359';
-- Lead: Sumit Kumar | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8303606332';
-- Lead: Sumit Kumar | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8303606332';
-- Lead: Anand Kumar | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9871156929';
-- Lead: Anand Kumar | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9871156929';
-- Lead: Rohit Khurana | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9818057558';
-- Lead: Rohit Khurana | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9818057558';
-- Lead: Pradeep Nanda | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9871576500';
-- Lead: Pradeep Nanda | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9871576500';
-- Lead: Ankush Dhiman | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7988823841';
-- Lead: Ankush Dhiman | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7988823841';
-- Lead: Sumit Kohli | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8171259735';
-- Lead: Sumit Kohli | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8171259735';
-- Lead: Ameit Sawhney | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9927517181';
-- Lead: Ameit Sawhney | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9927517181';
-- Lead: dr apurv ray | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8660600747';
-- Lead: dr apurv ray | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8660600747';
-- Lead: sunil chopra | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9358132032';
-- Lead: sunil chopra | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9358132032';
-- Lead: Aavi Bisht | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7838113935';
-- Lead: Aavi Bisht | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%7838113935';
-- Lead: Amit Krishan | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9416026133';
-- Lead: Amit Krishan | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9416026133';
-- Lead: Arav Srivastava | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8218734426';
-- Lead: Arav Srivastava | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8218734426';
-- Lead: Mahinder Bhatia | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9312575966';
-- Lead: Mahinder Bhatia | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9312575966';
-- Lead: Yashpal Singh Chauhan | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9780902216';
-- Lead: Yashpal Singh Chauhan | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9780902216';
-- Lead: Prashant Chauhan | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9582010255';
-- Lead: Prashant Chauhan | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9582010255';
-- Lead: Praveen Joshi | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9639130398';
-- Lead: Praveen Joshi | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9639130398';
-- Lead: Axay Kumar | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9758494517';
-- Lead: Axay Kumar | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9758494517';
-- Lead: Vikas Negi | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9540795358';
-- Lead: Vikas Negi | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9540795358';
-- Lead: Kavinder Kapur | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9814236048';
-- Lead: Kavinder Kapur | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9814236048';
-- Lead: Luiss | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9205941157';
-- Lead: Luiss | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9205941157';
-- Lead: manjeet singh | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9897275676';
-- Lead: manjeet singh | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9897275676';
-- Lead: Prahil | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9897909588';
-- Lead: Prahil | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9897909588';
-- Lead: Sharukh MirZa | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9411566644';
-- Lead: Sharukh MirZa | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9411566644';
-- Lead: Arvind Chauhan | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%6398100714';
-- Lead: Arvind Chauhan | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%6398100714';
-- Lead: Bajrang Bijalwan | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%7830006999';
-- Lead: Bajrang Bijalwan | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7830006999';
-- Lead: Kamlesh Prasad | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9408203978';
-- Lead: Kamlesh Prasad | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9408203978';
-- Lead: Santosh Chaudhari | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8755616433';
-- Lead: Santosh Chaudhari | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8755616433';
-- Lead: Abhishek Matta | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9259955571';
-- Lead: Abhishek Matta | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9259955571';
-- Lead: Narendra Yadav | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9312567272';
-- Lead: Narendra Yadav | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9312567272';
-- Lead: Nitin Saini | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8059057648';
-- Lead: Nitin Saini | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8059057648';
-- Lead: Surya Ramola | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8410571010';
-- Lead: Surya Ramola | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8410571010';
-- Lead: Rashmi | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8979974739';
-- Lead: Rashmi | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8979974739';
-- Lead: Amit Kumar Gupt | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9451738376';
-- Lead: Amit Kumar Gupt | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9451738376';
-- Lead: K  Pandit | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9812062930';
-- Lead: K  Pandit | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9812062930';
-- Lead: Vijay Kumar | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9917893372';
-- Lead: Vijay Kumar | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9917893372';
-- Lead: Kapoor Chand Asihwal | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9911100836';
-- Lead: Kapoor Chand Asihwal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9911100836';
-- Lead: Ram Gusain | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8800482579';
-- Lead: Ram Gusain | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8800482579';
-- Lead: Ganpati Pandit | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9760271721';
-- Lead: Ganpati Pandit | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9760271721';
-- Lead: Rohit | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7579287771';
-- Lead: Rohit | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%7579287771';
-- Lead: Ankit Raghuvanshi | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8077224429';
-- Lead: Ankit Raghuvanshi | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8077224429';
-- Lead: Pradeep Agarwal | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9881139135';
-- Lead: Pradeep Agarwal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9881139135';
-- Lead: Himanshu sharma | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7351666664';
-- Lead: Himanshu sharma | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%7351666664';
-- Lead: Prakhar Shukla | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9958322377';
-- Lead: Prakhar Shukla | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9958322377';
-- Lead: Adv Mahavir Kohli | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9759577335';
-- Lead: Adv Mahavir Kohli | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9759577335';
-- Lead: Arun Sharma | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8076082760';
-- Lead: Arun Sharma | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8076082760';
-- Lead: Ajay Shahi | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9415500498';
-- Lead: Ajay Shahi | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9415500498';
-- Lead: SANDEEP KUMAR | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9634300732';
-- Lead: SANDEEP KUMAR | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9634300732';
-- Lead: Mohinder Pal Singh | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9215528148';
-- Lead: Mohinder Pal Singh | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9215528148';
-- Lead: Satendra Bisht | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%7409892957';
-- Lead: Satendra Bisht | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7409892957';
-- Lead: Rahul Aswal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7889794109';
-- Lead: Rahul Aswal | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7889794109';
-- Lead: Adhikari Kundan | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9004924513';
-- Lead: Adhikari Kundan | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9004924513';
-- Lead: sailesh sanyal | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9870999921';
-- Lead: sailesh sanyal | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9870999921';
-- Lead: Tarun Sharma | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9927039790';
-- Lead: Tarun Sharma | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9927039790';
-- Lead: Lalit kumar | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9808618480';
-- Lead: Lalit kumar | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9808618480';
-- Lead: Suraj Kala | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%7037955157';
-- Lead: Suraj Kala | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7037955157';
-- Lead: Somesh Uniyal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8126042846';
-- Lead: Somesh Uniyal | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8126042846';
-- Lead: Suraj Dua | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9897695552';
-- Lead: Suraj Dua | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9897695552';
-- Lead: Balvender Singh | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9897937106';
-- Lead: Balvender Singh | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9897937106';
-- Lead: Anuj Singh Rawat | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9779580717';
-- Lead: Anuj Singh Rawat | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9779580717';
-- Lead: Ajay Sumiyal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9774226612';
-- Lead: Ajay Sumiyal | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9774226612';
-- Lead: Aakash Sharma | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9958598537';
-- Lead: Aakash Sharma | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%9958598537';
-- Lead: Guru Parsad Kanswal | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7060477400';
-- Lead: Guru Parsad Kanswal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7060477400';
-- Lead: sanjeev | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%6547328408';
-- Lead: sanjeev | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%6547328408';
-- Lead: Francios SN | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8859082582';
-- Lead: Francios SN | Assign to: Bharat Jatwany
UPDATE `Lead` SET `assignedToId` = @bharat_id WHERE `phone` LIKE '%8859082582';
-- Lead: Suresh Tiwari | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8958912116';
-- Lead: Manoj Kumar Gairola | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9639415653';
-- Lead: Ritik | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%6398863569';
-- Lead: Girish Gairola | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9312842775';
-- Lead: Sankalp Pattanayak | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8920628042';
-- Lead: Sheela Mishra | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8595559364';
-- Lead: manish khatri | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9716231923';
-- Lead: mukesh | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8909479466';
-- Lead: Маниш Наагар | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9560393225';
-- Lead: Sam Mukesh Puri | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8750076788';
-- Lead: Anand arya | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9816249612';
-- Lead: Raja Rawat | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9319515199';
-- Lead: Asif Ansari | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9897408921';
-- Lead: Sanjay Badoni | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9412028929';
-- Lead: Pankaj Gupta | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9711462192';
-- Lead: Anup Rawat | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9896117560';
-- Lead: Jiwan Dhanda | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7589049156';
-- Lead: Pankaj Kumar | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9050684024';
-- Lead: Narender Singh Rawat | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9328583060';
-- Lead: Vinod Semwal | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9818923452';
-- Lead: Ch Vikash Can | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8802352777';
-- Lead: Rahul Shukla | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9675780474';
-- Lead: S s Rawat | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8171570499';
-- Lead: Akshat Shukla | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8868997104';
-- Lead: Subhash Chandra | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9999076059';
-- Lead: Rakesh Joshi | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9690726624';
-- Lead: rishipal singh | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9990820912';
-- Lead: Ajit Kumar | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9608573705';
-- Lead: Rajesh Sharma | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9455998097';
-- Lead: Anumita Dutta Choudhury | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9810397137';
-- Lead: sunny  gupta | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9412742145';
-- Lead: swag101 | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8527217008';
-- Lead: Rakhi Bisht | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8979979838';
-- Lead: Prashant Bhasker | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9599322539';
-- Lead: Anand Singh Mehra | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9411540579';
-- Lead: Sanjay Srivastava | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9719453434';
-- Lead: Ďèv Šîñğh | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8859170430';
-- Lead: Sharad Omar Bjp | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9450441624';
-- Lead: Ajay Singh Bhandari | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9719674073';
-- Lead: Suresh Chand | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7505534375';
-- Lead: Shardul Jakhmola | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9945160229';
-- Lead: Aman Singh | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8218455434';
-- Lead: Vinod Gusain | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9634606672';
-- Lead: Rakesh Sharma | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7906367807';
-- Lead: SRIKANT DUDPURI | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9758910650';
-- Lead: Jatin | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9897533580';
-- Lead: Amit Singh Rajput | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8668303484';
-- Lead: Mukesh Bhatt | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9410155246';
-- Lead: Laxman Negi | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7579115501';
-- Lead: Santosh Nautiyal | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9760187332';
-- Lead: Ashish Kumar | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9958554843';
-- Lead: Shiv Kumar | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9599198820';
-- Lead: Rajender Pal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9012193193';
-- Lead: Satish Singh | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8126881944';
-- Lead: Anand mohan | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9953601977';
-- Lead: Amar Jit Sharma | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9897865660';
-- Lead: Anil Jaiswal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9411716700';
-- Lead: Shubham Tyagi | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8954864880';
-- Lead: deepak saini | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9254060060';
-- Lead: Vinesh Saini | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9997571774';
-- Lead: Vikas Rawat | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%6005781352';
-- Lead: Satish kumar | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9991288003';
-- Lead: Prabhat Ranjan | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7579123481';
-- Lead: Abhishek Sharma | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9465441477';
-- Lead: Anil Choudhary | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9997270088';
-- Lead: Er Rahul Gusain | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9557832538';
-- Lead: Vikas Pal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7606554176';
-- Lead: Vinod | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7017933319';
-- Lead: Ravindra Kumar | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9719699899';
-- Lead: H S Rathore | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9411261124';
-- Lead: Vinit Chaudhary | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8218699989';
-- Lead: Pragati Vishnoi | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8279896912';
-- Lead: dinesh singh rana | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8077982146';
-- Lead: Madan Kunjwal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9837057598';
-- Lead: V Rawat | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7895201060';
-- Lead: Rajesh Singh | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9410187112';
-- Lead: Devender Bhati | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9958131399';
-- Lead: Gaurav Tyagi | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%7895716552';
-- Lead: pankaj kumar | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9034012512';
-- Lead: Chandrakiran Harsh | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%8010647368';
-- Lead: Raghuvir Sharma | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9878246263';
-- Lead: Rajesh Bhatt | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%8279411303';
-- Lead: Rajpal Singh Chauhan | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9557720075';
-- Lead: Subhash Chandr | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%7500335025';
-- Lead: Sagar Thapa | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9528862526';
-- Lead: Acharya Laxmi Prasad | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9812137991';
-- Lead: Ravi Saini | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7983966355';
-- Lead: Rajeev Trikha | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9045201017';
-- Lead: Chandramohan Sharma | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7506010239';
-- Lead: Ayush Singhal | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9418000460';
-- Lead: Ranjeet Singh | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%8279975148';
-- Lead: Manoj Petwal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9997416442';
-- Lead: Virendra Uniyal | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9412026364';
-- Lead: Harish Arora | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9990937595';
-- Lead: Rahul Kumar | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9971794190';
-- Lead: Nafisur Rahman | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9818279211';
-- Lead: Sumit Gulati | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9899111513';
-- Lead: Dinesh Painuly | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9690677775';
-- Lead: tarun pawar | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8882998931';
-- Lead: Sandeep Gupta | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9006786732';
-- Lead: Naaveen Chauhan | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8394810300';
-- Lead: Manish Rawat | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7895444445';
-- Lead: Sharvan Verma | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9818277733';
-- Lead: Deepak Choudhary | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8868885783';
-- Lead: Sumit Dhiman | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9758491008';
-- Lead: Nikhil Kaithwas | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9990007521';
-- Lead: Sumant Vishvakarma | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7983243996';
-- Lead: Dr-Arvind Singh | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8171801930';
-- Lead: Deep Tiwari | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9897852258';
-- Lead: Samir Jain | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8533986500';
-- Lead: Neeraj Nauni | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9990401682';
-- Lead: Vinod Kumar | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9045853448';
-- Lead: Manish Kumar | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%8449054106';
-- Lead: Gusain Vinod | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9027001540';
-- Lead: Ravinder Bist | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9909021225';
-- Lead: Deepak Gupta | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9650995068';
-- Lead: Haseen Ahmed | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9359672925';
-- Lead: Mishrwan Singh Jagat | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%7838207656';
-- Lead: Vikram Gusain | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7500203300';
-- Lead: Kuldeep SINGH | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%7559136181';
-- Lead: Asim Isham | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%8010105005';
-- Lead: Vivek Thapliyal | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%8787785679';
-- Lead: Brijpal Singh | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9720330654';
-- Lead: Sunil Dewani | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9873271117';
-- Lead: P C Anthwal | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%7500649494';
-- Lead: Dr.gulab singh chadda | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9817350326';
-- Lead: Ayush Shrivastava | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%7618820957';
-- Lead: sachin kàśHÿäp | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9760910810';
-- Lead: mohd shuaib | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9927231473';
-- Lead: Shubham Khemchandani | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%8171493615';
-- Lead: Kuldip bhandari | Assign to: Sapna Arya
UPDATE `Lead` SET `assignedToId` = @sapna_id WHERE `phone` LIKE '%9460000987';
-- Lead: Santosh Chamoli | Assign to: Manashvi Bisht
UPDATE `Lead` SET `assignedToId` = @manashvi_id WHERE `phone` LIKE '%9634440813';
-- Lead: Arvind Kumar | Assign to: Aarti Ghanata
UPDATE `Lead` SET `assignedToId` = @aarti_id WHERE `phone` LIKE '%9891686830';
-- Lead: Satish Rana | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%7060155510';
-- Lead: Gajpal Singh Aswal | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%9101226007';
-- Lead: Ramkumar | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%9634849395';
-- Lead: Sanjay Bhasin | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%9897138230';
-- Lead: Kapil Dev | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%9368193022';
-- Lead: Surbhi | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%8126994529';
-- Lead: abhishek | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%9897655087';
-- Lead: Abhijeet Mandal | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%9910601860';
-- Lead: Anju Kumeri | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%7895470927';
-- Lead: Pooran Singh Rana | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%9899363835';
-- Lead: Dinesh Pokhriyal | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%7500520120';
-- Lead: Anil Sandoria | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%9045464905';
-- Lead: ajay kumar | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%8294147808';
-- Lead: Mohd Danish | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%9410468488';
-- Lead: Momeen | Unassigned
UPDATE `Lead` SET `assignedToId` = NULL WHERE `phone` LIKE '%9289761994';

COMMIT;

-- Verification query:

SELECT u.name as SalesPerson, COUNT(l.id) as TotalLeadsAssigned
FROM `User` u
LEFT JOIN `Lead` l ON l.assignedToId = u.id
GROUP BY u.id, u.name;
