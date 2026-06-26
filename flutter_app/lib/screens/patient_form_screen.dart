import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../services/api_service.dart';

class PatientFormScreen extends StatefulWidget {
  final int? patientId;
  const PatientFormScreen({super.key, this.patientId});
  @override
  State<PatientFormScreen> createState() => _PatientFormScreenState();
}

class _PatientFormScreenState extends State<PatientFormScreen> {
  final _formKey = GlobalKey<FormState>();
  int _step = 0;
  bool _saving = false;
  final _nameCtrl = TextEditingController();
  final _ageCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _conditionCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _dobCtrl = TextEditingController();
  final _pobCtrl = TextEditingController();
  final _occupCtrl = TextEditingController();
  final _nokNameCtrl = TextEditingController();
  final _nokPhoneCtrl = TextEditingController();
  final _nhifNumCtrl = TextEditingController();

  String _gender = 'Male';
  String _cancerType = '';
  String _cancerStage = '';
  String _maritalStatus = '';
  String _bloodGroup = '';
  String _smokingStatus = 'Never';
  String _alcoholUse = 'None';
  String _nokRelation = '';
  bool _nhifRegistered = false;

  final _stepTitles = ['Demographics', 'Medical Info', 'Cancer Details', 'Insurance & NOK'];

  @override
  void initState() {
    super.initState();
    if (widget.patientId != null) _loadPatient();
  }

