"use client";

/**
 * ResearchFlow — دیاگرام ساختاری زنجیره پژوهش با React Flow (@xyflow/react)
 * زنجیره: پرسش ← فرضیه ← متغیر ← داده ← روش ← آزمایش ← نتیجه ← فصل
 * - گره‌های واقعی (پرسش/فرضیه/فصل) از داده پروژه ساخته می‌شوند
 * - چیدمان لایه‌ای راست‌به‌چپ (RTL) با فاصله‌گذاری قطعی و بازتولیدپذیر
 * - تعاملی: جابه‌جایی گره، بزرگ‌نمایی، مینی‌مپ — تم‌آگاه با متغیرهای CSS
 */
import * as React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface BootstrapShape {
  questions: Array<{ id: string; code: string; text: string }>;
  hypotheses: Array<{ id: string; code: string; status: string; linkedQuestionCode?: string | null }>;
  chapters: Array<{ id: string; order: number; title: string }>;
}

const LAYER_COLORS = ["#1f4e6e", "#8b5d76", "#17877d", "#b4693b", "#d9a441", "#7a8c5c", "#0072B2", "#b4693b"];

type FlowNodeData = {
  label: string;
  sub?: string;
  layer: number;
};

const nodeStyle = (layer: number): React.CSSProperties => ({
  background: "var(--card)",
  color: "var(--card-foreground)",
  border: `1.5px solid ${LAYER_COLORS[layer % LAYER_COLORS.length]}`,
  borderRadius: 12,
  fontFamily: "Vazirmatn",
  fontSize: 10.5,
  padding: "6px 10px",
  boxShadow: "0 2px 10px rgb(0 0 0 / 0.08)",
  width: 150,
});

export default function ResearchFlow({ data }: { data: BootstrapShape }) {
  // ── ساخت گره‌ها و یال‌ها از داده واقعی پروژه ──
  const { initialNodes, initialEdges } = React.useMemo(() => {
    const nodes: Node<FlowNodeData>[] = [];
    const edges: Edge[] = [];
    // لایه‌ها از راست (0) به چپ
    const COL_W = 235;
    const ROW_H = 86;
    const xOf = (layer: number, totalLayers: number) => (totalLayers - 1 - layer) * COL_W;

    const addLayer = (layer: number, total: number, items: Array<{ id: string; label: string; sub?: string }>) => {
      const h = (items.length - 1) * ROW_H;
      items.forEach((it, i) => {
        nodes.push({
          id: it.id,
          type: "default",
          position: { x: xOf(layer, total), y: 300 - h / 2 + i * ROW_H },
          data: { label: it.label, sub: it.sub, layer },
          style: nodeStyle(layer),
        });
      });
    };

    const questions = data.questions.map((q) => ({ id: `q-${q.id}`, label: `❓ ${q.code}`, sub: q.text }));
    const hypotheses = data.hypotheses.map((h) => ({ id: `h-${h.id}`, label: `🧪 ${h.code}`, sub: h.status }));
    const variables = ["ارتفاع بنا", "WWR", "کیفیت پوسته", "سطح اشغال", "حیاط مرکزی"].map((v, i) => ({ id: `v-${i}`, label: v }));
    const methods = [
      { id: "m-1", label: "آمار توصیفی و همبستگی" },
      { id: "m-2", label: "K-Means (k-means++)" },
      { id: "m-3", label: "رگرسیون OLS گروهی" },
    ];
    const results = [
      { id: "r-1", label: "پروفایل تیپ‌ها" },
      { id: "r-2", label: "معیارهای آزمون MAE/RMSE/R²" },
    ];
    const chapters = data.chapters.map((c) => ({ id: `c-${c.id}`, label: `فصل ${c.order}`, sub: c.title }));

    const layers = [questions, hypotheses, variables, [{ id: "d-1", label: "داده نمایشی ریخت‌انرژی", sub: "۵۱ رکورد • نسخه v1" }], methods, results, chapters];
    layers.forEach((items, li) => addLayer(li, layers.length, items));

    // یال‌ها
    data.questions.forEach((q) => {
      data.hypotheses
        .filter((h) => h.linkedQuestionCode === q.code)
        .forEach((h) => edges.push({ id: `e-${q.id}-${h.id}`, source: `q-${q.id}`, target: `h-${h.id}`, style: { stroke: "var(--border)", strokeWidth: 1.4 }, type: "smoothstep" }));
    });
    variables.forEach((v) => edges.push({ id: `e-${v.id}-d1`, source: v.id, target: "d-1", style: { stroke: "var(--border)" }, type: "smoothstep" }));
    // پرسش‌های بدون فرضیه مستقیماً به متغیرها
    data.questions.forEach((q) => {
      const hasHypo = data.hypotheses.some((h) => h.linkedQuestionCode === q.code);
      if (!hasHypo) variables.forEach((v) => edges.push({ id: `e-${q.id}-${v.id}`, source: `q-${q.id}`, target: v.id, style: { stroke: "var(--border)", opacity: 0.5 }, type: "smoothstep" }));
    });
    methods.forEach((m) => edges.push({ id: `e-d1-${m.id}`, source: "d-1", target: m.id, style: { stroke: "var(--border)" }, type: "smoothstep" }));
    methods.forEach((m) => results.forEach((r) => edges.push({ id: `e-${m.id}-${r.id}`, source: m.id, target: r.id, style: { stroke: "var(--border)", opacity: 0.7 }, type: "smoothstep" })));
    results.forEach((r) => chapters.forEach((c) => edges.push({ id: `e-${r.id}-${c.id}`, source: r.id, target: c.id, style: { stroke: "var(--border)", opacity: 0.45 }, type: "smoothstep" })));

    return { initialNodes: nodes, initialEdges: edges };
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  const layerNames = ["پرسش", "فرضیه", "متغیر", "داده", "روش", "نتیجه", "فصل"];

  return (
    <div className="h-[520px] rounded-lg border overflow-hidden" dir="ltr">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1.6}
        proOptions={{ hideAttribution: false }}
        nodesDraggable
        nodesConnectable={false}
        defaultEdgeOptions={{ type: "smoothstep" }}
        colorMode="var"
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--border)" />
        <Controls showInteractive={false} position="bottom-right" />
        <MiniMap pannable zoomable bgColor="var(--muted)" maskColor="color-mix(in srgb, var(--muted) 55%, transparent)" nodeColor={(n) => LAYER_COLORS[((n.data as FlowNodeData)?.layer ?? 0) % LAYER_COLORS.length]} style={{ width: 130, height: 85 }} />
      </ReactFlow>
      <div className="flex flex-wrap gap-2 px-3 py-2 border-t bg-muted/30" dir="rtl">
        {layerNames.map((l, i) => (
          <span key={l} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: LAYER_COLORS[i] }} />
            {l}
          </span>
        ))}
        <span className="text-[10px] text-muted-foreground mr-auto">گره‌های پرسش/فرضیه/فصل از داده واقعی پروژه ساخته می‌شوند • جابه‌جایی گره‌ها آزاد است</span>
      </div>
    </div>
  );
}
