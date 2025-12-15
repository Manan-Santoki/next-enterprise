"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from "d3-sankey";
import { formatCurrency } from "@/lib/utils/currency";

interface SankeyNodeData {
  id: string;
  name: string;
  color?: string;
}

interface SankeyLinkData {
  source: string;
  target: string;
  value: number;
}

interface SankeyData {
  nodes: SankeyNodeData[];
  links: SankeyLinkData[];
}

interface SankeyDiagramProps {
  fromDate?: string;
  toDate?: string;
  accountIds?: string[];
  type?: "default" | "income-expense";
  title?: string;
  description?: string;
}

export function SankeyDiagram({
  fromDate,
  toDate,
  accountIds,
  type = "default",
  title = "Money Flow",
  description = "Visualize how money flows through your accounts",
}: SankeyDiagramProps) {
  const [data, setData] = useState<SankeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);
        if (accountIds) params.append("accountIds", accountIds.join(","));
        params.append("type", type);

        const response = await fetch(`/api/analytics/sankey?${params}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching sankey data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [fromDate, toDate, accountIds, type]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = Math.max(400, Math.min(800, width * 0.6));
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>No flow data available</p>
            <p className="text-sm mt-2">Upload statements to visualize money flow</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for d3-sankey
  const nodeMap = new Map(data.nodes.map((node, i) => [node.id, i]));

  const sankeyNodes: Array<SankeyNode<SankeyNodeData, SankeyLinkData>> = data.nodes.map(
    (node) => ({
      ...node,
      index: nodeMap.get(node.id)!,
    })
  );

  const sankeyLinks: Array<SankeyLink<SankeyNodeData, SankeyLinkData>> = data.links.map(
    (link) => ({
      ...link,
      source: nodeMap.get(link.source)!,
      target: nodeMap.get(link.target)!,
    })
  );

  // Create sankey generator
  const sankeyGenerator = sankey<SankeyNodeData, SankeyLinkData>()
    .nodeWidth(15)
    .nodePadding(10)
    .extent([
      [10, 10],
      [dimensions.width - 10, dimensions.height - 10],
    ]);

  const { nodes, links } = sankeyGenerator({
    nodes: sankeyNodes,
    links: sankeyLinks,
  });

  // Color palette for nodes
  const getNodeColor = (node: SankeyNode<SankeyNodeData, SankeyLinkData>) => {
    if (node.color) return node.color;
    if (node.id.startsWith("account:")) return "#3b82f6";
    if (node.id.startsWith("income:")) return "#10b981";
    if (node.id.startsWith("expense:")) return "#ef4444";
    if (node.id.startsWith("category:")) return "#8b5cf6";
    return "#6b7280";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent ref={containerRef}>
        <svg width={dimensions.width} height={dimensions.height} className="overflow-visible">
          {/* Links */}
          <g>
            {links.map((link, i) => {
              const path = sankeyLinkHorizontal()(link);
              const sourceColor = getNodeColor(link.source);

              return (
                <g key={i}>
                  <path
                    d={path || ""}
                    fill="none"
                    stroke={sourceColor}
                    strokeOpacity={0.3}
                    strokeWidth={Math.max(1, link.width || 0)}
                  />
                  <title>
                    {link.source.name} → {link.target.name}: {formatCurrency(link.value)}
                  </title>
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((node, i) => {
              const nodeColor = getNodeColor(node);
              const textAnchor = (node.x0 || 0) < dimensions.width / 2 ? "start" : "end";
              const textX =
                (node.x0 || 0) < dimensions.width / 2
                  ? (node.x1 || 0) + 6
                  : (node.x0 || 0) - 6;

              return (
                <g key={i}>
                  <rect
                    x={node.x0}
                    y={node.y0}
                    width={node.x1! - node.x0!}
                    height={node.y1! - node.y0!}
                    fill={nodeColor}
                    fillOpacity={0.8}
                    stroke="#fff"
                    strokeWidth={1}
                  >
                    <title>
                      {node.name}: {formatCurrency(node.value || 0)}
                    </title>
                  </rect>
                  <text
                    x={textX}
                    y={(node.y0! + node.y1!) / 2}
                    dy="0.35em"
                    textAnchor={textAnchor}
                    fontSize={12}
                    fill="#1f2937"
                    className="pointer-events-none"
                  >
                    {node.name}
                  </text>
                  <text
                    x={textX}
                    y={(node.y0! + node.y1!) / 2 + 14}
                    dy="0.35em"
                    textAnchor={textAnchor}
                    fontSize={10}
                    fill="#6b7280"
                    className="pointer-events-none"
                  >
                    {formatCurrency(node.value || 0)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </CardContent>
    </Card>
  );
}
