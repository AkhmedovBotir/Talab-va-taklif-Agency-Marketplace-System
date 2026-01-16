const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    if (!schema || typeof schema.validate !== 'function') {
      return res.status(500).json({
        success: false,
        message: 'Validatsiya schemasi noto\'g\'ri',
      });
    }
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validatsiya xatosi',
        errors,
      });
    }

    next();
  };
};

const adminValidationSchemas = {
  // Base Product validation schemas
  createBaseProduct: Joi.object({
    name: Joi.string()
      .min(2)
      .max(500)
      .required()
      .trim()
      .messages({
        'string.empty': 'Maxsulot nomi kiritilishi shart',
        'string.min': 'Maxsulot nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Maxsulot nomi 500 ta belgidan oshmasligi kerak',
        'any.required': 'Maxsulot nomi kiritilishi shart',
      }),
    description: Joi.alternatives().try(
      Joi.string().allow(''),
      Joi.object(),
      Joi.valid(null)
    ),
    images: Joi.array()
      .items(Joi.string().pattern(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/))
      .max(5)
      .messages({
        'array.max': 'Maksimal 5 ta rasm yuklash mumkin',
        'string.pattern.base': 'Rasmlar base64 formatida bo\'lishi kerak (data:image/png;base64,... yoki data:image/jpeg;base64,...)',
      }),
    category: Joi.string()
      .required()
      .messages({
        'string.empty': 'Kategoriya kiritilishi shart',
        'any.required': 'Kategoriya kiritilishi shart',
      }),
    subcategory: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Sub kategoriya ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    unit: Joi.string()
      .valid('dona', 'litr', 'kg')
      .required()
      .messages({
        'any.only': 'Birlik "dona", "litr" yoki "kg" bo\'lishi kerak',
        'any.required': 'Birlik kiritilishi shart',
      }),
    unitSize: Joi.number()
      .min(0)
      .allow(null)
      .messages({
        'number.min': 'Birlik o\'lchami 0 dan kichik bo\'la olmaydi',
        'number.base': 'Birlik o\'lchami raqam bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),
  updateBaseProduct: Joi.object({
    name: Joi.string()
      .min(2)
      .max(500)
      .trim()
      .messages({
        'string.min': 'Maxsulot nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Maxsulot nomi 500 ta belgidan oshmasligi kerak',
      }),
    description: Joi.alternatives().try(
      Joi.string().allow(''),
      Joi.object(),
      Joi.valid(null)
    ),
    images: Joi.array()
      .items(Joi.string().pattern(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/))
      .max(5)
      .messages({
        'array.max': 'Maksimal 5 ta rasm yuklash mumkin',
        'string.pattern.base': 'Rasmlar base64 formatida bo\'lishi kerak',
      }),
    category: Joi.string()
      .messages({
        'string.base': 'Kategoriya ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    subcategory: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Sub kategoriya ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    unit: Joi.string()
      .valid('dona', 'litr', 'kg')
      .messages({
        'any.only': 'Birlik "dona", "litr" yoki "kg" bo\'lishi kerak',
      }),
    unitSize: Joi.number()
      .min(0)
      .allow(null)
      .messages({
        'number.min': 'Birlik o\'lchami 0 dan kichik bo\'la olmaydi',
        'number.base': 'Birlik o\'lchami raqam bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Ism kiritilishi shart',
        'string.min': 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Ism 100 ta belgidan oshmasligi kerak',
      }),
    role: Joi.string()
      .valid('general', 'admin')
      .default('general')
      .messages({
        'any.only': 'Rol "general" yoki "admin" bo\'lishi kerak',
      }),
    telefonRaqam: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
      }),
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .lowercase()
      .messages({
        'string.empty': 'Foydalanuvchi nomi kiritilishi shart',
        'string.alphanum': 'Foydalanuvchi nomi faqat harf va raqamlardan iborat bo\'lishi kerak',
        'string.min': 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Foydalanuvchi nomi 30 ta belgidan oshmasligi kerak',
      }),
    parol: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .messages({
        'string.min': 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Ism 100 ta belgidan oshmasligi kerak',
      }),
    role: Joi.string()
      .valid('general', 'admin')
      .messages({
        'any.only': 'Rol "general" yoki "admin" bo\'lishi kerak',
      }),
    telefonRaqam: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .messages({
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
      }),
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .lowercase()
      .messages({
        'string.alphanum': 'Foydalanuvchi nomi faqat harf va raqamlardan iborat bo\'lishi kerak',
        'string.min': 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Foydalanuvchi nomi 30 ta belgidan oshmasligi kerak',
      }),
    parol: Joi.string()
      .min(6)
      .messages({
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  login: Joi.object({
    username: Joi.string()
      .required()
      .messages({
        'string.empty': 'Foydalanuvchi nomi kiritilishi shart',
      }),
    parol: Joi.string()
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
      }),
  }),

  // Maxalla Product validation schemas
  createMaxallaProduct: Joi.object({
    baseProductId: Joi.string()
      .required()
      .messages({
        'string.empty': 'Asosiy maxsulot ID kiritilishi shart',
        'any.required': 'Asosiy maxsulot ID kiritilishi shart',
      }),
    quantity: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.min': 'Miqdor 0 dan kichik bo\'la olmaydi',
        'any.required': 'Miqdor kiritilishi shart',
      }),
    price: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.min': 'Narx 0 dan kichik bo\'la olmaydi',
        'any.required': 'Narx kiritilishi shart',
      }),
    originalPrice: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.min': 'Asl narx 0 dan kichik bo\'la olmaydi',
        'any.required': 'Asl narx kiritilishi shart',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),
  updateMaxallaProduct: Joi.object({
    quantity: Joi.number()
      .min(0)
      .messages({
        'number.min': 'Miqdor 0 dan kichik bo\'la olmaydi',
      }),
    price: Joi.number()
      .min(0)
      .messages({
        'number.min': 'Narx 0 dan kichik bo\'la olmaydi',
      }),
    originalPrice: Joi.number()
      .min(0)
      .messages({
        'number.min': 'Asl narx 0 dan kichik bo\'la olmaydi',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),
};

const regionValidationSchemas = {
  create: Joi.object({
    name: Joi.string()
      .required()
      .trim()
      .messages({
        'string.empty': 'Xudud nomi kiritilishi shart',
      }),
    type: Joi.string()
      .valid('region', 'district', 'mfy')
      .required()
      .messages({
        'any.only': 'Xudud turi "region", "district" yoki "mfy" bo\'lishi kerak',
        'any.required': 'Xudud turi kiritilishi shart',
      }),
    parent: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Ota xudud ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    code: Joi.string()
      .required()
      .messages({
        'string.empty': 'Kod kiritilishi shart',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  update: Joi.object({
    name: Joi.string()
      .trim()
      .messages({
        'string.empty': 'Xudud nomi bo\'sh bo\'lmasligi kerak',
      }),
    type: Joi.string()
      .valid('region', 'district', 'mfy')
      .messages({
        'any.only': 'Xudud turi "region", "district" yoki "mfy" bo\'lishi kerak',
      }),
    parent: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Ota xudud ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    code: Joi.string()
      .messages({
        'string.empty': 'Kod bo\'sh bo\'lmasligi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

};

const contragentValidationSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .required()
      .trim()
      .messages({
        'string.empty': 'Nomi kiritilishi shart',
        'string.min': 'Nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Nomi 200 ta belgidan oshmasligi kerak',
      }),
    inn: Joi.string()
      .pattern(/^\d{9}$|^\d{12}$/)
      .when('contragentLevel', {
        is: Joi.string().valid('mfy'),
        then: Joi.optional().allow(null, ''),
        otherwise: Joi.required(),
      })
      .messages({
        'string.empty': 'INN kiritilishi shart',
        'string.pattern.base': 'INN 9 yoki 12 ta raqamdan iborat bo\'lishi kerak',
      }),
    viloyat: Joi.string()
      .required()
      .messages({
        'string.empty': 'Viloyat kiritilishi shart',
      }),
    tuman: Joi.string()
      .required()
      .messages({
        'string.empty': 'Tuman kiritilishi shart',
      }),
    mfy: Joi.string()
      .required()
      .messages({
        'string.empty': 'MFY kiritilishi shart',
      }),
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      }),
    logo: Joi.string()
      .pattern(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/)
      .allow(null, '')
      .messages({
        'string.pattern.base': 'Logo base64 formatida bo\'lishi kerak (data:image/png;base64,... yoki data:image/jpeg;base64,...)',
      }),
    contragentLevel: Joi.string()
      .valid('tuman', 'mfy')
      .default('tuman')
      .messages({
        'any.only': 'Kontragent darajasi "tuman" yoki "mfy" bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .messages({
        'string.min': 'Nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Nomi 200 ta belgidan oshmasligi kerak',
      }),
    inn: Joi.string()
      .pattern(/^\d{9}$|^\d{12}$/)
      .allow(null, '')
      .messages({
        'string.pattern.base': 'INN 9 yoki 12 ta raqamdan iborat bo\'lishi kerak',
      }),
    viloyat: Joi.string()
      .messages({
        'string.base': 'Viloyat ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    tuman: Joi.string()
      .messages({
        'string.base': 'Tuman ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    mfy: Joi.string()
      .messages({
        'string.base': 'MFY ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .messages({
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
      }),
    password: Joi.string()
      .min(6)
      .messages({
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      }),
    logo: Joi.string()
      .pattern(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/)
      .allow(null, '')
      .messages({
        'string.pattern.base': 'Logo base64 formatida bo\'lishi kerak (data:image/png;base64,... yoki data:image/jpeg;base64,...)',
      }),
    activityType: Joi.string()
      .messages({
        'string.base': 'Faoliyat turi ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    contragentLevel: Joi.string()
      .valid('tuman', 'mfy')
      .messages({
        'any.only': 'Kontragent darajasi "tuman" yoki "mfy" bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  login: Joi.object({
    phone: Joi.string()
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
      }),
  }),

  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .messages({
        'string.min': 'Nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Nomi 200 ta belgidan oshmasligi kerak',
      }),
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .messages({
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
      }),
    inn: Joi.string()
      .pattern(/^\d{9}$|^\d{12}$/)
      .allow(null, '')
      .messages({
        'string.pattern.base': 'INN 9 yoki 12 ta raqamdan iborat bo\'lishi kerak',
      }),
    viloyat: Joi.string().messages({
      'string.base': 'Viloyat ID to\'g\'ri formatda bo\'lishi kerak',
    }),
    tuman: Joi.string().messages({
      'string.base': 'Tuman ID to\'g\'ri formatda bo\'lishi kerak',
    }),
    mfy: Joi.string().messages({
      'string.base': 'MFY ID to\'g\'ri formatda bo\'lishi kerak',
    }),
    logo: Joi.string()
      .pattern(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/)
      .allow(null, '')
      .messages({
        'string.pattern.base': 'Logo base64 formatida bo\'lishi kerak (data:image/png;base64,... yoki data:image/jpeg;base64,...)',
      }),
  }),

  updateLogo: Joi.object({
    logo: Joi.string()
      .pattern(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/)
      .required()
      .messages({
        'any.required': 'Logo kiritilishi shart',
        'string.pattern.base': 'Logo base64 formatida bo\'lishi kerak (data:image/png;base64,... yoki data:image/jpeg;base64,...)',
      }),
  }),

  updateDeliveryRegions: Joi.object({
    deliveryRegions: Joi.array()
      .items(
        Joi.object({
          viloyat: Joi.string()
            .required()
            .messages({
              'any.required': 'Viloyat kiritilishi shart',
              'string.base': 'Viloyat ID to\'g\'ri formatda bo\'lishi kerak',
            }),
          tuman: Joi.string()
            .allow(null, '')
            .messages({
              'string.base': 'Tuman ID to\'g\'ri formatda bo\'lishi kerak',
            }),
        })
      )
      .required()
      .messages({
        'any.required': 'Yetkazib berish hududlari kiritilishi shart',
        'array.base': 'Yetkazib berish hududlari array bo\'lishi kerak',
      }),
  }),

  updateWorkingHours: Joi.object({
    open: Joi.string()
      .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      .messages({
        'string.pattern.base': 'Ochilish vaqti noto\'g\'ri format (HH:MM)',
      }),
    close: Joi.string()
      .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      .messages({
        'string.pattern.base': 'Yopilish vaqti noto\'g\'ri format (HH:MM)',
      }),
  }).or('open', 'close').messages({
    'object.missing': 'Kamida bitta vaqt (open yoki close) kiritilishi kerak',
  }),

  updateServiceAreas: Joi.object({
    tuman: Joi.string()
      .messages({
        'string.base': 'Tuman ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    mfys: Joi.array()
      .items(Joi.string())
      .min(1)
      .messages({
        'array.min': 'Kamida bitta MFY tanlanishi kerak',
        'array.base': 'MFYlar array formatida bo\'lishi kerak',
      }),
  }),

  passwordSetupStep1: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
  }),

  passwordSetupStep2: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
    code: Joi.string()
      .length(5)
      .required()
      .messages({
        'string.empty': 'Kod kiritilishi shart',
        'string.length': 'Kod 5 ta raqamdan iborat bo\'lishi kerak',
        'any.required': 'Kod kiritilishi shart',
      }),
  }),

  passwordSetupStep3: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
    newPassword: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
        'any.required': 'Parol kiritilishi shart',
      }),
  }),

  // Delivery Provider CRUD
  createDeliveryProvider: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .required()
      .trim()
      .messages({
        'string.empty': 'Yetkazib beruvchi nomi kiritilishi shart',
        'string.min': 'Yetkazib beruvchi nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Yetkazib beruvchi nomi 200 ta belgidan oshmasligi kerak',
        'any.required': 'Yetkazib beruvchi nomi kiritilishi shart',
      }),
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
        'any.required': 'Parol kiritilishi shart',
      }),
    notes: Joi.string()
      .max(1000)
      .allow(null, '')
      .trim()
      .messages({
        'string.max': 'Eslatmalar 1000 ta belgidan oshmasligi kerak',
      }),
  }),

  updateDeliveryProvider: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .messages({
        'string.min': 'Yetkazib beruvchi nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Yetkazib beruvchi nomi 200 ta belgidan oshmasligi kerak',
      }),
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .messages({
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
      }),
    password: Joi.string()
      .min(6)
      .messages({
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
    notes: Joi.string()
      .max(1000)
      .allow(null, '')
      .trim()
      .messages({
        'string.max': 'Eslatmalar 1000 ta belgidan oshmasligi kerak',
      }),
  }),

  respondToOrderRequest: Joi.object({
    response: Joi.string()
      .valid('accepted', 'rejected')
      .required()
      .messages({
        'any.only': 'Javob "accepted" yoki "rejected" bo\'lishi kerak',
        'any.required': 'Javob kiritilishi shart',
        'string.empty': 'Javob kiritilishi shart',
      }),
  }),

  sendOrderToDeliveryProvider: Joi.object({
    deliveryProviderId: Joi.string()
      .required()
      .messages({
        'string.empty': 'Yetkazib beruvchi ID kiritilishi shart',
        'any.required': 'Yetkazib beruvchi ID kiritilishi shart',
      }),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'string.empty': 'Joriy parol kiritilishi shart',
        'any.required': 'Joriy parol kiritilishi shart',
      }),
    newPassword: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Yangi parol kiritilishi shart',
        'string.min': 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak',
        'any.required': 'Yangi parol kiritilishi shart',
      }),
  }),
};

const agentValidationSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .required()
      .trim()
      .messages({
        'string.empty': 'Ismi kiritilishi shart',
        'string.min': 'Ismi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Ismi 200 ta belgidan oshmasligi kerak',
      }),
    viloyat: Joi.string()
      .required()
      .messages({
        'string.empty': 'Viloyat kiritilishi shart',
      }),
    tuman: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Tuman ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    mfy: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'MFY ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .messages({
        'string.min': 'Ismi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Ismi 200 ta belgidan oshmasligi kerak',
      }),
    viloyat: Joi.string()
      .messages({
        'string.base': 'Viloyat ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    tuman: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Tuman ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    mfy: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'MFY ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .messages({
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
      }),
    password: Joi.string()
      .min(6)
      .messages({
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  login: Joi.object({
    phone: Joi.string()
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
      }),
  }),

  passwordSetupStep1: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
  }),

  passwordSetupStep2: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
    code: Joi.string()
      .length(5)
      .required()
      .messages({
        'string.empty': 'Kod kiritilishi shart',
        'string.length': 'Kod 5 ta raqamdan iborat bo\'lishi kerak',
        'any.required': 'Kod kiritilishi shart',
      }),
  }),

  passwordSetupStep3: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
    newPassword: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
        'any.required': 'Parol kiritilishi shart',
      }),
  }),
};

const punktValidationSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .required()
      .trim()
      .messages({
        'string.empty': 'Punkt nomi kiritilishi shart',
        'string.min': 'Punkt nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Punkt nomi 200 ta belgidan oshmasligi kerak',
      }),
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      }),
    viloyat: Joi.string()
      .required()
      .messages({
        'string.empty': 'Viloyat kiritilishi shart',
      }),
    tuman: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Tuman ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .messages({
        'string.min': 'Punkt nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Punkt nomi 200 ta belgidan oshmasligi kerak',
      }),
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .messages({
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
      }),
    password: Joi.string()
      .min(6)
      .messages({
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      }),
    viloyat: Joi.string()
      .messages({
        'string.base': 'Viloyat ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    tuman: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Tuman ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  login: Joi.object({
    phone: Joi.string()
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
      }),
  }),

  passwordSetupStep1: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
  }),

  passwordSetupStep2: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
    code: Joi.string()
      .length(5)
      .required()
      .messages({
        'string.empty': 'Kod kiritilishi shart',
        'string.length': 'Kod 5 ta raqamdan iborat bo\'lishi kerak',
        'any.required': 'Kod kiritilishi shart',
      }),
  }),

  passwordSetupStep3: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
    newPassword: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
        'any.required': 'Parol kiritilishi shart',
      }),
  }),
};

const categoryValidationSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .required()
      .trim()
      .messages({
        'string.empty': 'Kategoriya nomi kiritilishi shart',
        'string.min': 'Kategoriya nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
      }),
    parent: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Ota kategoriya ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .trim()
      .messages({
        'string.min': 'Kategoriya nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
      }),
    parent: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Ota kategoriya ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  createSubcategory: Joi.object({
    name: Joi.string()
      .min(2)
      .required()
      .trim()
      .messages({
        'string.empty': 'Sub kategoriya nomi kiritilishi shart',
        'string.min': 'Sub kategoriya nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
      }),
    parent: Joi.string()
      .required()
      .messages({
        'string.empty': 'Ota kategoriya kiritilishi shart',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  updateSubcategory: Joi.object({
    name: Joi.string()
      .min(2)
      .trim()
      .messages({
        'string.min': 'Sub kategoriya nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
      }),
    parent: Joi.string()
      .messages({
        'string.empty': 'Ota kategoriya kiritilishi shart',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid('active', 'inactive')
      .required()
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
        'any.required': 'Status kiritilishi shart',
      }),
  }),
};

// Admin Category Validation Schemas
const adminCategoryValidationSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .required()
      .trim()
      .messages({
        'string.empty': 'Kategoriya nomi kiritilishi shart',
        'string.min': 'Kategoriya nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
      }),
    image: Joi.string()
      .allow(null, '')
      .trim()
      .messages({
        'string.base': 'Rasm to\'g\'ri formatda bo\'lishi kerak',
      }),
    censored: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Senzura true yoki false bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .trim()
      .messages({
        'string.min': 'Kategoriya nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
      }),
    image: Joi.string()
      .allow(null, '')
      .trim()
      .messages({
        'string.base': 'Rasm to\'g\'ri formatda bo\'lishi kerak',
      }),
    censored: Joi.boolean()
      .messages({
        'boolean.base': 'Senzura true yoki false bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  createSubcategory: Joi.object({
    name: Joi.string()
      .min(2)
      .required()
      .trim()
      .messages({
        'string.empty': 'Sub kategoriya nomi kiritilishi shart',
        'string.min': 'Sub kategoriya nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
      }),
    parent: Joi.string()
      .required()
      .messages({
        'string.empty': 'Ota kategoriya kiritilishi shart',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  updateSubcategory: Joi.object({
    name: Joi.string()
      .min(2)
      .trim()
      .messages({
        'string.min': 'Sub kategoriya nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
      }),
    parent: Joi.string()
      .messages({
        'string.empty': 'Ota kategoriya kiritilishi shart',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid('active', 'inactive')
      .required()
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
        'any.required': 'Status kiritilishi shart',
      }),
  }),
};

const productValidationSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(500)
      .required()
      .trim()
      .messages({
        'string.empty': 'Maxsulot nomi kiritilishi shart',
        'string.min': 'Maxsulot nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Maxsulot nomi 500 ta belgidan oshmasligi kerak',
      }),
    description: Joi.alternatives()
      .try(
        Joi.object(),
        Joi.string().allow(null, '')
      )
      .allow(null, '')
      .messages({
        'alternatives.types': 'Description Delta formatida (obyekt) yoki null bo\'lishi kerak',
      }),
    price: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'Narx raqam bo\'lishi kerak',
        'number.min': 'Narx 0 dan kichik bo\'la olmaydi',
        'any.required': 'Narx kiritilishi shart',
      }),
    originalPrice: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'Asl narx raqam bo\'lishi kerak',
        'number.min': 'Asl narx 0 dan kichik bo\'la olmaydi',
        'any.required': 'Asl narx kiritilishi shart',
      }),
    images: Joi.array()
      .items(Joi.string())
      .max(5)
      .messages({
        'array.max': 'Maksimal 5 ta rasm yuklash mumkin',
      }),
    category: Joi.string()
      .required()
      .messages({
        'string.empty': 'Kategoriya kiritilishi shart',
      }),
    subcategory: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Sub kategoriya ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    quantity: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'Miqdor raqam bo\'lishi kerak',
        'number.min': 'Miqdor 0 dan kichik bo\'la olmaydi',
        'any.required': 'Miqdor kiritilishi shart',
      }),
    unit: Joi.string()
      .valid('dona', 'litr', 'kg')
      .required()
      .messages({
        'any.only': 'Birlik "dona", "litr" yoki "kg" bo\'lishi kerak',
        'any.required': 'Birlik kiritilishi shart',
      }),
    unitSize: Joi.number()
      .min(0)
      .allow(null, '')
      .messages({
        'number.base': 'Birlik o\'lchami raqam bo\'lishi kerak',
        'number.min': 'Birlik o\'lchami 0 dan kichik bo\'la olmaydi',
      }),
    length: Joi.number()
      .min(0)
      .allow(null, '')
      .messages({
        'number.base': 'Bo\'yi raqam bo\'lishi kerak',
        'number.min': 'Bo\'yi 0 dan kichik bo\'la olmaydi',
      }),
    width: Joi.number()
      .min(0)
      .allow(null, '')
      .messages({
        'number.base': 'Eni raqam bo\'lishi kerak',
        'number.min': 'Eni 0 dan kichik bo\'la olmaydi',
      }),
    weight: Joi.number()
      .min(0)
      .allow(null, '')
      .messages({
        'number.base': 'Og\'irligi raqam bo\'lishi kerak',
        'number.min': 'Og\'irligi 0 dan kichik bo\'la olmaydi',
      }),
    status: Joi.string()
      .valid('active', 'inactive', 'archived')
      .default('active')
      .messages({
        'any.only': 'Status "active", "inactive" yoki "archived" bo\'lishi kerak',
      }),
    // deliveryRegions is not required - it's automatically taken from contragent profile
    deliveryRegions: Joi.array()
      .items(
        Joi.object({
          viloyat: Joi.string()
            .required()
            .messages({
              'string.empty': 'Viloyat kiritilishi shart',
              'any.required': 'Viloyat kiritilishi shart',
            }),
          tuman: Joi.string()
            .allow(null, '')
            .messages({
              'string.base': 'Tuman ID to\'g\'ri formatda bo\'lishi kerak',
            }),
        })
      )
      .allow(null)
      .messages({
        'array.base': 'Yetkazib berish xududlari massiv bo\'lishi kerak',
      }),
    kpiBonusPercent: Joi.number()
      .min(0)
      .max(100)
      .required()
      .messages({
        'number.base': 'KPI bonus foizi raqam bo\'lishi kerak',
        'number.min': 'KPI bonus foizi 0 dan kichik bo\'la olmaydi',
        'number.max': 'KPI bonus foizi 100 dan katta bo\'la olmaydi',
        'any.required': 'KPI bonus foizi kiritilishi shart',
      }),
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(500)
      .trim()
      .messages({
        'string.min': 'Maxsulot nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Maxsulot nomi 500 ta belgidan oshmasligi kerak',
      }),
    description: Joi.alternatives()
      .try(
        Joi.object(),
        Joi.string().allow(null, '')
      )
      .allow(null, '')
      .messages({
        'alternatives.types': 'Description Delta formatida (obyekt) yoki null bo\'lishi kerak',
      }),
    price: Joi.number()
      .min(0)
      .messages({
        'number.base': 'Narx raqam bo\'lishi kerak',
        'number.min': 'Narx 0 dan kichik bo\'la olmaydi',
      }),
    originalPrice: Joi.number()
      .min(0)
      .messages({
        'number.base': 'Asl narx raqam bo\'lishi kerak',
        'number.min': 'Asl narx 0 dan kichik bo\'la olmaydi',
      }),
    images: Joi.array()
      .items(Joi.string())
      .max(5)
      .messages({
        'array.max': 'Maksimal 5 ta rasm yuklash mumkin',
      }),
    category: Joi.string()
      .messages({
        'string.base': 'Kategoriya ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    subcategory: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Sub kategoriya ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    quantity: Joi.number()
      .min(0)
      .messages({
        'number.base': 'Miqdor raqam bo\'lishi kerak',
        'number.min': 'Miqdor 0 dan kichik bo\'la olmaydi',
      }),
    unit: Joi.string()
      .valid('dona', 'litr', 'kg')
      .messages({
        'any.only': 'Birlik "dona", "litr" yoki "kg" bo\'lishi kerak',
      }),
    unitSize: Joi.number()
      .min(0)
      .allow(null, '')
      .messages({
        'number.base': 'Birlik o\'lchami raqam bo\'lishi kerak',
        'number.min': 'Birlik o\'lchami 0 dan kichik bo\'la olmaydi',
      }),
    length: Joi.number()
      .min(0)
      .allow(null, '')
      .messages({
        'number.base': 'Bo\'yi raqam bo\'lishi kerak',
        'number.min': 'Bo\'yi 0 dan kichik bo\'la olmaydi',
      }),
    width: Joi.number()
      .min(0)
      .allow(null, '')
      .messages({
        'number.base': 'Eni raqam bo\'lishi kerak',
        'number.min': 'Eni 0 dan kichik bo\'la olmaydi',
      }),
    weight: Joi.number()
      .min(0)
      .allow(null, '')
      .messages({
        'number.base': 'Og\'irligi raqam bo\'lishi kerak',
        'number.min': 'Og\'irligi 0 dan kichik bo\'la olmaydi',
      }),
    status: Joi.string()
      .valid('active', 'inactive', 'archived')
      .messages({
        'any.only': 'Status "active", "inactive" yoki "archived" bo\'lishi kerak',
      }),
    // deliveryRegions is not required - it's automatically taken from contragent profile
    deliveryRegions: Joi.array()
      .items(
        Joi.object({
          viloyat: Joi.string()
            .required()
            .messages({
              'string.empty': 'Viloyat kiritilishi shart',
              'any.required': 'Viloyat kiritilishi shart',
            }),
          tuman: Joi.string()
            .allow(null, '')
            .messages({
              'string.base': 'Tuman ID to\'g\'ri formatda bo\'lishi kerak',
            }),
        })
      )
      .allow(null)
      .messages({
        'array.base': 'Yetkazib berish xududlari massiv bo\'lishi kerak',
      }),
    kpiBonusPercent: Joi.number()
      .min(0)
      .max(100)
      .messages({
        'number.base': 'KPI bonus foizi raqam bo\'lishi kerak',
        'number.min': 'KPI bonus foizi 0 dan kichik bo\'la olmaydi',
        'number.max': 'KPI bonus foizi 100 dan katta bo\'la olmaydi',
      }),
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid('active', 'inactive', 'archived')
      .required()
      .messages({
        'any.only': 'Status "active", "inactive" yoki "archived" bo\'lishi kerak',
        'any.required': 'Status kiritilishi shart',
      }),
  }),
};

