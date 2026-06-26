import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../config/theme.dart';

class JourneyBarChart extends StatelessWidget {
  final List<Map<String, dynamic>> data;
  const JourneyBarChart({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const Center(child: Text('No data'));
    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY: data.map((d) => (d['count'] as num).toDouble()).reduce((a, b) => a > b ? a : b) * 1.2,
        barTouchData: BarTouchData(enabled: true),
        titlesData: FlTitlesData(
          show: true,
          bottomTitles: AxisTitles(sideTitles: SideTitles(
            showTitles: true,
            getTitlesWidget: (v, _) {
              final i = v.toInt();
              if (i < 0 || i >= data.length) return const SizedBox.shrink();
              final label = (data[i]['status'] ?? '').toString();
              return Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(label.length > 6 ? '${label.substring(0, 6)}.' : label, style: const TextStyle(fontSize: 9)),
              );
            },
          )),
          leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30, getTitlesWidget: (v, _) => Text('${v.toInt()}', style: const TextStyle(fontSize: 10)))),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        barGroups: List.generate(data.length, (i) => BarChartGroupData(
          x: i,
          barRods: [BarChartRodData(toY: (data[i]['count'] as num).toDouble(), color: OncoAITheme.primary, width: 14, borderRadius: const BorderRadius.vertical(top: Radius.circular(4)))],
        )),
      ),
    );
  }
}

class CancerPieChart extends StatelessWidget {
  final List<Map<String, dynamic>> data;
  const CancerPieChart({super.key, required this.data});

  static const _colors = [OncoAITheme.primary, OncoAITheme.secondary, OncoAITheme.warning, OncoAITheme.danger, OncoAITheme.success, OncoAITheme.info, Colors.purple, Colors.orange];

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const Center(child: Text('No data'));
    final total = data.fold<double>(0, (sum, d) => sum + (d['count'] as num).toDouble());

    return Row(
      children: [
        Expanded(
          child: PieChart(PieChartData(
            sections: List.generate(data.length, (i) => PieChartSectionData(
              value: (data[i]['count'] as num).toDouble(),
              color: _colors[i % _colors.length],
              title: '${((data[i]['count'] as num) / total * 100).toStringAsFixed(0)}%',
              titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
              radius: 60,
            )),
            centerSpaceRadius: 30,
            sectionsSpace: 2,
          )),
        ),
        const SizedBox(width: 12),
        Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: List.generate(data.length.clamp(0, 6), (i) => Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(children: [
              Container(width: 10, height: 10, decoration: BoxDecoration(color: _colors[i % _colors.length], borderRadius: BorderRadius.circular(2))),
              const SizedBox(width: 6),
              Text('${data[i]['type']}', style: const TextStyle(fontSize: 11)),
            ]),
          )),
        ),
      ],
    );
  }
}
