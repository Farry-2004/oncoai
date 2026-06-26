import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _institutionCtrl = TextEditingController();
  String _specialty = 'Medical Officer';
  bool _obscure = true;

  final _specialties = [
    'Oncologist', 'Surgeon', 'Radiologist', 'Pathologist', 'Nurse',
    'TB Coordinator', 'Nutritionist', 'Social Worker', 'Dentist',
    'Medical Officer', 'Pharmacist', 'Admin',
  ];

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authProvider.notifier).register(
      fullName: _nameCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      password: _passwordCtrl.text,
      specialty: _specialty,
      phone: _phoneCtrl.text.trim(),
      institution: _institutionCtrl.text.trim(),
    );
    if (!mounted) return;
    final state = ref.read(authProvider);
    if (state.isLoggedIn) {
      context.go('/home');
    } else if (state.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.error!), backgroundColor: OncoAITheme.danger));
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [OncoAITheme.primary, OncoAITheme.primaryDeep]),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const Icon(Icons.biotech, size: 48, color: OncoAITheme.secondary),
                  const SizedBox(height: 8),
                  const Text('Create Account', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 24),
                  Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            TextFormField(
                              controller: _nameCtrl,
                              decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline)),
                              validator: (v) => v != null && v.isNotEmpty ? null : 'Required',
                            ),
                            const SizedBox(height: 14),
                            DropdownButtonFormField<String>(
                              initialValue: _specialty,
                              decoration: const InputDecoration(labelText: 'Specialty', prefixIcon: Icon(Icons.medical_services_outlined)),
                              items: _specialties.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                              onChanged: (v) => setState(() => _specialty = v ?? _specialty),
                            ),
                            const SizedBox(height: 14),
                            TextFormField(
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined)),
                              validator: (v) => v != null && v.contains('@') ? null : 'Enter valid email',
                            ),
                            const SizedBox(height: 14),
                            TextFormField(
                              controller: _phoneCtrl,
                              keyboardType: TextInputType.phone,
                              decoration: const InputDecoration(labelText: 'Phone (optional)', prefixIcon: Icon(Icons.phone_outlined)),
                            ),
                            const SizedBox(height: 14),
                            TextFormField(
                              controller: _institutionCtrl,
                              decoration: const InputDecoration(labelText: 'Institution (optional)', prefixIcon: Icon(Icons.business_outlined)),
                            ),
                            const SizedBox(height: 14),
                            TextFormField(
                              controller: _passwordCtrl,
                              obscureText: _obscure,
                              decoration: InputDecoration(
                                labelText: 'Password',
                                prefixIcon: const Icon(Icons.lock_outline),
                                suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility), onPressed: () => setState(() => _obscure = !_obscure)),
                              ),
                              validator: (v) => v != null && v.length >= 6 ? null : 'Min 6 characters',
                            ),
                            const SizedBox(height: 20),
                            ElevatedButton(
                              onPressed: authState.isLoading ? null : _register,
                              child: authState.isLoading
                                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : const Text('Create Account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Already have an account? ', style: TextStyle(color: Colors.white.withValues(alpha: 0.7))),
                      GestureDetector(onTap: () => context.go('/login'), child: const Text('Sign In', style: TextStyle(color: OncoAITheme.secondary, fontWeight: FontWeight.w600))),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