const marketplaceValidationSchemas = {
  registerStep1: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
  }),

  registerStep2: Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .trim()
      .messages({
        'string.empty': 'Ism kiritilishi shart',
        'string.min': 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Ism 50 ta belgidan oshmasligi kerak',
        'any.required': 'Ism kiritilishi shart',
      }),
    lastName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .trim()
      .messages({
        'string.empty': 'Familiya kiritilishi shart',
        'string.min': 'Familiya kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Familiya 50 ta belgidan oshmasligi kerak',
        'any.required': 'Familiya kiritilishi shart',
      }),
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
    gender: Joi.string()
      .valid('ayol', 'erkak')
      .required()
      .messages({
        'any.only': 'Jins "ayol" yoki "erkak" bo\'lishi kerak',
        'any.required': 'Jins kiritilishi shart',
      }),
    viloyat: Joi.string()
      .required()
      .messages({
        'string.empty': 'Viloyat kiritilishi shart',
        'any.required': 'Viloyat kiritilishi shart',
      }),
    tuman: Joi.string()
      .required()
      .messages({
        'string.empty': 'Tuman kiritilishi shart',
        'any.required': 'Tuman kiritilishi shart',
      }),
    mfy: Joi.string()
      .required()
      .messages({
        'string.empty': 'MFY kiritilishi shart',
        'any.required': 'MFY kiritilishi shart',
      }),
    birthDate: Joi.date()
      .required()
      .messages({
        'date.base': 'Tug\'ilgan sana to\'g\'ri formatda bo\'lishi kerak',
        'any.required': 'Tug\'ilgan sana kiritilishi shart',
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
        'any.required': 'Parol kiritilishi shart',
      }),
    code: Joi.string()
      .length(5)
      .pattern(/^\d{5}$/)
      .required()
      .messages({
        'string.empty': 'Tasdiqlash kodi kiritilishi shart',
        'string.length': 'Tasdiqlash kodi 5 ta raqamdan iborat bo\'lishi kerak',
        'string.pattern.base': 'Tasdiqlash kodi faqat raqamlardan iborat bo\'lishi kerak',
        'any.required': 'Tasdiqlash kodi kiritilishi shart',
      }),
  }),

  loginStep1: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
        'any.required': 'Parol kiritilishi shart',
      }),
  }),

  loginStep2: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
    code: Joi.string()
      .length(5)
      .pattern(/^\d{5}$/)
      .required()
      .messages({
        'string.empty': 'Tasdiqlash kodi kiritilishi shart',
        'string.length': 'Tasdiqlash kodi 5 ta raqamdan iborat bo\'lishi kerak',
        'string.pattern.base': 'Tasdiqlash kodi faqat raqamlardan iborat bo\'lishi kerak',
        'any.required': 'Tasdiqlash kodi kiritilishi shart',
      }),
  }),

  forgotPasswordStep1: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
  }),

  forgotPasswordStep2: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
    code: Joi.string()
      .length(5)
      .pattern(/^\d{5}$/)
      .required()
      .messages({
        'string.empty': 'Tasdiqlash kodi kiritilishi shart',
        'string.length': 'Tasdiqlash kodi 5 ta raqamdan iborat bo\'lishi kerak',
        'string.pattern.base': 'Tasdiqlash kodi faqat raqamlardan iborat bo\'lishi kerak',
        'any.required': 'Tasdiqlash kodi kiritilishi shart',
      }),
    newPassword: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Yangi parol kiritilishi shart',
        'string.min': 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak',
        'any.required': 'Yangi parol kiritilishi shart',
      }),
  }),

  resendSMSCode: Joi.object({
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Telefon raqami kiritilishi shart',
      }),
    type: Joi.string()
      .valid('login', 'register', 'forgot_password')
      .required()
      .messages({
        'any.only': 'Kod turi "login", "register" yoki "forgot_password" bo\'lishi kerak',
        'any.required': 'Kod turi kiritilishi shart',
      }),
  }),
};

