import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/api_service.dart';

class TumorBoardDetailScreen extends StatefulWidget {
  final int boardId;
  const TumorBoardDetailScreen({super.key, required this.boardId});
  @override
  State<TumorBoardDetailScreen> createState() => _TumorBoardDetailScreenState();
}

class _TumorBoardDetailScreenState extends State<TumorBoardDetailScreen> {
  Map<String, dynamic>? _board;
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      _board = await ApiService.instance.getData('/api/tumor-boards/${widget.boardId}');
      setState(() => _loading = false);
    } catch (_) { setState(() => _loading = false); }
  }

  Future<void> _join() async {
    try {
      await ApiService.instance.postData('/api/tumor-boards/${widget.boardId}/join', {});
      _load();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Joined meeting'), backgroundColor: OncoAITheme.success));
    } catch (_) {}
  }

  Future<void> _vote(String vote) async {
    try {
      await ApiService.instance.postData('/api/tumor-boards/${widget.boardId}/vote', {'vote': vote});
      _load();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Vote: $vote recorded'), backgroundColor: OncoAITheme.success));
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(appBar: AppBar(title: const Text('TB Meeting')), body: const Center(child: CircularProgressIndicator()));
    if (_board == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Meeting not found')));
    final b = _board!;
    final participants = (b['participants'] as List?) ?? [];
    final checklist = {
      'Patient Summary': b['checklist_patient_summary'] ?? false,
      'Diagnostic Review': b['checklist_diagnostic_review'] ?? false,
      'Treatment Considerations': b['checklist_treatment_considerations'] ?? false,
      'Recommendations': b['checklist_recommendations'] ?? false,
      'Follow-up Plan': b['checklist_follow_up_plan'] ?? false,
    };
    final completedChecks = checklist.values.where((v) => v).length;

    return Scaffold(
      appBar: AppBar(title: const Text('TB Meeting')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Chair: ${b['chairperson'] ?? 'TBD'}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Date: ${b['scheduled_date'] ?? ''}', style: TextStyle(color: Colors.grey[600])),
                  Text('Status: ${b['status'] ?? ''}', style: TextStyle(color: Colors.grey[600])),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(onPressed: _join, icon: const Icon(Icons.login), label: const Text('Join Meeting')),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Discussion Checklist ($completedChecks/5)', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(value: completedChecks / 5, backgroundColor: Colors.grey[200], color: OncoAITheme.primary),
                  const SizedBox(height: 12),
                  ...checklist.entries.map((e) => CheckboxListTile(
                    title: Text(e.key),
                    value: e.value,
                    activeColor: OncoAITheme.primary,
                    onChanged: (_) {},
                  )),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Treatment Vote', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8, runSpacing: 8,
                    children: ['Surgery', 'Radiation', 'Chemotherapy', 'Clinical Trial', 'Supportive Care', 'Deferred'].map((v) =>
                      ElevatedButton(
                        onPressed: () => _vote(v),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: b['vote_result'] == v ? OncoAITheme.primary : Colors.grey[200],
                          foregroundColor: b['vote_result'] == v ? Colors.white : Colors.black87,
                        ),
                        child: Text(v, style: const TextStyle(fontSize: 13)),
                      ),
                    ).toList(),
                  ),
                  if (b['vote_result'] != null) ...[
                    const SizedBox(height: 8),
                    Text('Current vote: ${b['vote_result']}', style: const TextStyle(fontWeight: FontWeight.w500)),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Participants (${participants.length})', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                  const SizedBox(height: 8),
                  ...participants.map((p) => ListTile(
                    leading: CircleAvatar(
                      backgroundColor: OncoAITheme.primary.withValues(alpha: 0.1),
                      child: Text('${(p['name'] ?? '?')[0]}', style: const TextStyle(color: OncoAITheme.primary)),
                    ),
                    title: Text(p['name'] ?? 'Unknown'),
                    subtitle: Text(p['specialty'] ?? ''),
                    dense: true,
                  )),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
