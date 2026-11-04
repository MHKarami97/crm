import type { FieldDefinition } from './models'

export type BusinessType = 'haircut' | 'boutique' | 'auto' | 'general'

export interface BusinessTemplateInfo {
  id: BusinessType
  title: string
  subtitle: string
  iconName: string
  color: string
  defaultRepeatDays: number
  fields: Omit<FieldDefinition, 'id' | 'builtin' | 'archived' | 'order'>[]
}

export const BUSINESS_TEMPLATES: Record<BusinessType, BusinessTemplateInfo> = {
  haircut: {
    id: 'haircut',
    title: 'آرایشگاه و سالن زیبایی',
    subtitle: 'ثبت مدل مو، فرمول رنگ، نوع پوست و دوره تکرار اصلاح',
    iconName: 'Scissors',
    color: '#0d9488',
    defaultRepeatDays: 21,
    fields: [
      {
        key: 'hair_type',
        label: 'جنس و نوع مو',
        type: 'select',
        options: ['صاف', 'موج‌دار', 'فر', 'خشک', 'چرب', 'معمولی'],
        group: 'customer',
        section: 'customer',
        description: 'نوع بافت و میزان رطوبت موی مشتری',
      },
      {
        key: 'preferred_style',
        label: 'مدل اصلاح / کوتاهی ترجیحی',
        type: 'text',
        group: 'customer',
        section: 'customer',
        description: 'مدل موی همیشگی یا شماره ماشین اصلاح',
      },
      {
        key: 'color_formula',
        label: 'فرمول رنگ یا هایلایت',
        type: 'textarea',
        group: 'customer',
        section: 'customer',
        description: 'ترکیب شماره‌های رنگ، اکسیدان و مدت مکث',
      },
      {
        key: 'skin_allergies',
        label: 'حساسیت‌های پوستی یا تماسی',
        type: 'text',
        group: 'customer',
        section: 'customer',
        description: 'حساسیت به تیغ، افترشیو، دکلره و...',
      },
      {
        key: 'preferred_products',
        label: 'محصولات حالت‌دهنده مورد علاقه',
        type: 'text',
        group: 'customer',
        section: 'customer',
      },
      {
        key: 'repeat_interval_days',
        label: 'دوره تکرار معمول (روز)',
        type: 'number',
        group: 'customer',
        section: 'customer',
        description: 'تعداد روز تا مراجعه بعدی جهت یادآوری',
      },
    ],
  },
  boutique: {
    id: 'boutique',
    title: 'فروشگاه پوشاک و مزون',
    subtitle: 'سایزبندی بالاتنه و پایین‌تنه، رنگ و متریال ترجیحی',
    iconName: 'ShoppingBag',
    color: '#db2777',
    defaultRepeatDays: 45,
    fields: [
      {
        key: 'size_top',
        label: 'سایز بالاتنه',
        type: 'select',
        options: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '36', '38', '40', '42', '44', '46', '48'],
        group: 'customer',
        section: 'customer',
      },
      {
        key: 'size_bottom',
        label: 'سایز پایین‌تنه / شلوار',
        type: 'select',
        options: ['28', '30', '31', '32', '33', '34', '36', '38', '40', '42', '44', '46'],
        group: 'customer',
        section: 'customer',
      },
      {
        key: 'size_shoe',
        label: 'سایز کفش',
        type: 'select',
        options: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
        group: 'customer',
        section: 'customer',
      },
      {
        key: 'preferred_colors',
        label: 'رنگ‌های مورد علاقه',
        type: 'text',
        group: 'customer',
        section: 'customer',
        description: 'مثال: سرمه‌ای، زیتونی، خنثی',
      },
      {
        key: 'style_preference',
        label: 'سبک پوشش (Style)',
        type: 'select',
        options: ['کژوال و راحتی', 'رسمی و اداری', 'اسپرت و ورزشی', 'مجلسی', 'مینیمال'],
        group: 'customer',
        section: 'customer',
      },
      {
        key: 'fabric_allergies',
        label: 'پارچه‌های حساسیت‌زا یا نامطلوب',
        type: 'text',
        group: 'customer',
        section: 'customer',
        description: 'مثال: حساس به پشم، عدم تمایل به پلی‌استر',
      },
    ],
  },
  auto: {
    id: 'auto',
    title: 'خدمات خودرو و مکانیکی',
    subtitle: 'مدل خودرو، پلاک، کیلومتر سرویس دوره‌ای و روغن ترجیحی',
    iconName: 'Wrench',
    color: '#2563eb',
    defaultRepeatDays: 90,
    fields: [
      {
        key: 'car_model',
        label: 'مدل و تیپ خودرو',
        type: 'text',
        group: 'customer',
        section: 'customer',
        description: 'مثال: پژو ۲۰۷ دنده‌ای مدل ۱۴۰۲',
      },
      {
        key: 'license_plate',
        label: 'شماره پلاک',
        type: 'text',
        group: 'customer',
        section: 'customer',
        description: 'مثال: ۶۸ ب ۳۵۲ ایران ۷۷',
      },
      {
        key: 'preferred_oil',
        label: 'روغن موتور و فیلتر ترجیحی',
        type: 'text',
        group: 'customer',
        section: 'customer',
        description: 'مثال: بهران سوپر رانا 5W-40',
      },
      {
        key: 'last_odometer',
        label: 'کیلومتر در آخرین مراجعه',
        type: 'number',
        group: 'customer',
        section: 'customer',
      },
      {
        key: 'next_service_km',
        label: 'کیلومتر مراجعه بعدی',
        type: 'number',
        group: 'customer',
        section: 'customer',
      },
      {
        key: 'pending_issues',
        label: 'موارد نیازمند بررسی در مراجعه بعد',
        type: 'textarea',
        group: 'customer',
        section: 'customer',
        description: 'مثال: لنت‌های ترمز عقب در ۵۰۰۰ کیلومتر بعد تعویض شود',
      },
    ],
  },
  general: {
    id: 'general',
    title: 'کسب‌وکار و مشاوره عمومی',
    subtitle: 'بودجه خرید، علایق خدمت، کانال جذب و سطح وفاداری',
    iconName: 'Briefcase',
    color: '#d97706',
    defaultRepeatDays: 30,
    fields: [
      {
        key: 'service_interest',
        label: 'خدمات یا کالای مورد تقاضا',
        type: 'text',
        group: 'customer',
        section: 'customer',
      },
      {
        key: 'budget_level',
        label: 'سطح بودجه / رده خرید',
        type: 'select',
        options: ['اقتصادی', 'متوسط', 'بالا / VIP'],
        group: 'customer',
        section: 'customer',
      },
      {
        key: 'lead_source',
        label: 'کانال آشنایی / معرفی',
        type: 'text',
        group: 'customer',
        section: 'customer',
        description: 'معرفی مشتری دیگر، اینستاگرام، محله و...',
      },
      {
        key: 'special_considerations',
        label: 'ملاحظات و اولویت‌های تصمیم‌گیری',
        type: 'textarea',
        group: 'customer',
        section: 'customer',
      },
    ],
  },
}