const cartValidationSchemas = {
  addToCart: Joi.object({
    productId: Joi.string()
      .required()
      .messages({
        'string.empty': 'Maxsulot ID kiritilishi shart',
        'any.required': 'Maxsulot ID kiritilishi shart',
      }),
    quantity: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Miqdor raqam bo\'lishi kerak',
        'number.integer': 'Miqdor butun son bo\'lishi kerak',
        'number.min': 'Miqdor kamida 1 bo\'lishi kerak',
      }),
  }),

  updateCartItem: Joi.object({
    quantity: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        'number.base': 'Miqdor raqam bo\'lishi kerak',
        'number.integer': 'Miqdor butun son bo\'lishi kerak',
        'number.min': 'Miqdor kamida 1 bo\'lishi kerak',
        'any.required': 'Miqdor kiritilishi shart',
      }),
  }),
};

const orderValidationSchemas = {
  create: Joi.object({
    paymentMethod: Joi.string()
      .valid('cash', 'card')
      .required()
      .messages({
        'any.only': 'To\'lov usuli "cash" yoki "card" bo\'lishi kerak',
        'any.required': 'To\'lov usuli kiritilishi shart',
      }),
    deliveryViloyat: Joi.string()
      .required()
      .messages({
        'string.empty': 'Yetkazib berish viloyati kiritilishi shart',
        'any.required': 'Yetkazib berish viloyati kiritilishi shart',
      }),
    deliveryTuman: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Tuman ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    deliveryMfy: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'MFY ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    deliveryNote: Joi.string()
      .trim()
      .max(1000)
      .allow('')
      .messages({
        'string.max': 'Yetkazib berish eslatmasi 1000 ta belgidan oshmasligi kerak',
      }),
    phoneNumber: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .trim()
      .messages({
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
      }),
    clearCart: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'clearCart boolean qiymat bo\'lishi kerak',
      }),
  }),
};

