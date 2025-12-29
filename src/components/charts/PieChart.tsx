import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PieChartData {
  name: string;
  value: number;
  color: string;
  icon?: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  innerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

export default function PieChart({
  data,
  size = SCREEN_WIDTH - 80,
  innerRadius = 60,
  showLabels = false,
  showLegend = true,
  centerLabel,
  centerValue,
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  // Calculate pie slices
  let currentAngle = -90; // Start from top
  const slices = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      angle,
    };
  });

  // Convert angle to radians
  const toRadians = (angle: number) => (angle * Math.PI) / 180;

  // Calculate arc path
  const getArcPath = (
    startAngle: number,
    endAngle: number,
    outerRadius: number,
    innerRad: number
  ) => {
    const startOuter = {
      x: centerX + outerRadius * Math.cos(toRadians(startAngle)),
      y: centerY + outerRadius * Math.sin(toRadians(startAngle)),
    };
    const endOuter = {
      x: centerX + outerRadius * Math.cos(toRadians(endAngle)),
      y: centerY + outerRadius * Math.sin(toRadians(endAngle)),
    };
    const startInner = {
      x: centerX + innerRad * Math.cos(toRadians(endAngle)),
      y: centerY + innerRad * Math.sin(toRadians(endAngle)),
    };
    const endInner = {
      x: centerX + innerRad * Math.cos(toRadians(startAngle)),
      y: centerY + innerRad * Math.sin(toRadians(startAngle)),
    };

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `
      M ${startOuter.x} ${startOuter.y}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}
      L ${startInner.x} ${startInner.y}
      A ${innerRad} ${innerRad} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}
      Z
    `;
  };

  // Get label position
  const getLabelPosition = (startAngle: number, endAngle: number) => {
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = radius * 0.7;
    return {
      x: centerX + labelRadius * Math.cos(toRadians(midAngle)),
      y: centerY + labelRadius * Math.sin(toRadians(midAngle)),
    };
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G>
          {slices.map((slice, index) => (
            <Path
              key={index}
              d={getArcPath(slice.startAngle, slice.endAngle, radius, innerRadius)}
              fill={slice.color}
            />
          ))}
          {/* Center circle for donut effect */}
          <Circle cx={centerX} cy={centerY} r={innerRadius - 5} fill="#FFFFFF" />
          {/* Center text */}
          {centerLabel && (
            <>
              <SvgText
                x={centerX}
                y={centerY - 8}
                textAnchor="middle"
                fontSize={12}
                fill="#6B7280"
              >
                {centerLabel}
              </SvgText>
              <SvgText
                x={centerX}
                y={centerY + 16}
                textAnchor="middle"
                fontSize={20}
                fontWeight="bold"
                fill="#1F2937"
              >
                {centerValue}
              </SvgText>
            </>
          )}
          {/* Labels on slices */}
          {showLabels &&
            slices.map((slice, index) => {
              if (slice.percentage < 5) return null; // Skip small slices
              const pos = getLabelPosition(slice.startAngle, slice.endAngle);
              return (
                <SvgText
                  key={`label-${index}`}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight="600"
                  fill="#FFFFFF"
                >
                  {Math.round(slice.percentage)}%
                </SvgText>
              );
            })}
        </G>
      </Svg>

      {/* Legend */}
      {showLegend && (
        <View style={styles.legend}>
          {slices.map((slice, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: slice.color }]} />
              <Text style={styles.legendIcon}>{slice.icon || ''}</Text>
              <Text style={styles.legendName}>{slice.name}</Text>
              <Text style={styles.legendPercentage}>{Math.round(slice.percentage)}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  legend: {
    marginTop: 20,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginLeft: 8,
  },
  legendIcon: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  legendName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    textAlign: 'right',
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 40,
    textAlign: 'left',
  },
});