  Future<void> _loadPatient() async {
    try {
      final p = await ApiService.instance.getData('/api/patients/${widget.patientId}');
      _nameCtrl.text = p['name'] ?? '';
      _ageCtrl.text = '${p['age'] ?? ''}';
      _phoneCtrl.text = p['phone'] ?? '';
      _emailCtrl.text = p['email'] ?? '';
      _addressCtrl.text = p['address'] ?? '';
      _conditionCtrl.text = p['medical_condition'] ?? '';
      _notesCtrl.text = p['notes'] ?? '';
      _dobCtrl.text = p['date_of_birth'] ?? '';
      _pobCtrl.text = p['place_of_birth'] ?? '';
      _occupCtrl.text = p['occupation'] ?? '';
      _nokNameCtrl.text = p['next_of_kin_name'] ?? '';
      _nokPhoneCtrl.text = p['next_of_kin_phone'] ?? '';
      _nhifNumCtrl.text = p['nhif_number'] ?? '';
      setState(() {
        _gender = p['gender'] ?? 'Male';
        _cancerType = p['cancer_type'] ?? '';
        _cancerStage = p['cancer_stage'] ?? '';
        _maritalStatus = p['marital_status'] ?? '';
        _bloodGroup = p['blood_group'] ?? '';
        _smokingStatus = p['smoking_status'] ?? 'Never';
        _alcoholUse = p['alcohol_use'] ?? 'None';
        _nokRelation = p['next_of_kin_relationship'] ?? '';
        _nhifRegistered = p['nhif_registered'] ?? false;
      });
    } catch (_) {}
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final body = {
      'name': _nameCtrl.text, 'gender': _gender,
      'age': int.tryParse(_ageCtrl.text), 'phone': _phoneCtrl.text,
      'email': _emailCtrl.text, 'address': _addressCtrl.text,
      'medical_condition': _conditionCtrl.text, 'notes': _notesCtrl.text,
      'cancer_type': _cancerType, 'cancer_stage': _cancerStage,
      'date_of_birth': _dobCtrl.text, 'place_of_birth': _pobCtrl.text,
      'marital_status': _maritalStatus, 'occupation': _occupCtrl.text,
      'blood_group': _bloodGroup, 'smoking_status': _smokingStatus,
      'alcohol_use': _alcoholUse,
      'next_of_kin_name': _nokNameCtrl.text, 'next_of_kin_phone': _nokPhoneCtrl.text,
      'next_of_kin_relationship': _nokRelation,
      'nhif_registered': _nhifRegistered, 'nhif_number': _nhifNumCtrl.text,
    };
    try {
      if (widget.patientId != null) {
        await ApiService.instance.putData('/api/patients/${widget.patientId}', body);
      } else {
        await ApiService.instance.postData('/api/patients', body);
      }
      if (mounted) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Patient saved'))); context.pop(); }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: OncoAITheme.danger));
    }
    setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.patientId != null ? 'Edit Patient' : 'New Patient')),
      body: Form(
        key: _formKey,
        child: Stepper(
          currentStep: _step,
          onStepContinue: () { if (_step < 3) {
            setState(() => _step++);
          } else {
            _save();
          } },
          onStepCancel: () { if (_step > 0) setState(() => _step--); },
          controlsBuilder: (_, details) => Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Row(
              children: [
                ElevatedButton(
                  onPressed: _saving ? null : details.onStepContinue,
                  child: _saving && _step == 3
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(_step == 3 ? 'Save' : 'Next'),
                ),
                const SizedBox(width: 8),
                if (_step > 0) TextButton(onPressed: details.onStepCancel, child: const Text('Back')),
              ],
            ),
          ),
          steps: [
            Step(title: Text(_stepTitles[0]), isActive: _step >= 0, content: _buildDemographics()),
            Step(title: Text(_stepTitles[1]), isActive: _step >= 1, content: _buildMedical()),
            Step(title: Text(_stepTitles[2]), isActive: _step >= 2, content: _buildCancer()),
            Step(title: Text(_stepTitles[3]), isActive: _step >= 3, content: _buildInsurance()),
          ],
        ),
      ),
    );
  }

  Widget _buildDemographics() => Column(children: [
    TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Full Name *'), validator: (v) => v!.isEmpty ? 'Required' : null),
    const SizedBox(height: 12),
    DropdownButtonFormField<String>(initialValue: _gender, decoration: const InputDecoration(labelText: 'Gender'), items: ['Male', 'Female'].map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(), onChanged: (v) => setState(() => _gender = v!)),
    const SizedBox(height: 12),
    TextFormField(controller: _ageCtrl, decoration: const InputDecoration(labelText: 'Age'), keyboardType: TextInputType.number),
    const SizedBox(height: 12),
    TextFormField(controller: _phoneCtrl, decoration: const InputDecoration(labelText: 'Phone'), keyboardType: TextInputType.phone),
    const SizedBox(height: 12),
    TextFormField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress),
    const SizedBox(height: 12),
    TextFormField(controller: _dobCtrl, decoration: const InputDecoration(labelText: 'Date of Birth')),
    const SizedBox(height: 12),
    TextFormField(controller: _pobCtrl, decoration: const InputDecoration(labelText: 'Place of Birth')),
    const SizedBox(height: 12),
    TextFormField(controller: _addressCtrl, decoration: const InputDecoration(labelText: 'Address'), maxLines: 2),
  ]);

  Widget _buildMedical() => Column(children: [
    TextFormField(controller: _conditionCtrl, decoration: const InputDecoration(labelText: 'Medical Condition'), maxLines: 3),
    const SizedBox(height: 12),
    DropdownButtonFormField<String>(initialValue: _bloodGroup.isEmpty ? null : _bloodGroup, decoration: const InputDecoration(labelText: 'Blood Group'),
      items: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(), onChanged: (v) => setState(() => _bloodGroup = v ?? '')),
    const SizedBox(height: 12),
    DropdownButtonFormField<String>(initialValue: _smokingStatus, decoration: const InputDecoration(labelText: 'Smoking Status'),
      items: ['Never', 'Former', 'Current', 'Unknown'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(), onChanged: (v) => setState(() => _smokingStatus = v!)),
    const SizedBox(height: 12),
    DropdownButtonFormField<String>(initialValue: _alcoholUse, decoration: const InputDecoration(labelText: 'Alcohol Use'),
      items: ['None', 'Occasional', 'Moderate', 'Heavy', 'Unknown'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(), onChanged: (v) => setState(() => _alcoholUse = v!)),
    const SizedBox(height: 12),
    TextFormField(controller: _notesCtrl, decoration: const InputDecoration(labelText: 'Notes'), maxLines: 3),
  ]);

  Widget _buildCancer() => Column(children: [
    DropdownButtonFormField<String>(initialValue: _cancerType.isEmpty ? null : _cancerType, decoration: const InputDecoration(labelText: 'Cancer Type'),
      items: ['Oral Cavity', 'Oropharynx', 'Hypopharynx', 'Nasopharynx', 'Larynx', 'Salivary Gland', 'Thyroid', 'Paranasal Sinus', 'Other'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(), onChanged: (v) => setState(() => _cancerType = v ?? '')),
    const SizedBox(height: 12),
    DropdownButtonFormField<String>(initialValue: _cancerStage.isEmpty ? null : _cancerStage, decoration: const InputDecoration(labelText: 'Cancer Stage'),
      items: ['Stage I', 'Stage II', 'Stage III', 'Stage IVA', 'Stage IVB', 'Stage IVC', 'Unknown'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(), onChanged: (v) => setState(() => _cancerStage = v ?? '')),
    const SizedBox(height: 12),
    DropdownButtonFormField<String>(initialValue: _maritalStatus.isEmpty ? null : _maritalStatus, decoration: const InputDecoration(labelText: 'Marital Status'),
      items: ['Single', 'Married', 'Divorced', 'Widowed'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(), onChanged: (v) => setState(() => _maritalStatus = v ?? '')),
    const SizedBox(height: 12),
    TextFormField(controller: _occupCtrl, decoration: const InputDecoration(labelText: 'Occupation')),
  ]);

  Widget _buildInsurance() => Column(children: [
    SwitchListTile(title: const Text('NHIF Registered'), value: _nhifRegistered, onChanged: (v) => setState(() => _nhifRegistered = v)),
    if (_nhifRegistered) TextFormField(controller: _nhifNumCtrl, decoration: const InputDecoration(labelText: 'NHIF Number')),
    const SizedBox(height: 16),
    const Text('Next of Kin', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
    const SizedBox(height: 12),
    TextFormField(controller: _nokNameCtrl, decoration: const InputDecoration(labelText: 'Name')),
    const SizedBox(height: 12),
    TextFormField(controller: _nokPhoneCtrl, decoration: const InputDecoration(labelText: 'Phone'), keyboardType: TextInputType.phone),
    const SizedBox(height: 12),
    DropdownButtonFormField<String>(initialValue: _nokRelation.isEmpty ? null : _nokRelation, decoration: const InputDecoration(labelText: 'Relationship'),
      items: ['Spouse', 'Parent', 'Child', 'Sibling', 'Other'].map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(), onChanged: (v) => setState(() => _nokRelation = v ?? '')),
  ]);
}
