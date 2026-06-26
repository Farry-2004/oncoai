import 'dart:async';
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:oncoai/config/api_config.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketService {
  WebSocketChannel? _channel;
  Timer? _heartbeatTimer;
  Timer? _reconnectTimer;
  bool _isConnected = false;
  bool _shouldReconnect = true;

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  final StreamController<Map<String, dynamic>> _messageController =
      StreamController<Map<String, dynamic>>.broadcast();

  /// Stream of parsed incoming messages.
  Stream<Map<String, dynamic>> get messages => _messageController.stream;

  /// Whether the WebSocket is currently connected.
  bool get isConnected => _isConnected;

  /// Open the WebSocket connection.
  ///
  /// Reads the auth token from secure storage and appends it as a query
  /// parameter. Starts auto-reconnect and heartbeat once connected.
  Future<void> connect() async {
    _shouldReconnect = true;
    await _connectInternal();
  }

  Future<void> _connectInternal() async {
    try {
      final token = await _storage.read(key: 'auth_token');
      if (token == null) return;

      // Derive WebSocket URL from the HTTP base URL.
      final httpUri = Uri.parse(ApiConfig.baseUrl);
      final wsScheme = httpUri.scheme == 'https' ? 'wss' : 'ws';
      final wsUri = Uri(
        scheme: wsScheme,
        host: httpUri.host,
        port: httpUri.port,
        path: '/ws',
        queryParameters: {'token': token},
      );

      _channel = WebSocketChannel.connect(wsUri);
      _isConnected = true;

      _startHeartbeat();

      _channel!.stream.listen(
        (dynamic raw) {
          try {
            final decoded = raw is String
                ? jsonDecode(raw) as Map<String, dynamic>
                : raw as Map<String, dynamic>;
            _messageController.add(decoded);
          } catch (_) {
            // Ignore messages that cannot be decoded.
          }
        },
        onError: (Object error) {
          _handleDisconnect();
        },
        onDone: () {
          _handleDisconnect();
        },
        cancelOnError: false,
      );
    } catch (_) {
      _handleDisconnect();
    }
  }

  /// Send a JSON-encodable message through the WebSocket.
  void send(Map<String, dynamic> message) {
    if (_channel != null && _isConnected) {
      _channel!.sink.add(jsonEncode(message));
    }
  }

  /// Gracefully close the connection. Does not auto-reconnect afterwards.
  Future<void> disconnect() async {
    _shouldReconnect = false;
    _stopHeartbeat();
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _isConnected = false;
    await _channel?.sink.close();
    _channel = null;
  }

  /// Dispose the service entirely. Call when the service is no longer needed.
  void dispose() {
    _shouldReconnect = false;
    _stopHeartbeat();
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    _messageController.close();
  }

  // ---------------------------------------------------------------------------
  // Heartbeat
  // ---------------------------------------------------------------------------

  void _startHeartbeat() {
    _stopHeartbeat();
    _heartbeatTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) {
        if (_isConnected && _channel != null) {
          try {
            _channel!.sink.add(jsonEncode({'type': 'ping'}));
          } catch (_) {
            _handleDisconnect();
          }
        }
      },
    );
  }

  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  // ---------------------------------------------------------------------------
  // Reconnection
  // ---------------------------------------------------------------------------

  void _handleDisconnect() {
    _isConnected = false;
    _stopHeartbeat();
    _channel = null;

    if (_shouldReconnect) {
      _reconnectTimer?.cancel();
      _reconnectTimer = Timer(
        const Duration(seconds: 5),
        () async {
          await _connectInternal();
        },
      );
    }
  }
}
