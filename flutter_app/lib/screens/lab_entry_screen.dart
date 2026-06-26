import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../services/api_service.dart';

class LabEntryScreen extends StatefulWidget {
  final int patientId;
  const LabEntryScreen({super.key, required this.patientId});
  @override
  State<LabEntryScreen> createState() => _LabEntryScreenState();
}

class _LabEntryScreenState extends State<LabEntryScreen> {
  String _category = 'Hematology';
  bool _saving = false;
  final _controllers = <String, TextEditingController>{};

  static const _categories = {
    'Hematology': ['Hemoglobin', 'WBC', 'Platelets', 'RBC', 'HCT', 'MCV', 'MCH', 'Neutrophils', 'Lymphocytes', 'ESR'],
    'Chemistry': ['Glucose', 'HbA1c', 'Total Cholesterol', 'LDL', 'HDL', 'Triglycerides', 'Sodium', 'Potassium', 'Calcium', 'Chloride'],
    'Liver Function': ['ALT', 'AST', 'ALP', 'GGT', 'Total Bilirubin', 'Direct Bilirubin', 'Albumin', 'Total Protein'],
    'Renal Function': ['Creatinine', 'BUN', 'Uric Acid', 'eGFR'],
    'Tumor Markers': ['CEA', 'CA 19-9', 'CA 125', 'AFP', 'PSA', 'SCC Antigen', 'LDH', 'Beta-2 Microglobulin'],
    'Coagulation': ['PT', 'INR', 'aPTT', 'D-Dimer', 'Fibrinogen'],
    'Thyroid': ['TSH', 'Free T4', 'Free T3'],
    'HIV / Infectious': ['HIV 1/2', 'CD4 Count', 'Viral Load', 'HBsAg', 'Anti-HCV'],
    'Urinalysis': ['pH', 'Protein', 'Glucose', 'Blood', 'WBC'],
  };

  List<String> get _tests => _categories[_category] ?? [];

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  TextEditingController _ctrl(String test) => _controllers.putIfAbsent(test, () => TextEditingController());

  Future<void> _submit() async {
    final entries = <Map<String, String>>[];
    for (final test in _tests) {
      final val = _ctrl(test).text.trim();
      if (val.isNotEmpty) {
        entries.add({'test_name': test, 'test_value': val, 'status': _autoStatus(test, val)});
      }
    }
    if (entries.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter at least one value')));
      return;
    }
    setState(() => _saving = true);
    try {
      for (final entry in entries) {
        await ApiService.instance.postData('/api/patients/${widget.patientId}/lab-results', entry);
      }
      if (mounted) {
        HapticFeedback.mediumImpact();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${entries.length} results saved'), backgroundColor: OncoAITheme.success));
        context.pop();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: OncoAITheme.danger));
    }
    setState(() => _saving = false);
  }

  String _autoStatus(String test, String val) {
    final num = double.tryParse(val);
    if (num == null) return 'Pending';
    final ranges = {
      'Hemoglobin': [12.0, 17.0], 'WBC': [4.0, 11.0], 'Platelets': [150.0, 400.0],
      'Glucose': [70.0, 110.0], 'Creatinine': [0.6, 1.2], 'ALT': [7.0, 56.0],
      'AST': [10.0, 40.0], 'TSH': [0.4, 4.0],
    };
    final range = ranges[test];
    if (range == null) return 'Normal';
    if (num < range[0] * 0.5 || num > range[1] * 2) return 'Critical';
    if (num < range[0]) return 'Low';
    if (num > range[1]) return 'High';
    return 'Normal';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Quick Lab Entry')),
      body: Column(
        children: [
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              children: _categories.keys.map((cat) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(cat, style: const TextStyle(fontSize: 12)),
                  selected: _category == cat,
                  selectedColor: OncoAITheme.primary,
                  labelStyle: TextStyle(color: _category == cat ? Colors.white : null),
                  onSelected: (_) => setState(() => _category = cat),
                ),
              )).toList(),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: _tests.map((test) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: TextFormField(
                  controller: _ctrl(test),
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: test,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    suffixIcon: _ctrl(test).text.isNotEmpty
                        ? const Icon(Icons.check_circle, color: OncoAITheme.success)
                        : null,
                  ),
                  onChanged: (_) => setState(() {}),
                ),
              )).toList(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _saving ? null : _submit,
                icon: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.save),
                label: Text(_saving ? 'Saving...' : 'Save Results'),
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
