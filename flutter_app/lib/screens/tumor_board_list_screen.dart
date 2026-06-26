import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../services/api_service.dart';

class TumorBoardListScreen extends StatefulWidget {
  const TumorBoardListScreen({super.key});
  @override
  State<TumorBoardListScreen> createState() => _TumorBoardListScreenState();
}

class _TumorBoardListScreenState extends State<TumorBoardListScreen> {
  List<dynamic> _boards = [];
  bool _loading = true;
  String _filter = 'all';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _boards = await ApiService.instance.getData('/api/tumor-boards');
      setState(() => _loading = false);
    } catch (_) { setState(() => _loading = false); }
  }

  List<dynamic> get _filtered => _filter == 'all' ? _boards : _boards.where((b) => b['status'] == _filter).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tumor Board Meetings')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                _filterChip('All', 'all'),
                _filterChip('Scheduled', 'scheduled'),
                _filterChip('In Progress', 'in_progress'),
                _filterChip('Completed', 'completed'),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _filtered.isEmpty
                    ? const Center(child: Text('No meetings found'))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          itemCount: _filtered.length,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          itemBuilder: (_, i) => _BoardCard(board: _filtered[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label, style: const TextStyle(fontSize: 12)),
        selected: _filter == value,
        selectedColor: OncoAITheme.primary,
        labelStyle: TextStyle(color: _filter == value ? Colors.white : null),
        onSelected: (_) => setState(() => _filter = value),
      ),
    );
  }
}

class _BoardCard extends StatelessWidget {
  final Map<String, dynamic> board;
  const _BoardCard({required this.board});

  @override
  Widget build(BuildContext context) {
    final status = board['status'] ?? 'scheduled';
    final statusColors = {
      'scheduled': OncoAITheme.info,
      'in_progress': OncoAITheme.warning,
      'completed': OncoAITheme.success,
    };
    final color = statusColors[status] ?? Colors.grey;
    final participants = (board['participants'] as List?)?.length ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/tumor-boards/${board['id']}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.groups, color: color),
                  const SizedBox(width: 8),
                  Expanded(child: Text('Chair: ${board['chairperson'] ?? 'TBD'}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                    child: Text(status.replaceAll('_', ' ').toUpperCase(), style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(board['scheduled_date'] ?? '', style: TextStyle(color: Colors.grey[600])),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.people, size: 16, color: Colors.grey[400]),
                  const SizedBox(width: 4),
                  Text('$participants participants', style: TextStyle(color: Colors.grey[500], fontSize: 13)),
                  const Spacer(),
                  if (board['vote_result'] != null) ...[
                    Icon(Icons.how_to_vote, size: 16, color: Colors.grey[400]),
                    const SizedBox(width: 4),
                    Text(board['vote_result'], style: TextStyle(color: Colors.grey[500], fontSize: 13)),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
