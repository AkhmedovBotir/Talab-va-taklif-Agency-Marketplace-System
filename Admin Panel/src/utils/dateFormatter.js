// Uzbek tilida sana formatlash funksiyalari

const monthNames = {
  uz: [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ],
  uzLatn: [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ]
};

const dayNames = {
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  uzLatn: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
};

/**
 * Sana string yoki Date objectni to'g'ri format qiladi
 * @param {string|Date} dateString - Format qilinadigan sana
 * @param {object} options - Formatlash opsiyalari
 * @returns {string} Formatlangan sana
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '-';
  
  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    // Agar sana noto'g'ri bo'lsa
    if (isNaN(date.getTime())) {
      return '-';
    }

    const {
      includeTime = false,
      includeDay = false,
      shortMonth = false,
      format = 'full'
    } = options;

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfWeek = date.getDay();

    let formattedDate = '';

    switch (format) {
      case 'full':
        // To'liq format: "15 Yanvar 2024"
        formattedDate = `${day} ${monthNames.uz[month]} ${year}`;
        break;
      
      case 'short':
        // Qisqa format: "15.01.2024"
        formattedDate = `${String(day).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${year}`;
        break;
      
      case 'long':
        // Uzun format: "15 Yanvar 2024 yil"
        formattedDate = `${day} ${monthNames.uz[month]} ${year} yil`;
        break;
      
      case 'month-year':
        // Oy va yil: "Yanvar 2024"
        formattedDate = `${monthNames.uz[month]} ${year}`;
        break;
      
      case 'year':
        // Faqat yil: "2024"
        formattedDate = `${year}`;
        break;
      
      case 'month':
        // Faqat oy: "Yanvar"
        formattedDate = monthNames.uz[month];
        break;
      
      default:
        formattedDate = `${day} ${monthNames.uz[month]} ${year}`;
    }

    // Hafta kuni qo'shish
    if (includeDay) {
      formattedDate = `${dayNames.uz[dayOfWeek]}, ${formattedDate}`;
    }

    // Vaqt qo'shish
    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      formattedDate += ` ${hours}:${minutes}`;
    }

    return formattedDate;
  } catch (error) {
    console.error('Date formatting error:', error);
    return '-';
  }
};

/**
 * Sana va vaqtni format qiladi
 * @param {string|Date} dateString - Format qilinadigan sana
 * @returns {string} Formatlangan sana va vaqt
 */
export const formatDateTime = (dateString) => {
  return formatDate(dateString, { includeTime: true });
};

/**
 * Sana oraliqini format qiladi
 * @param {string|Date} startDate - Boshlanish sanasi
 * @param {string|Date} endDate - Tugash sanasi
 * @returns {string} Formatlangan oraliq
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '-';
  
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  return `${start} - ${end}`;
};

/**
 * Oy nomini olish
 * @param {number} monthIndex - Oy indeksi (0-11)
 * @returns {string} Oy nomi
 */
export const getMonthName = (monthIndex) => {
  if (monthIndex < 0 || monthIndex > 11) return '-';
  return monthNames.uz[monthIndex];
};

/**
 * Hafta kuni nomini olish
 * @param {number} dayIndex - Hafta kuni indeksi (0-6)
 * @returns {string} Hafta kuni nomi
 */
export const getDayName = (dayIndex) => {
  if (dayIndex < 0 || dayIndex > 6) return '-';
  return dayNames.uz[dayIndex];
};

/**
 * Sana va vaqtni to'liq format qiladi (jadval uchun)
 * @param {string|Date} dateString - Format qilinadigan sana
 * @returns {string} Formatlangan sana va vaqt
 */
export const formatTableDate = (dateString) => {
  return formatDate(dateString, { 
    includeTime: true,
    format: 'short'
  });
};

/**
 * Yil va oyni format qiladi
 * @param {number} year - Yil
 * @param {number} month - Oy (1-12)
 * @returns {string} Formatlangan oy va yil
 */
export const formatYearMonth = (year, month) => {
  if (!year || !month) return '-';
  if (month < 1 || month > 12) return '-';
  return `${monthNames.uz[month - 1]} ${year}`;
};

