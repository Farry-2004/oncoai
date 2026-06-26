import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../services/api_service.dart';

class PatientListScreen extends StatefulWidget {
  const PatientListScreen({super.key});
  @override
  State<PatientListScreen> createState() => _PatientListScreenState();
}

class _PatientListScreenState extends State<PatientListScreen> {
  List<dynamic> _patients = [];
  List<dynamic> _filtered = [];
  bool _loading = true;
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.instance.getData('/api/patients') as List;
      setState(() { _patients = data; _filtered = data; _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  void _search(String q) {
    if (q.isEmpty) {
      setState(() => _filtered = _patients);
    } else {
      final lower = q.toLowerCase();
      setState(() => _filtered = _patients.where((p) =>
        '${p['name']}'.toLowerCase().contains(lower) ||
        '${p['patient_code']}'.toLowerCase().contains(lower) ||
        '${p['cancer_type'] ?? ''}'.toLowerCase().contains(lower)
      ).toList());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Patient Records')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtrl,
              onChanged: _search,
              decoration: InputDecoration(
                hintText: 'Search by name, code, or cancer type...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      itemCount: _filtered.length,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemBuilder: (_, i) {
                        final p = _filtered[i];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: OncoAITheme.primary.withValues(alpha: 0.1),
                              child: Text('${p['name']}'[0].toUpperCase(), style: const TextStyle(color: OncoAITheme.primary, fontWeight: FontWeight.bold)),
                            ),
                            title: Text('${p['name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text('${p['patient_code']} • ${p['cancer_type'] ?? 'N/A'} • Age: ${p['age'] ?? '-'}'),
                            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                            onTap: () => context.push('/patients/${p['id']}'),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/patients/new'),
        icon: const Icon(Icons.person_add),
        label: const Text('New Patient'),
      ),
    );
  }
}
