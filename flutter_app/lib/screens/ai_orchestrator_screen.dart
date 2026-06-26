import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/api_service.dart';

class AIOrchestratorScreen extends StatefulWidget {
  const AIOrchestratorScreen({super.key});
  @override
  State<AIOrchestratorScreen> createState() => _AIOrchestratorScreenState();
}

class _AIOrchestratorScreenState extends State<AIOrchestratorScreen> {
  List<dynamic> _patients = [];
  int? _selectedPatient;
  bool _loading = false;
  Map<String, dynamic>? _results;
  final _agents = {
    'PatientProfileAgent': true,
    'DocumentAnalysisAgent': true,
    'ClinicalTrialAgent': true,
    'MedicationReviewAgent': true,
    'LiteratureSearchAgent': true,
    'RecommendationAgent': true,
  };

  @override
  void initState() { super.initState(); _loadPatients(); }

  Future<void> _loadPatients() async {
    try {
      _patients = await ApiService.instance.getData('/api/patients');
      setState(() {});
    } catch (_) {}
  }

  Future<void> _run() async {
    if (_selectedPatient == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select a patient first')));
      return;
    }
    final selected = _agents.entries.where((e) => e.value).map((e) => e.key).toList();
    if (selected.isEmpty) return;

    setState(() { _loading = true; _results = null; });
    try {
      _results = await ApiService.instance.postData('/api/orchestrate', {'patient_id': _selectedPatient, 'agents': selected});
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: OncoAITheme.danger));
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI Orchestrator')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Select Patient', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<int>(
                    initialValue: _selectedPatient,
                    decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Choose patient...'),
                    items: _patients.map<DropdownMenuItem<int>>((p) => DropdownMenuItem(value: p['id'], child: Text('${p['name']} (${p['patient_code']})'))).toList(),
                    onChanged: (v) => setState(() => _selectedPatient = v),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Select Agents', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                  ..._agents.entries.map((e) => CheckboxListTile(
                    title: Text(_agentLabel(e.key)),
                    subtitle: Text(_agentDesc(e.key), style: const TextStyle(fontSize: 12)),
                    value: e.value,
                    activeColor: OncoAITheme.primary,
                    onChanged: (v) => setState(() => _agents[e.key] = v ?? false),
                    dense: true,
                  )),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _loading ? null : _run,
              icon: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.play_arrow),
              label: Text(_loading ? 'Running Agents...' : 'Run Analysis'),
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            ),
          ),
          if (_results != null) ...[
            const SizedBox(height: 20),
            const Text('Results', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18)),
            const SizedBox(height: 8),
            ...(_results!['results'] as Map<String, dynamic>? ?? {}).entries.map((e) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ExpansionTile(
                leading: Icon(e.value['error'] != null ? Icons.error : Icons.check_circle, color: e.value['error'] != null ? OncoAITheme.danger : OncoAITheme.success),
                title: Text(_agentLabel(e.key), style: const TextStyle(fontWeight: FontWeight.w600)),
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(e.value['summary'] ?? e.value['error'] ?? 'No output', style: const TextStyle(fontSize: 14)),
                  ),
                ],
              ),
            )),
            if (_results!['compiled_report'] != null) ...[
              const SizedBox(height: 12),
              Card(
                color: OncoAITheme.primary.withValues(alpha: 0.05),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Compiled Report', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                      const SizedBox(height: 8),
                      Text(_results!['compiled_report'], style: const TextStyle(fontSize: 14)),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  String _agentLabel(String key) => {
    'PatientProfileAgent': 'Patient Profile',
    'DocumentAnalysisAgent': 'Document Analysis',
    'ClinicalTrialAgent': 'Clinical Trial Matching',
    'MedicationReviewAgent': 'Medication Review',
    'LiteratureSearchAgent': 'Literature Search',
    'RecommendationAgent': 'Recommendations',
  }[key] ?? key;

  String _agentDesc(String key) => {
    'PatientProfileAgent': 'Compile demographics and history',
    'DocumentAnalysisAgent': 'Extract findings from documents',
    'ClinicalTrialAgent': 'Match patient to clinical trials',
    'MedicationReviewAgent': 'Review medications and interactions',
    'LiteratureSearchAgent': 'Search relevant literature',
    'RecommendationAgent': 'Generate treatment recommendations',
  }[key] ?? '';
}
