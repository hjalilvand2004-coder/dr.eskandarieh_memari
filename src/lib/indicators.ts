/**
 * کاتالوگ شاخص‌های ریخت‌شناسی (بخش ۴ پرامپت)
 * برای هر شاخص: تعریف، فرمول، واحد، مقیاس، داده لازم، محدودیت و وضعیت داده
 * شاخصی که داده کافی ندارد محاسبه نمی‌شود و صریحاً اعلام می‌گردد.
 */

export type IndicatorStatus = "computed" | "needs_data" | "needs_simulation";

export interface IndicatorMeta {
  key: string;
  title: string;
  definition: string;
  formula: string; // لاتین، با dir=ltr نمایش داده شود
  unit: string;
  scale: "building" | "block" | "district";
  requiredData: string;
  limitation: string;
  status: IndicatorStatus;
  statusNote?: string;
}

export const INDICATOR_CATALOG: IndicatorMeta[] = [
  {
    key: "hw_ratio",
    title: "نسبت ارتفاع به عرض گذر",
    definition:
      "نسبت میانگین ارتفاع بناهای مجاور گذر به عرض آن گذر؛ تعیین‌کننده اصلی بازتابش و پوشش آسمان در گذرها و از تعیین‌کننده‌های خرداقلیم گذر.",
    formula: "H/W = H̄_buildings / W̄_passage",
    unit: "نسبت (بی‌بعد)",
    scale: "block",
    requiredData: "ارتفاع بناهای مجاور گذر، عرض گذر (پلان)",
    limitation: "در گذرهای با عرض متغیر باید مقطع‌گیری در فواصل مشخص انجام شود؛ آثار پیش‌آمادگی و سایه‌بان لحاظ نمی‌شود.",
    status: "computed",
  },
  {
    key: "orientation",
    title: "جهت‌گیری بنا و گذر",
    definition: "زاویه راستای غالب بنا نسبت به محور شرقی−غربی؛ ورودی تابش خورشیدی و رفتار سایه را کنترل می‌کند.",
    formula: "θ = arctan(ΔY / ΔX) · 180/π",
    unit: "درجه",
    scale: "building",
    requiredData: "پلان بنا یا کادر محیطی",
    limitation: "برای بناهای غیرمستطیلی یا چندقسمتی، راستای غالب با PCA هندسی دقیق‌تر است؛ این نسخه از کادر محیطی استفاده می‌کند.",
    status: "computed",
  },
  {
    key: "coverage",
    title: "سطح اشغال و تراکم ساختمانی",
    definition: "نسبت مجموع سطح اشغال بناها به سطح بلوک/قطعه؛ سنجه تراکم بافت و فضای باز.",
    formula: "Coverage = ΣA_footprint / A_block",
    unit: "درصد / نسبت",
    scale: "block",
    requiredData: "پلان بناها و محدوده بلوک",
    limitation: "پیش‌آمادگی‌ها و فضاهای مسقف خارج از پلان اصلی در برداشت ساده لحظه نمی‌شوند.",
    status: "computed",
  },
  {
    key: "sv_ratio",
    title: "نسبت سطح پوسته به حجم",
    definition: "نسبت سطح دربرگیرنده حرارتی بنا به حجم آن؛ هرچه کمتر باشد، شکل بنا از نظر کاهش تعامل حرارتی فشرده‌تر است.",
    formula: "S/V ≈ (P·H + A − A_shared) / (A·H)",
    unit: "۱ بر متر (m⁻¹)",
    scale: "building",
    requiredData: "پلان، ارتفاع، دیوارهای مشترک",
    limitation: "تقریب پلان‌محور است؛ سطح بازشوها، پیش‌آمادگی و سقف شیب‌دار دقیق لحاظ نمی‌شود.",
    status: "computed",
  },
  {
    key: "compactness",
    title: "پیوستگی و فشردگی توده",
    definition: "نسبت مساحت به محیط در قالب ضریب گرِویل؛ سنجه پیچیدگی هندسی پلان.",
    formula: "C = 4πA / P²",
    unit: "بی‌بعد (۰ تا ۱)",
    scale: "building",
    requiredData: "پلان بنا",
    limitation: "دو شکل متفاوت می‌توانند ضریب یکسان داشته باشند؛ به‌تنهایی کافی نیست.",
    status: "computed",
  },
  {
    key: "courtyard",
    title: "ابعاد، تناسبات و سهم حیاط مرکزی",
    definition: "سهم سطح حیاط از کل قطعه و نسبت اضلاع حیاط؛ تعیین‌کننده دیده‌بانی، تابش و تهویه حیاط.",
    formula: "Share = A_courtyard / (A_footprint + A_courtyard) ، AR = L / W",
    unit: "درصد و نسبت",
    scale: "building",
    requiredData: "پلان حیاط و قطعه",
    limitation: "حیاط‌های چندقسمتی یا ناقص نیاز به برداشت تفصیلی‌تر دارند.",
    status: "computed",
  },
  {
    key: "wwr",
    title: "نسبت بازشو به دیوار",
    definition: "نسبت سطح بازشوها به سطح کل دیوارهای خارجی؛ کنترل‌کننده نفوذ تابش و بار سرمایشی/گرمایشی.",
    formula: "WWR = A_glazing / A_wall_gross",
    unit: "درصد",
    scale: "building",
    requiredData: "نقشه بازشوها یا برداشت میدانی نمای‌ها",
    limitation: "در داده نمایشی، برآورد صوری ثبت‌شده است؛ برداشت واقعی از نماهای میدانی الزامی است.",
    status: "computed",
    statusNote: "مقدار در داده نمایشی صوری است — جایگزینی با برداشت میدانی الزامی است.",
  },
  {
    key: "skyline",
    title: "ارتفاع و ناهمگونی خط آسمان",
    definition: "پراکندگی ارتفاع بناها در بلوک (ضریب تغییرات)؛ ناهمگونی بر آشفتگی جریان باد و الگوی سایه اثر می‌گذارد.",
    formula: "CV_H = σ_H / H̄",
    unit: "بی‌بعد",
    scale: "block",
    requiredData: "ارتفاع همه بناهای بلوک",
    limitation: "نمایانگری خط آسمان از دید عابر (نسبت دید باز) نیاز به تحلیل دید دارد.",
    status: "computed",
  },
  {
    key: "adjacency",
    title: "مجاورت و دیوارهای مشترک",
    definition: "طول دیوار مشترک هر بنا با بناهای مجاور؛ کمکننده سطح پوسته در معرض و اثر انباشت حرارتی میان‌بناها.",
    formula: "L_shared = Σ ℓ(لبه‌های مشترک با تلورانس)",
    unit: "متر",
    scale: "building",
    requiredData: "پلان توپولوژیک با دقت مرز مشترک",
    limitation: "تشخیص لبه مشترک با تلورانس هندسی انجام می‌شود؛ مرزهای دقیق کاداستری نیاز است.",
    status: "computed",
  },
  {
    key: "solar_access",
    title: "سایه‌اندازی و دسترسی خورشیدی",
    definition: "ساعات سایه/تابش دریافتی سطوح و حیاط‌ها در طول سال.",
    formula: "— نیازمند شبیه‌سازی تابشی —",
    unit: "ساعت",
    scale: "district",
    requiredData: "هندسه سه‌بعدی + داده آب‌وهوایی (EPW) + موتور محاسبات تابش",
    limitation: "بدون محاسبات تابش معتبر قابل ارائه نیست؛ شاخص جایگزین صوری محاسبه نمی‌شود.",
    status: "needs_simulation",
  },
  {
    key: "vegetation",
    title: "پوشش گیاهی و سطوح نفوذپذیر",
    definition: "سهم سطح پوشش گیاهی و سطوح نفوذپذیر از سطح بلوک؛ مؤثر بر دمای سطح و رواناب.",
    formula: "Veg% = A_veg / A_block ، Perm% = A_perm / A_block",
    unit: "درصد",
    scale: "block",
    requiredData: "لایه پوشش زمین یا برداشت میدانی",
    limitation: "در داده نمایشی مقادیر صوری ثبت شده‌اند؛ لازم است با تفسیر تصاویر هوایی به‌روزرسانی شود.",
    status: "computed",
    statusNote: "مقدار در داده نمایشی صوری است.",
  },
];

export function indicatorByMeta(key: string): IndicatorMeta | undefined {
  return INDICATOR_CATALOG.find((i) => i.key === key);
}
