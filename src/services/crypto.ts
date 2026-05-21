import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import type { EncryptedPayload } from '../types';

/**
 * Генерирует пару ключей X25519 для E2E-шифрования.
 * Возвращает publicKey и privateKey в Base64.
 *
 * Бинарно совместима с generateKeyPair() из VoidChatApp (React Native).
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    privateKey: encodeBase64(keyPair.secretKey),
  };
}

/**
 * Вычисляет общий секрет (shared secret) из публичного ключа собеседника
 * и своего приватного ключа через X25519 (nacl.box.before).
 * Используется для симметричного шифрования сообщений.
 *
 * Бинарно совместима с deriveSharedSecret() из VoidChatApp.
 */
export function deriveSharedSecret(publicKey: string, privateKey: string): string {
  const pubKeyBytes = decodeBase64(publicKey);
  const privKeyBytes = decodeBase64(privateKey);
  const sharedSecret = nacl.box.before(pubKeyBytes, privKeyBytes);
  return encodeBase64(sharedSecret);
}

/**
 * Шифрует сообщение с использованием shared secret (XSalsa20-Poly1305).
 * Генерирует уникальный nonce (24 байта) для каждого сообщения.
 *
 * Бинарно совместима с encryptMessage() из VoidChatApp.
 *
 * @param message — открытый текст сообщения
 * @param sharedSecret — общий секрет в Base64 (из deriveSharedSecret)
 * @returns EncryptedPayload с ciphertext и nonce в Base64
 */
export function encryptMessage(message: string, sharedSecret: string): EncryptedPayload {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const sharedSecretBytes = decodeBase64(sharedSecret);
  const messageBytes = decodeUTF8(message);
  const ciphertext = nacl.secretbox(messageBytes, nonce, sharedSecretBytes);

  if (!ciphertext) {
    throw new Error('Encryption failed — nacl.secretbox returned null');
  }

  return {
    ciphertext: encodeBase64(ciphertext),
    nonce: encodeBase64(nonce),
  };
}

/**
 * Дешифрует сообщение с использованием shared secret.
 * Возвращает исходный текст или выбрасывает ошибку при неудаче.
 *
 * Бинарно совместима с decryptMessage() из VoidChatApp.
 *
 * @param ciphertext — зашифрованные данные в Base64
 * @param nonce — nonce в Base64
 * @param sharedSecret — общий секрет в Base64
 * @returns расшифрованный текст
 * @throws Error если дешифровка не удалась (неверный ключ, повреждённые данные)
 */
export function decryptMessage(
  ciphertext: string,
  nonce: string,
  sharedSecret: string,
): string {
  const nonceBytes = decodeBase64(nonce);
  const ciphertextBytes = decodeBase64(ciphertext);
  const sharedSecretBytes = decodeBase64(sharedSecret);
  const decryptedBytes = nacl.secretbox.open(ciphertextBytes, nonceBytes, sharedSecretBytes);

  if (!decryptedBytes) {
    throw new Error('Decryption failed — nacl.secretbox.open returned null');
  }

  return encodeUTF8(decryptedBytes);
}
