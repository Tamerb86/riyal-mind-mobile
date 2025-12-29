import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  width?: number;
  height?: number;
  barColor?: string;
  showValues?: boolean;
  showGrid?: boolean;
  horizontal?: boolean;
  title?: string;
  suffix?: string;
}

export default function BarChart({
  data,
  width = SCREEN_WIDTH - 40,
  height = 220,
  barColor = '#10B981',
  showValues = true,
  showGrid = true,
  horizontal = false,
  title,
  suffix = '',
}: BarChartProps) {
  const paddingLeft = horizontal ? 80 : 50;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = horizontal ? 30 : 50;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(...data.map((d) => d.value)) * 1.1;
  const barCount = data.length;

  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  if (horizontal) {
    // Horizontal bar chart
    const barHeight = Math.min(30, (chartHeight - (barCount - 1) * 8) / barCount);
    const barSpacing = (chartHeight - barHeight * barCount) / (barCount - 1);

    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Svg width={width} height={height}>
          <Defs>
            {data.map((d, i) => (
              <LinearGradient key={`grad-${i}`} id={`barGrad-${i}`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor={d.color || barColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={d.color || barColor} stopOpacity="0.7" />
              </LinearGradient>
            ))}
          </Defs>

          {data.map((d, i) => {
            const barWidth = (d.value / maxValue) * chartWidth;
            const y = paddingTop + i * (barHeight + barSpacing);

            return (
              <G key={i}>
                {/* Label */}
                <SvgText
                  x={paddingLeft - 8}
                  y={y + barHeight / 2 + 4}
                  textAnchor="end"
                  fontSize={12}
                  fill="#374151"
                >
                  {d.label}
                </SvgText>
                {/* Bar background */}
                <Rect
                  x={paddingLeft}
                  y={y}
                  width={chartWidth}
                  height={barHeight}
                  rx={barHeight / 2}
                  fill="#F3F4F6"
                />
                {/* Bar */}
                <Rect
                  x={paddingLeft}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={barHeight / 2}
                  fill={`url(#barGrad-${i})`}
                />
                {/* Value */}
                {showValues && (
                  <SvgText
                    x={paddingLeft + barWidth + 8}
                    y={y + barHeight / 2 + 4}
                    textAnchor="start"
                    fontSize={12}
                    fontWeight="600"
                    fill={d.color || barColor}
                  >
                    {formatValue(d.value)}{suffix}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      </View>
    );
  }

  // Vertical bar chart
  const barWidth = Math.min(40, (chartWidth - (barCount - 1) * 12) / barCount);
  const barSpacing = (chartWidth - barWidth * barCount) / (barCount - 1);

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: Math.round(maxValue * ratio),
    y: paddingTop + chartHeight - ratio * chartHeight,
  }));

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={width} height={height}>
        <Defs>
          {data.map((d, i) => (
            <LinearGradient key={`grad-${i}`} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={d.color || barColor} stopOpacity="1" />
              <Stop offset="100%" stopColor={d.color || barColor} stopOpacity="0.6" />
            </LinearGradient>
          ))}
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

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * chartHeight;
          const x = paddingLeft + i * (barWidth + barSpacing);
          const y = paddingTop + chartHeight - barHeight;

          return (
            <G key={i}>
              {/* Bar */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={barWidth / 4}
                fill={`url(#barGrad-${i})`}
              />
              {/* Value on top */}
              {showValues && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight="600"
                  fill={d.color || barColor}
                >
                  {formatValue(d.value)}
                </SvgText>
              )}
              {/* Label */}
              <SvgText
                x={x + barWidth / 2}
                y={height - 12}
                textAnchor="middle"
                fontSize={11}
                fill="#6B7280"
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
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