const marketplaceProfileValidationSchemas = {
  updateProfile: Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .messages({
        'string.min': 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Ism 50 ta belgidan oshmasligi kerak',
      }),
    lastName: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .messages({
        'string.min': 'Familiya kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Familiya 50 ta belgidan oshmasligi kerak',
      }),
    gender: Joi.string()
      .valid('ayol', 'erkak')
      .messages({
        'any.only': 'Jins "ayol" yoki "erkak" bo\'lishi kerak',
      }),
    birthDate: Joi.date()
      .messages({
        'date.base': 'Tug\'ilgan sana to\'g\'ri formatda bo\'lishi kerak',
      }),
  }),

  updatePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'string.empty': 'Joriy parol kiritilishi shart',
        'any.required': 'Joriy parol kiritilishi shart',
      }),
    newPassword: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Yangi parol kiritilishi shart',
        'string.min': 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak',
        'any.required': 'Yangi parol kiritilishi shart',
      }),
  }),

  updateAvatar: Joi.object({
    avatar: Joi.string()
      .required()
      .pattern(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/)
      .messages({
        'string.empty': 'Avatar kiritilishi shart',
        'string.pattern.base': 'Avatar base64 formatida bo\'lishi kerak (data:image/png;base64,... yoki data:image/jpeg;base64,...)',
        'any.required': 'Avatar kiritilishi shart',
      }),
  }),

  updateLocation: Joi.object({
    viloyat: Joi.string()
      .messages({
        'string.base': 'Viloyat ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    tuman: Joi.string()
      .messages({
        'string.base': 'Tuman ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    mfy: Joi.string()
      .messages({
        'string.base': 'MFY ID to\'g\'ri formatda bo\'lishi kerak',
      }),
  }),

  updateViloyatTuman: Joi.object({
    viloyat: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Viloyat ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    tuman: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'Tuman ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    mfy: Joi.string()
      .allow(null, '')
      .messages({
        'string.base': 'MFY ID to\'g\'ri formatda bo\'lishi kerak',
      }),
  }),
};

const partnershipRequestValidationSchemas = {
  create: Joi.object({
    companyName: Joi.string()
      .min(2)
      .max(200)
      .required()
      .trim()
      .messages({
        'string.empty': 'Kompaniya nomi kiritilishi shart',
        'string.min': 'Kompaniya nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Kompaniya nomi 200 ta belgidan oshmasligi kerak',
        'any.required': 'Kompaniya nomi kiritilishi shart',
      }),
    inn: Joi.string()
      .pattern(/^\d{9}$|^\d{12}$/)
      .required()
      .trim()
      .messages({
        'string.empty': 'INN kiritilishi shart',
        'string.pattern.base': 'INN 9 yoki 12 ta raqamdan iborat bo\'lishi kerak',
        'any.required': 'INN kiritilishi shart',
      }),
    mfo: Joi.string()
      .required()
      .trim()
      .messages({
        'string.empty': 'MFO kiritilishi shart',
        'any.required': 'MFO kiritilishi shart',
      }),
    accountNumber: Joi.string()
      .required()
      .trim()
      .messages({
        'string.empty': 'Hisob raqami kiritilishi shart',
        'any.required': 'Hisob raqami kiritilishi shart',
      }),
    viloyat: Joi.string()
      .required()
      .messages({
        'string.empty': 'Viloyat kiritilishi shart',
        'any.required': 'Viloyat kiritilishi shart',
      }),
    tuman: Joi.string()
      .required()
      .messages({
        'string.empty': 'Tuman kiritilishi shart',
        'any.required': 'Tuman kiritilishi shart',
      }),
    mfy: Joi.string()
      .required()
      .messages({
        'string.empty': 'MFY kiritilishi shart',
        'any.required': 'MFY kiritilishi shart',
      }),
    activityType: Joi.string()
      .required()
      .messages({
        'string.empty': 'Faoliyat turi kiritilishi shart',
        'any.required': 'Faoliyat turi kiritilishi shart',
      }),
    managerFirstName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .trim()
      .messages({
        'string.empty': 'Rahbar ismi kiritilishi shart',
        'string.min': 'Rahbar ismi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Rahbar ismi 50 ta belgidan oshmasligi kerak',
        'any.required': 'Rahbar ismi kiritilishi shart',
      }),
    managerLastName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .trim()
      .messages({
        'string.empty': 'Rahbar familiyasi kiritilishi shart',
        'string.min': 'Rahbar familiyasi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Rahbar familiyasi 50 ta belgidan oshmasligi kerak',
        'any.required': 'Rahbar familiyasi kiritilishi shart',
      }),
    managerPhone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .trim()
      .messages({
        'string.empty': 'Rahbar telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Rahbar telefon raqami kiritilishi shart',
      }),
  }),

  updateContactStatus: Joi.object({
    contactStatus: Joi.string()
      .valid('not_contacted', 'contacted', 'in_progress', 'completed')
      .required()
      .messages({
        'any.only': 'Aloqa holati "not_contacted", "contacted", "in_progress" yoki "completed" bo\'lishi kerak',
        'any.required': 'Aloqa holati kiritilishi shart',
      }),
  }),

  updateRequestStatus: Joi.object({
    status: Joi.string()
      .valid('pending', 'approved', 'rejected')
      .required()
      .messages({
        'any.only': 'So\'rov holati "pending", "approved" yoki "rejected" bo\'lishi kerak',
        'any.required': 'So\'rov holati kiritilishi shart',
      }),
    adminNotes: Joi.string()
      .trim()
      .max(1000)
      .allow(null, '')
      .messages({
        'string.max': 'Admin eslatmasi 1000 ta belgidan oshmasligi kerak',
      }),
  }),
};

const marketplacePartnershipRequestValidationSchemas = {
  create: Joi.object({
    companyName: Joi.string()
      .min(2)
      .max(200)
      .required()
      .trim()
      .messages({
        'string.empty': 'Kompaniya nomi kiritilishi shart',
        'string.min': 'Kompaniya nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Kompaniya nomi 200 ta belgidan oshmasligi kerak',
        'any.required': 'Kompaniya nomi kiritilishi shart',
      }),
    inn: Joi.string()
      .pattern(/^\d{9}$|^\d{12}$/)
      .required()
      .trim()
      .messages({
        'string.empty': 'INN kiritilishi shart',
        'string.pattern.base': 'INN 9 yoki 12 ta raqamdan iborat bo\'lishi kerak',
        'any.required': 'INN kiritilishi shart',
      }),
    mfo: Joi.string()
      .required()
      .trim()
      .messages({
        'string.empty': 'MFO kiritilishi shart',
        'any.required': 'MFO kiritilishi shart',
      }),
    accountNumber: Joi.string()
      .required()
      .trim()
      .messages({
        'string.empty': 'Hisob raqami kiritilishi shart',
        'any.required': 'Hisob raqami kiritilishi shart',
      }),
    viloyat: Joi.string()
      .required()
      .messages({
        'string.empty': 'Viloyat kiritilishi shart',
        'any.required': 'Viloyat kiritilishi shart',
      }),
    tuman: Joi.string()
      .required()
      .messages({
        'string.empty': 'Tuman kiritilishi shart',
        'any.required': 'Tuman kiritilishi shart',
      }),
    mfy: Joi.string()
      .required()
      .messages({
        'string.empty': 'MFY kiritilishi shart',
        'any.required': 'MFY kiritilishi shart',
      }),
    activityType: Joi.string()
      .required()
      .messages({
        'string.empty': 'Faoliyat turi kiritilishi shart',
        'any.required': 'Faoliyat turi kiritilishi shart',
      }),
    managerFirstName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .trim()
      .messages({
        'string.empty': 'Rahbar ismi kiritilishi shart',
        'string.min': 'Rahbar ismi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Rahbar ismi 50 ta belgidan oshmasligi kerak',
        'any.required': 'Rahbar ismi kiritilishi shart',
      }),
    managerLastName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .trim()
      .messages({
        'string.empty': 'Rahbar familiyasi kiritilishi shart',
        'string.min': 'Rahbar familiyasi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Rahbar familiyasi 50 ta belgidan oshmasligi kerak',
        'any.required': 'Rahbar familiyasi kiritilishi shart',
      }),
    managerPhone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .trim()
      .messages({
        'string.empty': 'Rahbar telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
        'any.required': 'Rahbar telefon raqami kiritilishi shart',
      }),
  }),

  updateContacted: Joi.object({
    adminNotes: Joi.string()
      .trim()
      .max(1000)
      .allow(null, '')
      .messages({
        'string.max': 'Admin eslatmasi 1000 ta belgidan oshmasligi kerak',
      }),
  }),

  approve: Joi.object({
    adminNotes: Joi.string()
      .trim()
      .max(1000)
      .allow(null, '')
      .messages({
        'string.max': 'Admin eslatmasi 1000 ta belgidan oshmasligi kerak',
      }),
  }),

  reject: Joi.object({
    adminNotes: Joi.string()
      .trim()
      .max(1000)
      .required()
      .messages({
        'string.empty': 'Rad etish sababi (adminNotes) kiritilishi shart',
        'string.max': 'Admin eslatmasi 1000 ta belgidan oshmasligi kerak',
        'any.required': 'Rad etish sababi (adminNotes) kiritilishi shart',
      }),
  }),
};

const featuredContragentValidationSchemas = {
  updateFeaturedList: Joi.object({
    contragentIds: Joi.array()
      .items(Joi.string().required())
      .min(0)
      .required()
      .messages({
        'array.base': 'contragentIds massiv bo\'lishi kerak',
        'array.min': 'Kamida 0 ta kontragent ID bo\'lishi mumkin',
        'any.required': 'contragentIds kiritilishi shart (bo\'sh massiv bo\'lishi ham mumkin)',
      }),
  }),
};

// Admin Product Moderation Validation Schemas
const adminProductModerationValidationSchemas = {
  reject: Joi.object({
    rejectionReason: Joi.string()
      .trim()
      .min(1)
      .max(1000)
      .required()
      .messages({
        'string.empty': 'Rad etish sababi kiritilishi shart',
        'string.min': 'Rad etish sababi kamida 1 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Rad etish sababi 1000 ta belgidan oshmasligi kerak',
        'any.required': 'Rad etish sababi kiritilishi shart',
      }),
  }),
  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(500)
      .trim()
      .messages({
        'string.min': 'Maxsulot nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Maxsulot nomi 500 ta belgidan oshmasligi kerak',
      }),
    description: Joi.alternatives().try(
      Joi.string().allow(''),
      Joi.object(),
      Joi.valid(null)
    ),
    price: Joi.number()
      .min(0)
      .messages({
        'number.min': 'Narx 0 dan kichik bo\'la olmaydi',
      }),
    originalPrice: Joi.number()
      .min(0)
      .messages({
        'number.min': 'Asl narx 0 dan kichik bo\'la olmaydi',
      }),
    images: Joi.array()
      .items(Joi.string())
      .max(5)
      .messages({
        'array.max': 'Maksimal 5 ta rasm yuklash mumkin',
      }),
    category: Joi.string()
      .messages({
        'string.base': 'Kategoriya ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    subcategory: Joi.alternatives().try(
      Joi.string(),
      Joi.valid(null, '')
    ),
    quantity: Joi.number()
      .min(0)
      .messages({
        'number.min': 'Miqdor 0 dan kichik bo\'la olmaydi',
      }),
    unit: Joi.string()
      .valid('dona', 'litr', 'kg')
      .messages({
        'any.only': 'Birlik "dona", "litr" yoki "kg" bo\'lishi kerak',
      }),
    unitSize: Joi.alternatives().try(
      Joi.number().min(0),
      Joi.valid(null, '')
    ),
    length: Joi.alternatives().try(
      Joi.number().min(0),
      Joi.valid(null, '')
    ),
    width: Joi.alternatives().try(
      Joi.number().min(0),
      Joi.valid(null, '')
    ),
    weight: Joi.alternatives().try(
      Joi.number().min(0),
      Joi.valid(null, '')
    ),
    status: Joi.string()
      .valid('active', 'inactive', 'archived')
      .messages({
        'any.only': 'Status "active", "inactive" yoki "archived" bo\'lishi kerak',
      }),
    deliveryRegions: Joi.array()
      .items(
        Joi.object({
          viloyat: Joi.string().required(),
          tuman: Joi.alternatives().try(
            Joi.string(),
            Joi.valid(null, '')
          ),
        })
      )
      .min(1)
      .messages({
        'array.min': 'Kamida bitta yetkazib berish xududi kiritilishi shart',
      }),
    kpiBonusPercent: Joi.number()
      .min(0)
      .max(100)
      .messages({
        'number.min': 'KPI bonus foizi 0 dan kichik bo\'la olmaydi',
        'number.max': 'KPI bonus foizi 100 dan katta bo\'la olmaydi',
      }),
    moderationStatus: Joi.string()
      .valid('pending', 'approved', 'rejected')
      .messages({
        'any.only': 'Moderation status "pending", "approved" yoki "rejected" bo\'lishi kerak',
      }),
  }),
};

// Contragent Type Validation Schemas
const contragentTypeValidationSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .required()
      .trim()
      .messages({
        'string.empty': 'Nomi kiritilishi shart',
        'string.min': 'Nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Nomi 200 ta belgidan oshmasligi kerak',
      }),
    icon: Joi.string()
      .required()
      .trim()
      .messages({
        'string.empty': 'Icon kiritilishi shart',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .messages({
        'string.min': 'Nomi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Nomi 200 ta belgidan oshmasligi kerak',
      }),
    icon: Joi.string()
      .trim()
      .messages({
        'string.base': 'Icon to\'g\'ri formatda bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),
};

const viloyatManagerValidationSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .required()
      .trim()
      .messages({
        'string.empty': 'Ismi kiritilishi shart',
        'string.min': 'Ismi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Ismi 200 ta belgidan oshmasligi kerak',
      }),
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      }),
    viloyat: Joi.string()
      .required()
      .messages({
        'string.empty': 'Viloyat kiritilishi shart',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('active')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .messages({
        'string.min': 'Ismi kamida 2 ta belgidan iborat bo\'lishi kerak',
        'string.max': 'Ismi 200 ta belgidan oshmasligi kerak',
      }),
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .messages({
        'string.pattern.base': 'To\'g\'ri telefon raqam formatini kiriting',
      }),
    password: Joi.string()
      .min(6)
      .messages({
        'string.min': 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      }),
    viloyat: Joi.string()
      .messages({
        'string.base': 'Viloyat ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .messages({
        'any.only': 'Status "active" yoki "inactive" bo\'lishi kerak',
      }),
  }),

  login: Joi.object({
    phone: Joi.string()
      .required()
      .messages({
        'string.empty': 'Telefon raqami kiritilishi shart',
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Parol kiritilishi shart',
      }),
    deviceId: Joi.string()
      .optional()
      .messages({
        'string.base': 'Qurilma ID to\'g\'ri formatda bo\'lishi kerak',
      }),
    deviceInfo: Joi.object()
      .optional()
      .messages({
        'object.base': 'Qurilma ma\'lumotlari to\'g\'ri formatda bo\'lishi kerak',
      }),
  }),
};

module.exports = {
  validate,
  adminValidationSchemas,
  regionValidationSchemas,
  contragentValidationSchemas,
  contragentTypeValidationSchemas,
  deliveryProviderValidationSchemas: {
    create: contragentValidationSchemas.createDeliveryProvider,
    update: contragentValidationSchemas.updateDeliveryProvider,
  },
  agentValidationSchemas,
  punktValidationSchemas,
  categoryValidationSchemas,
  adminCategoryValidationSchemas,
  productValidationSchemas,
  marketplaceValidationSchemas,
  cartValidationSchemas,
  orderValidationSchemas,
  marketplaceProfileValidationSchemas,
  partnershipRequestValidationSchemas,
  marketplacePartnershipRequestValidationSchemas,
  featuredContragentValidationSchemas,
  adminProductModerationValidationSchemas,
  viloyatManagerValidationSchemas,
};