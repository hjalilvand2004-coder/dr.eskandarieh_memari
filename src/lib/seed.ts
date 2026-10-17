/**
 * Seed اولیه سامانه — فقط داده نمایشی برچسب‌دار + محتوای پژوهشی پایه
 * هیچ عدد میدانی واقعی جعل نمی‌شود؛ فایل آب‌وهوایی و موتور شبیه‌سازی «پیکربندی‌نشده» ثبت می‌شوند.
 */
import { db } from "@/lib/db";
import { generateDemoFabric, demoAnalysisRows } from "@/lib/science/demo";
import { polygonCentroid, polygonArea } from "@/lib/science/morphology";

export async function seedIfEmpty(): Promise<{ seeded: boolean }> {
  const existing = await db.project.count();
  if (existing > 0) return { seeded: false };

  const fabric = generateDemoFabric(1403);
  const rows = demoAnalysisRows(fabric);

  // ── پروژه و پرسش‌های پژوهش ──
  await db.project.create({
    data: {
      title: "تبیین الگوهای ریخت‌شناسی در بافت تاریخی با تأکید بر کارایی انرژی",
      subtitle: "نمونه پژوهشی: بافت تاریخی شهر شیراز",
      researchTopic: "ریخت‌شناسی شهری، معماری بافت تاریخی، کارایی انرژی",
      goal:
        "تبیین رابطه الگوهای ریخت‌شناختی بافت تاریخی با کارایی انرژی و استخراج الگوهای قابل توصیه در چارچوب حفاظت میراثی.",
      scope:
        "بافت تاریخی شیراز — محدوده مطالعاتی نهایی پس از برداشت میدانی مشخص می‌شود. داده‌های فعلی سامانه نمایشی هستند.",
      status: "active",
    },
  });

  await db.researchQuestion.createMany({
    data: [
      {
        code: "Q1",
        text: "الگوهای ریخت‌شناختی غالب در بافت تاریخی شیراز کدام‌اند و چگونه قابل طبقه‌بندی‌اند؟",
        rationale: "پایه تبیین؛ شناسایی تیپ‌ها پیش از تحلیل عملکردی.",
        priority: "main",
      },
      {
        code: "Q2",
        text: "کدام متغیرهای ریخت‌شناختی بیشترین ارتباط آماری را با شاخص‌های تقاضای انرژی دارند؟",
        rationale: "پل میان ریخت‌شناسی و کارایی انرژی.",
        priority: "main",
      },
      {
        code: "Q3",
        text: "کدام تیپ‌های ریخت‌شناختی در چارچوب ضوابط حفاظت، بیشترین ظرفیت بهبود کارایی انرژی را دارند؟",
        rationale: "خروجی تصمیم‌یار رساله.",
        priority: "main",
      },
      {
        code: "Q2-1",
        text: "آیا نسبت بازشو به دیوار (WWR) پس از کنترل کیفیت پوسته، همچنان پیش‌بین معنادار تقاضای سرمایش است؟",
        rationale: "زیرپرسش تحلیلی Q2.",
        priority: "sub",
      },
    ],
  });

  await db.hypothesis.createMany({
    data: [
      {
        code: "H1",
        text: "تیپ‌های ریخت‌شناختی حیاط‌مرکز در مقایسه با تیپ‌های خطی، الگوی متفاوت و کمتر فشرده‌ای از تقاضای انرژی نشان می‌دهند.",
        linkedQuestionCode: "Q1",
        status: "under_test",
        note: "آزمون اولیه با خوشه‌بندی و مقایسه پروفایل تیپ‌ها — بر داده نمایشی تا تکمیل برداشت واقعی.",
      },
      {
        code: "H2",
        text: "کیفیت پوسته و نسبت بازشو، پس از کنترل اندازه بنا، پیش‌بین‌های معنادار تقاضای انرژی‌اند.",
        linkedQuestionCode: "Q2",
        status: "under_test",
        note: "آزمون با رگرسیون چندمتغیره و تفکیک گروهی بر پایه بلوک.",
      },
      {
        code: "H3",
        text: "بهبودهای کم‌مداخله پوسته‌ای بیشترین کاهش انرژی به‌ازای کمترین تعارض حفاظتی را فراهم می‌کنند.",
        linkedQuestionCode: "Q3",
        status: "proposed",
        note: "نیازمند سناریوسازی و در نهایت شبیه‌سازی واقعی؛ فعلاً فقط برآورد مدل جانشین.",
      },
    ],
  });

  await db.chapter.createMany({
    data: [
      { order: 1, title: "کلیات پژوهش", description: "بیان مسئله، اهمیت، اهداف و پرسش‌ها", status: "done", progress: 100 },
      { order: 2, title: "مبانی نظری و پیشینه", description: "ریخت‌شناسی شهری، آسایش و انرژی، معماری بافت تاریخی شیراز", status: "in_progress", progress: 60 },
      { order: 3, title: "روش‌شناسی پژوهش", description: "چارچوب تحلیل، متغیرها، داده‌ها و مدل‌ها", status: "in_progress", progress: 45 },
      { order: 4, title: "تحلیل ریخت‌شناختی بافت", description: "اطلس مکانی و شاخص‌ها", status: "draft", progress: 25 },
      { order: 5, title: "تحلیل انرژی و اعتبارسنجی مدل", description: "مدل‌سازی، ارزیابی و عدم‌قطعیت", status: "draft", progress: 15 },
      { order: 6, title: "نتیجه‌گیری و پیشنهادها", description: "الگوها، توصیه‌ها و محدودیت‌ها", status: "draft", progress: 5 },
    ],
  });

  await db.task.createMany({
    data: [
      { title: "تهیه فهرست نهایی محدوده مطالعاتی و مجوزهای دسترسی", column: "todo", priority: "high", chapterId: null, dueDate: "۱۴۰۵/۰۲/۱۵" },
      { title: "برداشت میدانی عرض گذرها و ارتفاع بناهای نمونه", column: "todo", priority: "high", chapterId: null, dueDate: "۱۴۰۵/۰۳/۰۱" },
      { title: "جمع‌آوری نقشه‌های پایه و هم‌ترازسازی مختصات (CRS)", column: "todo", priority: "medium", chapterId: null, dueDate: "۱۴۰۵/۰۲/۳۰" },
      { title: "تدوین بخش پیشینه ریخت‌شناسی شهری", column: "doing", priority: "high", chapterId: null, dueDate: "۱۴۰۵/۰۱/۲۵" },
      { title: "نهایی‌سازی فرهنگ داده و پروتکل ورود داده", column: "doing", priority: "medium", chapterId: null, dueDate: "۱۴۰۵/۰۲/۱۰" },
      { title: "پیکربندی موتور شبیه‌سازی انرژی (EnergyPlus) و فایل EPW شیراز", column: "todo", priority: "high", chapterId: null, dueDate: "۱۴۰۵/۰۴/۰۱" },
      { title: "بازبینی نتایج خوشه‌بندی اولیه با استاد راهنما", column: "review", priority: "medium", chapterId: null, dueDate: "۱۴۰۵/۰۲/۲۰" },
      { title: "استقرار سامانه تحلیل و مستندسازی مسیر داده", column: "done", priority: "high", chapterId: null, dueDate: "۱۴۰۵/۰۱/۱۰" },
    ],
  });

  await db.note.createMany({
    data: [
      {
        kind: "decision",
        title: "تصمیم روش‌شناختی: تفکیک گروهی به‌جای تفکیک تصادفی",
        body:
          "به دلیل خودهمبستگی فضایی بناهای یک بلوک، تفکیک آموزش/آزمون به‌صورت گروهی بر پایه بلوک انجام می‌شود تا نشت اطلاعات کنترل شود. این تصمیم باید در فصل روش مستند شود.",
      },
      {
        kind: "limitation",
        title: "محدودیت فعلی: نبود داده میدانی",
        body:
          "همه مقادیر انرژی و برخی متغیرهای ریخت‌شناختی فعلی «نمایشی» هستند. تا تکمیل برداشت میدانی و ورود داده واقعی، هیچ نتیجه‌ای قابل استناد نیست.",
      },
      {
        kind: "methodological",
        title: "قرارداد علامت NMBE",
        body:
          "NMBE = Σ(y − ŷ) / Σ(y) × 100؛ مقدار مثبت به معنای کم‌برآوردی مدل است. این قرارداد در همه گزارش‌های سامانه یکسان نگه داشته می‌شود.",
      },
    ],
  });

  // ── منابع واقعی (با یادآوری بازبینی کتاب‌شناختی) ──
  await db.reference.createMany({
    data: [
      {
        kind: "book",
        title: "سبک‌شناسی معماری ایرانی: بررسی تحلیلی عناصر تشکیل‌دهنده معماری ایرانی در گذشته",
        authors: "پی‌نیا، محمدکریم",
        year: "—",
        venue: "تهران: سروش (چاپ‌های متعدد)",
        doiOrUrl: "",
        note: "سال و ناشر دقیق مطابق نسخه در دسترس، پیش از استناد نهایی ثبت شود.",
      },
      {
        kind: "book",
        title: "Design with Climate: Bioclimatic Approach to Architectural Regionalism",
        authors: "Olgyay, Victor",
        year: "1963",
        venue: "Princeton University Press",
        doiOrUrl: "",
        note: "منبع کلاسیک اقلیم‌گرایی.",
      },
      {
        kind: "standard",
        title: "ASHRAE Guideline 14: Measurement of Energy, Demand, and Water Savings",
        authors: "ASHRAE",
        year: "2014",
        venue: "Atlanta: ASHRAE",
        doiOrUrl: "",
        note: "مرجع رایج آستانه‌های کالیبراسیون (NMBE/CV(RMSE)) — نسخه و بند دقیق مستند شود.",
      },
      {
        kind: "article",
        title: "Energy consumption and urban texture: Evidence from the office building stock",
        authors: "Ratti, C.; Baker, N.; Steemers, K.",
        year: "2005",
        venue: "Energy and Buildings, 37(7)",
        doiOrUrl: "",
        note: "ارتباط بافت شهری و انرژی — پیش از استناد، مشخصات نهایی از پایگاه ناشر بررسی شود.",
      },
      {
        kind: "book",
        title: "House Form and Culture",
        authors: "Rapoport, Amos",
        year: "1969",
        venue: "Prentice-Hall",
        doiOrUrl: "",
        note: "",
      },
      {
        kind: "book",
        title: "The Image of the City",
        authors: "Lynch, Kevin",
        year: "1960",
        venue: "MIT Press",
        doiOrUrl: "",
        note: "",
      },
      {
        kind: "tool",
        title: "EnergyPlus — Building energy simulation engine (DOE)",
        authors: "U.S. Department of Energy",
        year: "نسخه‌های جاری",
        venue: "energyplus.net",
        doiOrUrl: "https://energyplus.net",
        note: "اتصال به موتور هنوز پیکربندی نشده است.",
      },
    ],
  });

  // ── موجودیت‌های فضایی ──
  const blockRows = fabric.blocks.map((b) => {
    const c = polygonCentroid(b.geometry);
    return {
      code: b.code,
      kind: "block",
      name: b.name,
      geometry: JSON.stringify(b.geometry),
      centroidX: c[0],
      centroidY: c[1],
      props: JSON.stringify({
        passageWidthM: b.passageWidthM,
        vegetationFraction: b.vegetationFraction,
        permeableFraction: b.permeableFraction,
        areaM2: Math.round(polygonArea(b.geometry)),
      }),
      demo: true,
    };
  });
  await db.spatialEntity.createMany({ data: blockRows });

  const buildingRows = fabric.buildings.map((b) => {
    const c = polygonCentroid(b.polygon);
    return {
      code: b.code,
      kind: "building",
      name: b.name,
      parentId: b.blockCode,
      blockName: b.blockCode,
      geometry: JSON.stringify(b.polygon),
      centroidX: c[0],
      centroidY: c[1],
      props: JSON.stringify({
        heightM: b.heightM,
        floors: b.floors,
        era: b.era,
        material: b.material,
        condition: b.condition,
        wwrPct: b.wwrPct,
        envelopeQuality: b.envelopeQuality,
        protectiveStatus: b.protectiveStatus,
        courtyard: b.courtyard,
      }),
      demo: true,
    };
  });
  await db.spatialEntity.createMany({ data: buildingRows });

  // ── مجموعه داده‌ها ──
  await db.dataset.createMany({
    data: [
      {
        name: "ریخت‌شناسی و انرژی بناهای نمونه (نمایشی)",
        kind: "csv",
        origin: "synthetic_demo",
        source: "تولید صوری داخلی سامانه — مولد داده نمایشی (seed=1403)",
        license: "داده نمایشی داخلی — استناد ممنوع",
        scale: "building",
        crs: "مختصات متر محلی (بدون CRS واقعی)",
        units: "m، m²، kWh/m²·سال، درصد",
        timeRange: "—",
        timeResolution: "سالانه (نمایشی)",
        missingPolicy: "بدون مقدار گمشده در نسخه نمایشی",
        qualityNote: "داده نمایشی ـ فاقد اعتبار برای استناد علمی",
        uncertainty: "نامعلوم — داده صوری",
        enteredBy: "سیستم (seed اولیه)",
        rowCount: rows.length,
        variables: JSON.stringify([
          { key: "code", label: "شناسه بنا", unit: "—", type: "identifier" },
          { key: "block", label: "بلوک/محله", unit: "—", type: "categorical" },
          { key: "heightM", label: "ارتفاع بنا", unit: "m", type: "numeric" },
          { key: "floors", label: "تعداد طبقات", unit: "طبقه", type: "integer" },
          { key: "wwrPct", label: "نسبت بازشو به دیوار", unit: "%", type: "numeric" },
          { key: "envelopeQuality", label: "کیفیت پوسته (۱ تا ۵)", unit: "درجه", type: "ordinal" },
          { key: "footprintM2", label: "سطح اشغال", unit: "m²", type: "numeric" },
          { key: "courtyardShare", label: "دارای حیاط مرکزی (۰/۱)", unit: "—", type: "binary" },
          { key: "heating", label: "تقاضای گرمایش ویژه (نمایشی)", unit: "kWh/m²·a", type: "numeric" },
          { key: "cooling", label: "تقاضای سرمایش ویژه (نمایشی)", unit: "kWh/m²·a", type: "numeric" },
          { key: "total", label: "تقاضای کل ویژه (نمایشی)", unit: "kWh/m²·a", type: "numeric" },
          { key: "comfortHoursOut", label: "ساعات خارج از آسایش (نمایشی)", unit: "h/a", type: "numeric" },
        ]),
        data: JSON.stringify(rows),
      },
      {
        name: "سری کالیبراسیون اندازه‌گیری ↔ شبیه‌سازی (نمایشی)",
        kind: "simulation_output",
        origin: "synthetic_demo",
        source: "تولید صوری داخلی — معادل‌سازی مفهومی برای نمایش مسیر کالیبراسیون",
        license: "داده نمایشی داخلی",
        scale: "neighborhood",
        crs: "—",
        units: "kWh",
        timeRange: "۱۶ دوره نمایشی",
        timeResolution: "دوره‌ای (نمایشی)",
        missingPolicy: "بدون مقدار گمشده",
        qualityNote: "داده نمایشی ـ معادل اندازه‌گیری واقعی نیست",
        uncertainty: "نامعلوم",
        enteredBy: "سیستم (seed اولیه)",
        rowCount: fabric.calibration.length,
        variables: JSON.stringify([
          { key: "period", label: "دوره", unit: "—", type: "categorical" },
          { key: "measuredKwh", label: "اندازه‌گیری معادل (نمایشی)", unit: "kWh", type: "numeric" },
          { key: "simulatedKwh", label: "شبیه‌سازی معادل (نمایشی)", unit: "kWh", type: "numeric" },
        ]),
        data: JSON.stringify(fabric.calibration),
      },
    ],
  });

  // ── آب‌وهوا و شبیه‌سازی: صادقانه پیکربندی‌نشده ──
  await db.weatherFile.create({
    data: {
      name: "فایل آب‌وهوایی شیراز — متصل نشده",
      location: "شیراز (نیازمند بارگذاری EPW توسط پژوهشگر)",
      latitude: null,
      longitude: null,
      elevation: null,
      tz: "Asia/Tehran",
      periodYears: null,
      origin: "unconfigured",
      note:
        "هیچ داده اقلیمی جعل نشده است. فایل EPW معتبر شیراز (ترجیحاً TMYx یا منبع معتبر) را در ماژول پایگاه داده بارگذاری کنید.",
    },
  });

  await db.simulationModel.create({
    data: {
      name: "مدل پایه بافت نمایشی",
      engine: "unconfigured",
      geometrySrc: "موجودیت‌های فضایی نمایشی سامانه",
      materials: JSON.stringify({ status: "unconfigured", note: "پیکره مصالح پس از برداشت میدانی ثبت می‌شود." }),
      schedules: JSON.stringify({ status: "unconfigured" }),
      hvac: JSON.stringify({ status: "unconfigured" }),
      status: "draft",
      note: "اتصال موتور شبیه‌سازی هنوز پیکربندی نشده است. هیچ خروجی انرژی واقعی تولید نمی‌شود.",
    },
  });

  await db.experimentRun.create({
    data: {
      modelId: null,
      label: "اجرای پایه — انرژی سالانه بافت نمایشی",
      matrix: JSON.stringify({ engine: "EnergyPlus", status: "blocked", reason: "engine_unconfigured" }),
      status: "blocked",
      engine: "EnergyPlus",
      errorMessage: "اتصال موتور شبیه‌سازی هنوز پیکربندی نشده است.",
      reproducibility: JSON.stringify({ note: "پس از اتصال موتور، نسخه مدل و پارامترها اینجا ثبت می‌شود." }),
    },
  });

  // ── سناریوها ──
  await db.scenario.createMany({
    data: [
      {
        name: "بهبود پوسته و بازشوها (کم‌مداخله)",
        category: "envelope",
        description: "افزایش درجه کیفیت پوسته در بناهای با کیفیت ۳ یا کمتر و کاهش نسبی WWR در چارچوب ضوابط نمای تاریخی.",
        params: JSON.stringify({ envelopeQualityDelta: 1, wwrRelativeDelta: -0.2, scope: "envelopeQuality<=3" }),
        heritageConstraint: "محدود به بازشوهای غیراصیل یا بازسازي‌شده؛ تایید کارشناس میراث الزامی است.",
        objectives: JSON.stringify(["کاهش تقاضای انرژی", "حداقل مداخله"]),
        status: "defined",
      },
      {
        name: "سایه‌بان و کنترل تابش",
        category: "shading",
        description: "افزایش سایه‌اندازی روی بازشوهای جنوب و غرب؛ کاهش نسبت تابش مؤثر.",
        params: JSON.stringify({ wwrRelativeDelta: -0.15, scope: "all" }),
        heritageConstraint: "سایه‌بان‌های قابل برگشت و هماهنگ با نما.",
        objectives: JSON.stringify(["کاهش سرمایش", "بهبود آسایش"]),
        status: "defined",
      },
      {
        name: "بهبود بهره‌برداری (بدون مداخله فیزیکی)",
        category: "operation",
        description: "تنظیم برنامه بهره‌برداری و تهویه طبیعی شبانه؛ بدون تغییر بنا.",
        params: JSON.stringify({ operationComfortDelta: -0.12 }),
        heritageConstraint: "بدون تعارض حفاظتی.",
        objectives: JSON.stringify(["کاهش انرژی", "قابل برگشت کامل"]),
        status: "defined",
      },
      {
        name: "افزایش پوشش گیاهی حیاط‌ها",
        category: "vegetation",
        description: "افزایش پوشش گیاهی و سطوح نفوذپذیر در حیاط‌های مرکزی.",
        params: JSON.stringify({ vegetationDelta: 0.1, scope: "courtyards" }),
        heritageConstraint: "گونه‌های بومی و سازگار با بافت تاریخی.",
        objectives: JSON.stringify(["بهبود خرداقلیم", "کاهش دمای سطح"]),
        status: "defined",
        evaluationNote: "برآورد کمّی این سناریو نیازمند مدل خرداقلیم (مثلاً ENVI-met) است؛ بدون آن هیچ عددی تولید نمی‌شود.",
      },
    ],
  });

  // ── اسناد دستیار پژوهشی ──
  await db.document.createMany({
    data: [
      {
        title: "روش‌شناسی شاخص‌های ریخت‌شناختی",
        section: "فرهنگ شاخص‌ها",
        kind: "indicator",
        content:
          "شاخص‌های ریخت‌شناختی سامانه شامل نسبت ارتفاع به عرض گذر (H/W)، جهت‌گیری، سطح اشغال، نسبت پوسته به حجم (S/V)، فشردگی (گرِویل)، سهم حیاط، نسبت بازشو به دیوار (WWR)، ناهمگونی خط آسمان (CV ارتفاع)، دیوار مشترک و پوشش گیاهی است. هر شاخص فقط در صورت وجود داده کافی محاسبه می‌شود؛ شاخص سایه و دسترسی خورشیدی تا اتصال موتور تابش محاسبه نمی‌گردد. تعریف و فرمول هر شاخص در ماژول اطلس مکانی در دسترس است.",
      },
      {
        title: "پروتکل کیفیت داده",
        section: "پایگاه داده",
        kind: "data",
        content:
          "هر مجموعه داده باید منبع، تاریخ، مجوز، مقیاس مکانی، دستگاه مختصات، واحد متغیرها، بازه زمانی، مقادیر گمشده، عدم‌قطعیت و نوع داده (مشاهده‌شده، شبیه‌سازی‌شده، پیش‌بینی‌شده یا نمایشی) را ثبت کند. داده خام هرگز اصلاح یا حذف نمی‌شود؛ پردازش نسخه جدید می‌سازد و پیش از ورود نهایی، گزارش کیفیت برای تأیید پژوهشگر نمایش داده می‌شود.",
      },
      {
        title: "کنترل نشت داده در مدل‌سازی",
        section: "آزمایشگاه علم داده",
        kind: "method",
        content:
          "پیش‌پردازش (استانداردسازی) فقط با داده آموزش برازش می‌شود. تفکیک آموزش/آزمون گروهی و بر پایه بلوک است تا خودهمبستگی فضایی موجب نشت نشود. تنظیم ابرپارامترها هرگز با مجموعه آزمون انجام نمی‌شود. برای هر اجرا، seed، فهرست ویژگی‌ها، نسخه داده و نسخه مدل ثبت می‌گردد.",
      },
      {
        title: "وضعیت موتور شبیه‌سازی",
        section: "آزمایشگاه شبیه‌سازی",
        kind: "policy",
        content:
          "اتصال موتور شبیه‌سازی (EnergyPlus / Ladybug-Honeybee / ENVI-met) هنوز پیکربندی نشده است. تا پیکربندی، هیچ خروجی شبیه‌سازی واقعی تولید یا نمایش داده نمی‌شود و مقادیر انرژی موجود صرفاً «نمایشی» و فاقد اعتبار علمی‌اند. برای پیکربندی، فایل EPW معتبر شیراز و مشخصات مصالح و بهره‌برداری لازم است.",
      },
      {
        title: "چارچوب حفاظت میراثی",
        section: "سناریوسازی",
        kind: "policy",
        content:
          "سناریوهای مداخله باید در محدوده ضوابط حفاظت بافت تاریخی تعریف شوند: اصالت تاریخی به امتیاز ساختگی تقلیل نمی‌یابد و محدودیت‌ها از اسناد رسمی و نظر متخصص دریافت می‌شود. راهکارهای پیشنهادی سامانه «گزینه پژوهشی» هستند، نه مجوز مداخله در میراث. مداخلات قابل برگشت و کم‌مداخله در اولویت ارزیابی‌اند.",
      },
      {
        title: "تفکیک مفاهیم انرژی",
        section: "ارزیابی و اعتبارسنجی",
        kind: "method",
        content:
          "تقاضای انرژی (demand)، مصرف نهایی (final energy)، انرژی اولیه (primary energy) و آسایش حرارتی مفاهیم متفاوتی‌اند و در سامانه از هم تفکیک می‌شوند. شاخص‌های کالیبراسیون NMBE و CV(RMSE) بر پایه Guideline 14 رایج‌اند؛ اما هر آستانه باید با نسخه استاندارد، بازه زمانی و نوع داده مستند شود و به‌عنوان معیار قطعی مطلق ارائه نمی‌گردد.",
      },
      {
        title: "راهنمای استودیو نمودار",
        section: "استودیو نمودار",
        kind: "help",
        content:
          "برای هر شکل علمی، سامانه داده پشت نمودار، منبع داده، روش تولید، تاریخ و نسخه تحلیل و کپشن پیشنهادی ارائه می‌دهد. خروجی PNG با وضوح چاپ و SVG ممکن است. از محورهای گمراه‌کننده و رنگ بدون راهنما پرهیز شود؛ پالت پیش‌فرض سازگار با اختلال دید رنگ است.",
      },
      {
        title: "نقشه ارتباطات پژوهش",
        section: "میز پژوهش",
        kind: "method",
        content:
          "زنجیره پژوهش سامانه از پرسش پژوهش شروع می‌شود، به متغیر، داده، روش، آزمایش، نتیجه و فصل رساله می‌رسد. هر نتیجه باید به داده ورودی، نسخه پردازش، پارامترها، روش و نسخه نرم‌افزار قابل ردیابی باشد. این زنجیره در نمودار تعاملی میز پژوهش نمایش داده می‌شود.",
      },
    ],
  });

  // ── رویدادهای ممیزی ──
  await db.auditEvent.createMany({
    data: [
      { actor: "سیستم", action: "seed_initial", target: "database", detail: "مقداردهی اولیه با داده نمایشی برچسب‌دار انجام شد." },
      { actor: "سیستم", action: "engine_status", target: "simulation", detail: "موتور شبیه‌سازی به‌صورت عمدی پیکربندی‌نشده ثبت شد." },
    ],
  });

  return { seeded: true };
}
