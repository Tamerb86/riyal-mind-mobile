import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, G, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  gradientColor?: string;
  showDots?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  title?: string;
  suffix?: string;
}

export default function LineChart({
  data,
  width = SCREEN_WIDTH - 40,
  height = 200,
  color = '#10B981',
  gradientColor,
  showDots = true,
  showGrid = true,
  showLabels = true,
  showValues = false,
  title,
  suffix = '',
}: LineChartProps) {
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values) * 1.1;
  const minValue = Math.min(0, Math.min(...values));

  // Calculate points
  const points = data.map((d, i) => ({
    x: paddingLeft + (i / (data.length - 1)) * chartWidth,
    y: paddingTop + chartHeight - ((d.value - minValue) / (maxValue - minValue)) * chartHeight,
    value: d.value,
    label: d.label,
  }));

  // Create line path
  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  // Create area path for gradient
  const areaPath = `
    ${linePath}
    L ${points[points.length - 1].x} ${paddingTop + chartHeight}
    L ${points[0].x} ${paddingTop + chartHeight}
    Z
  `;

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: Math.round(minValue + (maxValue - minValue) * ratio),
    y: paddingTop + chartHeight - ratio * chartHeight,
  }));

  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={gradientColor || color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={gradientColor || color} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {showGrid &&
          yLabels.map((label, i) => (
            <G key={`grid-${i}`}>
              <Line
                x1={paddingLeft}
                y1={label.y}
                x2={width - paddingRight}
                y2={label.y}
                stroke="#E5E7EB"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={paddingLeft - 8}
                y={label.y + 4}
                textAnchor="end"
                fontSize={10}
                fill="#9CA3AF"
              >
                {formatValue(label.value)}
              </SvgText>
            </G>
          ))}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#gradient)" />

        {/* Line */}
        <Path d={linePath} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {showDots &&
          points.map((p, i) => (
            <G key={`dot-${i}`}>
              <Circle cx={p.x} cy={p.y} r={6} fill="#FFFFFF" stroke={color} strokeWidth={3} />
              {showValues && (
                <G>
                  <Rect
                    x={p.x - 25}
                    y={p.y - 28}
                    width={50}
                    height={20}
                    rx={4}
                    fill={color}
                  />
                  <SvgText
                    x={p.x}
                    y={p.y - 14}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="600"
                    fill="#FFFFFF"
                  >
                    {formatValue(p.value)}{suffix}
                  </SvgText>
                </G>
              )}
            </G>
          ))}

        {/* X-axis labels */}
        {showLabels &&
          points.map((p, i) => (
            <SvgText
              key={`label-${i}`}
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              fontSize={11}
              fill="#6B7280"
            >
              {p.label}
            </SvgText>
          ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'right',
  },
});
