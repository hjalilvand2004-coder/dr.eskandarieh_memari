/**
 * تست محاسبات علمی سامانه — اجرا: bun scripts/test-science.ts
 * اعتبارسنجی: معیارها، OLS، K-Means، تفکیک گروهی، هندسه
 */
import { computeMetrics, describe, pearson } from "../src/lib/science/stats";
import { olsFit, olsPredict, groupSplit } from "../src/lib/science/ols";
import { kmeans } from "../src/lib/science/kmeans";
import { polygonArea, polygonPerimeter, compactness, sharedWallLength } from "../src/lib/science/morphology";
import { generateDemoFabric, demoAnalysisRows } from "../src/lib/science/demo";
import { mulberry32 } from "../src/lib/science/rng";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name} ${detail}`);
  }
}
function approx(a: number, b: number, tol = 1e-6) {
  return Math.abs(a - b) < tol;
}

console.log("── ۱) معیارهای ارزیابی ──");
// حالت دستی: y=[1,2,3], yhat=[1,2,3] → MAE=0, RMSE=0, R2=1
{
  const m = computeMetrics([1, 2, 3], [1, 2, 3]);
  check("پیش‌بینی کامل: MAE=0", approx(m.MAE, 0));
  check("پیش‌بینی کامل: RMSE=0", approx(m.RMSE, 0));
  check("پیش‌بینی کامل: R2=1", m.R2 !== null && approx(m.R2, 1));
  check("پیش‌بینی کامل: NMBE=0", m.NMBE !== null && approx(m.NMBE, 0));
}
{
  // y=[100,200,300,400], yhat=[110,190,310,390]
  const m = computeMetrics([100, 200, 300, 400], [110, 190, 310, 390]);
  // errs = [-10,10,-10,10] → MAE=10, RMSE=10
  check("MAE=10", approx(m.MAE, 10));
  check("RMSE=10", approx(m.RMSE, 10));
  // NMBE = (0)/1000 = 0
  check("NMBE=0 (برآورد بدون سوگیری)", m.NMBE !== null && approx(m.NMBE, 0));
  // CV(RMSE)=10/250*100=4
  check("CV(RMSE)=4%", m.CVRMSE !== null && approx(m.CVRMSE, 4));
  // MAPE = mean(10/100, 10/200, 10/300, 10/400) × 100 ≈ 5.2083
  check("MAPE≈5.21%", m.MAPE !== null && approx(m.MAPE, 5.2083, 1e-3));
}
{
  // کم‌برآوردی: y بزرگ‌تر از yhat → NMBE مثبت
  const m = computeMetrics([10, 20], [5, 10]);
  check("NMBE مثبت برای کم‌برآوردی (قرارداد علامت)", m.NMBE !== null && m.NMBE > 0);
}
{
  // MAPE با مقدار صفر → باید null و دلیل داشته باشد
  const m = computeMetrics([0, 10, 20], [0, 12, 18]);
  check("MAPE=null با مقدار صفر", m.MAPE === null && !!m.mapeExcluded);
}

console.log("── ۲) آمار توصیفی و همبستگی ──");
{
  const d = describe([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  check("میانگین=5.5", approx(d.mean, 5.5));
  check("میانه=5.5", approx(d.median, 5.5));
  check("کمینه=1", approx(d.min, 1));
  check("بیشینه=10", approx(d.max, 10));
  check("پرت=0", d.outliers === 0);
  const r = pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
  check("همبستگی کامل=1", approx(r, 1, 1e-9));
  const r2 = pearson([1, 2, 3], [3, 2, 1]);
  check("همبستگی معکوس=-1", approx(r2, -1, 1e-9));
}

console.log("── ۳) رگرسیون OLS ──");
{
  // y = 3 + 2x (بدون نوفه) — باید دقیقاً بازیابی شود
  const rng = mulberry32(1);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < 30; i++) {
    const x = rng() * 100;
    X.push([x]);
    y.push(3 + 2 * x);
  }
  const model = olsFit(X, y);
  const preds = olsPredict(model, X);
  const maxErr = Math.max(...y.map((v, i) => Math.abs(v - preds[i])));
  check("بازیابی دقیق y=3+2x (حداکثر خطا < 1e-6)", maxErr < 1e-6, `maxErr=${maxErr}`);
  check("R2 آموزش ≈ 1", model.r2Train > 0.999999);
  check("شیب واحد اصلی ≈ 2", approx(model.coefOriginal[0], 2, 1e-6), `coef=${model.coefOriginal[0]}`);
}
{
  // چندمتغیره: y = 10 + 4a - 1.5b
  const rng = mulberry32(7);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < 60; i++) {
    const a = rng() * 50;
    const b = rng() * 30;
    X.push([a, b]);
    y.push(10 + 4 * a - 1.5 * b);
  }
  const model = olsFit(X, y);
  check("ضریب a ≈ 4", approx(model.coefOriginal[0], 4, 1e-5), `=${model.coefOriginal[0]}`);
  check("ضریب b ≈ -1.5", approx(model.coefOriginal[1], -1.5, 1e-5), `=${model.coefOriginal[1]}`);
}

console.log("── ۴) تفکیک گروهی ──");
{
  const groups = ["A", "A", "A", "B", "B", "B", "C", "C", "C", "D", "D", "D"];
  const { trainIdx, testIdx } = groupSplit(groups, 1 / 3, 42);
  const trainGroups = new Set(trainIdx.map((i) => groups[i]));
  const testGroups = new Set(testIdx.map((i) => groups[i]));
  // هیچ گروهی نباید هم در آموزش و هم در آزمون باشد (کنترل نشت)
  const overlap = [...trainGroups].filter((g) => testGroups.has(g));
  check("بدون نشت گروهی (تفکیک کامل بلوک‌ها)", overlap.length === 0);
  check("آزمون = ۴ بلوک × ⅓ ≈ ۱ بلوک", testIdx.length === 3, `testSize=${testIdx.length}`);
  check("بازتولیدپذیری با seed ثابت", JSON.stringify(groupSplit(groups, 1 / 3, 42)) === JSON.stringify({ trainIdx, testIdx }));
}

console.log("── ۵) K-Means ──");
{
  // دو خوشه واضح
  const rng = mulberry32(3);
  const X: number[][] = [];
  for (let i = 0; i < 20; i++) X.push([rng() * 2, rng() * 2]); // خوشه اطراف (1,1)
  for (let i = 0; i < 20; i++) X.push([10 + rng() * 2, 10 + rng() * 2]); // خوشه اطراف (11,11)
  const res = kmeans(X, 2, 42);
  check("Silhouette بالا برای خوشه‌های جداشده (>0.9)", res.silhouette > 0.9, `sil=${res.silhouette}`);
  // اعضای هر خوشه هم‌خوشه‌اند (0-19 و 20-39)
  const first = res.labels[0];
  const consistent = res.labels.slice(0, 20).every((l) => l === first) && res.labels.slice(20).every((l) => l !== first);
  check("تفکیک صحیح دو گروه", consistent);
  check("اندازه خوشه‌ها = 20 و 20", JSON.stringify([...res.clusterSizes].sort()) === JSON.stringify([20, 20]));
  check("بازتولیدپذیری با seed", JSON.stringify(kmeans(X, 2, 42).labels) === JSON.stringify(res.labels));
}

console.log("── ۶) هندسه ──");
{
  const square = [[0, 0], [10, 0], [10, 10], [0, 10]] as [number, number][];
  check("مساحت مربع=100", approx(polygonArea(square), 100));
  check("محیط مربع=40", approx(polygonPerimeter(square), 40));
  check("فشردگی مربع ≈ 0.785", approx(compactness(100, 40), (4 * Math.PI * 100) / 1600), `=${compactness(100, 40)}`);
  // دیوار مشترک: دو مربع کنار هم
  const a: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const b: [number, number][] = [[10, 0], [20, 0], [20, 10], [10, 10]];
  check("دیوار مشترک = 10", approx(sharedWallLength(a, b, 0.9), 10), `=${sharedWallLength(a, b, 0.9)}`);
}

console.log("── ۷) داده نمایشی ──");
{
  const fabric = generateDemoFabric(1403);
  check("۳ بلوک", fabric.blocks.length === 3);
  check("۵۱ بنا (پایداری مولد)", fabric.buildings.length === 51, `n=${fabric.buildings.length}`);
  check("همه بناها انرژی دارند", fabric.energy.length === fabric.buildings.length);
  check("کالیبراسیون = ۱۶ دوره", fabric.calibration.length === 16);
  check("همه ارتفاع‌ها > 2.5", fabric.buildings.every((b) => b.heightM > 2.5));
  check("همه WWR در بازه ۸-۲۴", fabric.buildings.every((b) => b.wwrPct >= 8 && b.wwrPct <= 24));
  const rows = demoAnalysisRows(fabric);
  check("سطرهای تحلیل = بناهای نمونه", rows.length === fabric.buildings.length);
  check("بازتولیدپذیری seed", JSON.stringify(generateDemoFabric(1403).buildings.map((b) => b.code)) === JSON.stringify(fabric.buildings.map((b) => b.code)));
}

console.log(`\nنتیجه: ${pass} موفق، ${fail} ناموفق`);
if (fail > 0) process.exit(1);
