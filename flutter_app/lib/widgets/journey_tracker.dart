import 'package:flutter/material.dart';
import '../config/theme.dart';

class JourneyTracker extends StatelessWidget {
  final String currentStatus;
  const JourneyTracker({super.key, required this.currentStatus});

  static const _steps = [
    'arrival', 'evaluation', 'biopsy', 'awaiting_results', 'case_compiled',
    'tb_scheduled', 'tb_presented', 'treatment_plan', 'awaiting_treatment', 'in_treatment',
  ];
  static const _labels = [
    'Arrival', 'Evaluation', 'Biopsy', 'Results', 'Compiled',
    'TB Sched', 'TB Done', 'Plan', 'Awaiting', 'Treatment',
  ];

  @override
  Widget build(BuildContext context) {
    final currentIdx = _steps.indexOf(currentStatus);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      child: SizedBox(
        height: 60,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: _steps.length,
          itemBuilder: (_, i) {
            final isComplete = i <= currentIdx;
            final isCurrent = i == currentIdx;
            return Row(
              children: [
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 28, height: 28,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isComplete ? OncoAITheme.primary : Colors.grey[300],
                        border: isCurrent ? Border.all(color: OncoAITheme.secondary, width: 2) : null,
                      ),
                      child: Center(
                        child: isComplete && !isCurrent
                            ? const Icon(Icons.check, size: 16, color: Colors.white)
                            : Text('${i + 1}', style: TextStyle(fontSize: 11, color: isComplete ? Colors.white : Colors.grey[600], fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(_labels[i], style: TextStyle(fontSize: 9, color: isComplete ? OncoAITheme.primary : Colors.grey[400], fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal)),
                  ],
                ),
                if (i < _steps.length - 1) Container(width: 16, height: 2, color: i < currentIdx ? OncoAITheme.primary : Colors.grey[300]),
              ],
            );
          },
        ),
      ),
    );
  }
}
